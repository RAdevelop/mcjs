"use strict";

//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
//const BaseModel = require('app/lib/db');
const UserModel = require('app/models/user');

class UserGroups extends UserModel
{
	/**
	 * список групп
	 * @param ug_ids - массив id групп
	 * @returns {Promise}
	 */
	getAll(ug_ids = [])
	{
		let placeHolders = (ug_ids.length && ug_ids.length > 0 ? this.constructor.placeHoldersForIn(ug_ids) : null);
		let where = (placeHolders ? `WHERE ug_id IN(${placeHolders})` : '');

		let sql = `SELECT ug_id, ug_pid, ug_path, ug_name, ug_desc, ug_level, ug_lk, ug_rk, ug_on_register, REPEAT('&nbsp;', IF(ug_level > 1, (ug_level-1)*2, 0)) AS ug_nbsp
			FROM users_groups ${where}
			ORDER BY ug_lk`;
		
		return this.constructor.conn().s(sql, ug_ids);
	}

	/**
	 * группа по ее id
	 * 
	 * @param ug_id
	 * @returns {Promise}
	 */
	getById(ug_id)
	{
		let sql = `SELECT ug_id, ug_pid, ug_path, ug_name, ug_desc, ug_level, ug_lk, ug_rk, ug_on_register
		FROM users_groups 
		WHERE ug_id = ?`;

		return this.constructor.conn().sRow(sql, [ug_id]);
	}

	/**
	 * обвноляем данные группы
	 * @param ug_id
	 * @param ug_pid
	 * @param ug_after_id
	 * @param ug_path
	 * @param ug_name
	 * @param ug_desc
	 * @param ug_on_register
	 * @returns {Promise}
	 */
	updById(ug_id, ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register)
	{
		ug_path = ug_path.toLowerCase();
		ug_on_register = (ug_on_register||parseInt(ug_on_register, 10) ? 1 : 0);

		let sql = `CALL users_groups_update(?, ?, ?, ?, ?, ?,?,@res); SELECT @res AS res FROM DUAL;`;

		let sqlData = [ug_id, ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register];

		return this.constructor.conn().call(sql, sqlData)
			.then((res) => {

				if (!(res[1][0] && res[1][0]["res"]))
					throw new Errors.HttpError(500, 'не удалось обновить группу');

				return Promise.resolve(ug_id);
			})
			.catch((err) => {

				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * добавляем новую группу в БД
	 *
	 * @param ug_pid
	 * @param ug_after_id
	 * @param ug_path
	 * @param ug_name
	 * @param ug_desc
	 * @param ug_on_register
	 * @returns {Promise}
	 */
	add(ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register)
	{
		ug_path = ug_path.toLowerCase();
		ug_on_register = (ug_on_register||parseInt(ug_on_register, 10) ? 1 : 0);
		
		let sql = `CALL users_groups_create(?, ?, ?, ?, ?,?,@ug_id); SELECT @ug_id AS ug_id FROM DUAL;`;

		let sqlData = [ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register];

		return this.constructor.conn().multis(sql, sqlData)
			.then((res) => {

				let ug_id = (res[1][0] && res[1][0]["ug_id"] ? res[1][0]["ug_id"] : 0);

				if (!ug_id)
					throw new Errors.HttpError(500, 'не удалось создать группу');

				return Promise.resolve(ug_id);
			})
			.catch((err) => {

				if (err.name == 'DbErrDuplicateEntry')
				throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * список прав (по сути - методов) для указанной группы
	 * @param ug_id - id группы
	 * @param m_id - id меню
	 * @param allMethods - true все методы (права), включая те, что не прияызаны; false - только привязанные
	 * @returns {*}
	 */
	getRights(ug_id, m_id, allMethods)
	{
		let leftJoin = (allMethods ? 'LEFT' : '');

		let sql =
			`SELECT 
			${ug_id} AS ug_id, m.m_id, m.c_id, cm.cm_id, cm.cm_method, IF(ugr.cm_id IS NULL, 0, 1) AS b_allowed
			FROM (SELECT NULL) AS z
			JOIN menu AS m ON(m.m_id = ?)
			JOIN controllers_methods AS cm ON(cm.c_id = m.c_id)
			${leftJoin} JOIN users_groups_rights AS ugr ON(
				ugr.ug_id = ? AND ugr.m_id = m.m_id AND ugr.c_id = cm.c_id AND ugr.cm_id = cm.cm_id
			)`;

		let sqlData = [m_id, ug_id];
		//console.log(sql, sqlData);

		return this.constructor.conn().ps(sql, sqlData);
	}

	/**
	 * сохраняем права группы пользователей для выбранного пункта меню
	 *
	 * @param ug_id - id группы
	 * @param m_id - id меню
	 * @param c_id  - id контроллера
	 * @param cm_ids - массив id методов
	 * @returns {Promise}
	 */
	saveRights(ug_id, m_id, c_id, cm_ids = [])
	{
		//удалить все записи по ug_id, m_id, c_id кроме групп админов и рутов
		//cm_ids - если не пустой, то для каждого метода добавить связи ug_id, m_id, c_id, cm_id

		return this.getAll([ug_id])
			.then((ug) => {

				let ug_ids_for_del = [];
				let ug_group = {};

				if (!ug['info']['numRows'] )
					return Promise.resolve([ug_group, ug_ids_for_del]);

				ug_group = ug[0];

				//права удаляем так же для всех потомков, кроме root, admin
				let sql = `SELECT ug_id, ug_path FROM users_groups 
				WHERE ug_lk >= ? AND ug_rk <= ?`;

				return this.constructor.conn().s(sql, [ug_group['ug_lk'], ug_group['ug_rk']])
					.then((list) => {

						list.forEach((item) => {

							item['ug_path'] = item['ug_path'].toLowerCase();

							if (item['ug_path'] != 'root' && item['ug_path'] != 'admin')
								ug_ids_for_del.push(item['ug_id']);
						});

						return Promise.resolve([ug_group, ug_ids_for_del]);
					});
			})
			.spread((ug_group, ug_ids_for_del) => {

				if (!ug_ids_for_del.length)
					return Promise.resolve(ug_group);

				let placeHolders = this.constructor.placeHoldersForIn(ug_ids_for_del);

				let sql = `DELETE FROM users_groups_rights WHERE ug_id IN(${placeHolders}) AND m_id = ? AND c_id = ?`;
				let sqlData = ug_ids_for_del;
				sqlData.push(m_id, c_id);

				return this.constructor.conn().del(sql, sqlData)
					.then(() => {
						return Promise.resolve(ug_group);
					});
			})
			.then((ug_group) => {

				if (!cm_ids.length || !ug_group['ug_id'])
					return Promise.resolve(1);

				//права так же выставляем для всех родительских групп
				let sql = `SELECT ug_id FROM users_groups WHERE ug_lk <= ? AND ug_rk >= ?`;

				return this.constructor.conn().s(sql, [ug_group['ug_lk'], ug_group['ug_rk']])
					.then((g_list) => {

						let sql_vals = [];
						let sqlData = [];

						g_list.forEach((g_id) => {

							cm_ids.forEach((cm_id) => {
								sql_vals.push(`(?,?,?,?)`);
								sqlData.push(g_id['ug_id'], m_id, c_id, cm_id);
							});
						});

						let sql = `INSERT INTO users_groups_rights (ug_id, m_id, c_id, cm_id) VALUES ${sql_vals.join(',')}
						ON DUPLICATE KEY UPDATE 
						ug_id=VALUES(ug_id), m_id=VALUES(m_id), c_id=VALUES(c_id), cm_id=VALUES(cm_id)`;

						return this.constructor.conn().ins(sql, sqlData);
					});
			});
	}

	/**
	 * добавляем пользователя в указанные группы
	 * @param u_id
	 * @param ug_ids
	 * @returns {Promise}
	 */
	addUserToGroups(u_id, ug_ids = [])
	{
		if (u_id == 1)//root
			return Promise.resolve(u_id);

		return Promise.resolve()
			.then(() => {

				if (!ug_ids.length)
					return Promise.resolve(ug_ids);

				return this.getAll(ug_ids)
					.then((ug_list) => {

						if (!ug_list)
							return Promise.resolve(ug_ids);

						let groups = [];

						//работаем только с реальными id групп
						ug_list.forEach((g) => {
							groups.push(g['ug_id']);
						});

						return Promise.resolve(groups);
					})
			})
			.then((ug_ids) => {

				let where = ['u_id = ?'];
				let sqlData = [u_id];
				if (ug_ids.length)
				{
					let placeHolders = this.constructor.placeHoldersForIn(ug_ids);
					where.push(`ug_id NOT IN(${placeHolders})`);

					sqlData = sqlData.concat(ug_ids);
				}

				let sql = `DELETE FROM users_in_groups
				WHERE ${where.join(' AND ')} `;

				/*let sql = `DELETE FROM users_in_groups
				WHERE u_id = ?;`;
				sqlData = [u_id]
				*/

				return this.constructor.conn().del(sql, sqlData)
					.then(() => {

						return Promise.resolve(ug_ids);
					});
			})
			.then((ug_ids) => {

				let sqlData = [];
				let sql = ``;

				if (ug_ids.length)
				{
					let sql_vals = [];
					ug_ids.forEach((ug_id) => {

						sql_vals.push('(?,?)');
						sqlData.push(u_id, ug_id);
					});

					sql += `INSERT INTO users_in_groups (u_id, ug_id) VALUES ${sql_vals.join(',')}
						ON DUPLICATE KEY UPDATE 
						ug_id=VALUES(ug_id);`;
				}

				sql += `UPDATE users SET ug_ids = ? WHERE u_id = ?`;
				sqlData.push(ug_ids.join(','), u_id);

				return this.constructor.conn().multis(sql, sqlData)
					.then(() => {
						return Promise.resolve(u_id);
					});
			});
	}

	/**
	 * список групп пользователей, которые назначаются при регистрации
	 * @returns {Promise}
	 */
	getGroupsOnRegister()
	{
		let sql = `SELECT ug_id, ug_pid, ug_path, ug_name, ug_desc, ug_level, ug_lk, ug_rk, ug_on_register, REPEAT('&nbsp;', IF(ug_level > 1, (ug_level-1)*2, 0)) AS ug_nbsp
			FROM users_groups
			WHERE ug_on_register = ?`;
		return this.constructor.conn().s(sql, [1]);
	}

	/**
	 * список права для группы в указанный пункт меню
	 *
	 * @param m_id
	 * @param ug_path
	 * @returns {Promise}
	 */
	getGroupRightsByPathAndMenu(m_id, ug_path)
	{
		let sqlData = [m_id, ug_path];
		let sql =
			`SELECT ug.ug_id, m.m_id, cm.cm_id, cm.cm_method
			FROM (SELECT NULL) AS z
			JOIN menu AS m ON(m.m_id = ?)
			JOIN users_groups AS ug ON(ug.ug_path = ?)
			JOIN controllers_methods AS cm ON(cm.c_id = m.c_id)
			JOIN users_groups_rights AS ugr ON(ugr.ug_id = ug.ug_id AND ugr.m_id = m.m_id AND ugr.c_id = cm.c_id 
			AND ugr.cm_id = cm.cm_id)`;

		/*let sql =
			`SELECT EXISTS(
				SELECT 1
				FROM (SELECT NULL) AS z
				JOIN menu AS m ON(m.m_id = ?)
				JOIN users_groups AS ug ON(ug.ug_path = ?)
				JOIN controllers_methods AS cm ON(cm.c_id = m.c_id AND cm.cm_method = ?)
				JOIN users_groups_rights AS ugr ON(ugr.ug_id = ug.ug_id AND ugr.m_id = m.m_id AND ugr.c_id = cm.c_id 
				AND ugr.cm_id = cm.cm_id) 
			) AS b_allowed`;
		 let sqlData = [m_id, ug_path, cm_method];
			*/

		return this.constructor.conn().ps(sql, sqlData)
			.then((res) => {
				if (!res || res['info']['numRows'] == 0)
					return Promise.resolve({});

				let rights = {};

				res.forEach((item) => {
					rights[item['cm_method']] = item['m_id'];
				});

				return Promise.resolve(rights);
			});
	}


	/**
	 * список прав для указанного пользователя
	 *
	 * @param int m_id - id меню
	 * @param array ug_ids - id групп пользователя
	 * @returns {Promise}
	 */
	getUserRights(m_id, ug_ids)
	{
		let ugPlaceHolders = this.constructor.placeHoldersForIn(ug_ids);

		let sqlData = [].concat(ug_ids);

		sqlData.unshift(m_id);

		let sql = `SELECT m.m_id, cm.cm_method
		FROM (SELECT NULL) AS z
		JOIN menu AS m ON(m.m_id = ?)
		JOIN controllers_methods AS cm ON(cm.c_id = m.c_id)
		JOIN users_groups_rights AS ugr ON(
			ugr.m_id = m.m_id AND ugr.c_id = cm.c_id AND ugr.cm_id = cm.cm_id
			AND ugr.ug_id IN (${ugPlaceHolders}) 
		)
		GROUP BY cm.cm_id`;

		//console.log(sql, sqlData);

		return this.constructor.conn().ps(sql, sqlData)
			.then((res) => {

				if (!res || res['info']['numRows'] == 0)
					return Promise.resolve({});

				let rights = {};

				res.forEach((item) => {
					rights[item['cm_method']] =item['m_id'];
				});

				return Promise.resolve(rights);
			});

		/*let placeHolders = this.constructor.placeHoldersForIn(ug_ids);
		let sql =
			`SELECT EXISTS(
				SELECT 1
				FROM (SELECT NULL) AS z
				JOIN menu AS m ON(m.m_id = ?)
				JOIN controllers_methods AS cm ON(cm.c_id = m.c_id AND cm.cm_method = ?)
				JOIN users_groups_rights AS ugr ON(
					ugr.m_id = m.m_id AND ugr.c_id = cm.c_id AND ugr.cm_id = cm.cm_id 
					AND ugr.ug_id IN (${placeHolders})
				)
			) AS b_allowed`;

		let sqlData = [].concat(ug_ids);
		sqlData.unshift(m_id, cm_method);

		return this.constructor.conn().psRow(sql, [m_id, cm_method, ug_ids])
			.then((res) => {
				return Promise.resolve(res['b_allowed'] == 1);
			});*/
	}


	/**
	 * список групп, в которых состоит пользователь
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	getUsersGroups(u_id)
	{
		let sql = `SELECT ug.ug_id,ug.ug_path,ug.ug_name
		FROM 
		(SELECT NULL) AS z
		JOIN users_in_groups AS uing ON(uing.u_id = ?)
		JOIN users_groups AS ug ON(ug.ug_id = uing.ug_id)`;

		return this.constructor.conn().ps(sql, [u_id]);
	}
}

module.exports = UserGroups;