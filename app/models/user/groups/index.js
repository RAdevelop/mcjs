"use strict";

//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const BaseModel = require('app/lib/db');

class UserGroups extends BaseModel
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
			.bind(this)
			.then(function (res)
			{
				if (!(res[1][0] && res[1][0]["res"]))
					throw new Errors.HttpError(500, 'не удалось обновить группу');

				return Promise.resolve(ug_id);
			})
			.catch(function (err)
			{
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
			.bind(this)
			.then(function (res)
			{
				let ug_id = (res[1][0] && res[1][0]["ug_id"] ? res[1][0]["ug_id"] : 0);

				if (!ug_id)
					throw new Errors.HttpError(500, 'не удалось создать группу');

				return Promise.resolve(ug_id);
			})
			.catch(function (err)
			{
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
			.bind(this)
			.then(function (ug)
			{
				let ug_ids_for_del = [];
				let ug_group = {};

				if (!ug['info']['numRows'] )
					return Promise.resolve([ug_group, ug_ids_for_del]);

				ug_group = ug[0];

				//права удаляем так же для всех потомков, кроме root, admin
				let sql = `SELECT ug_id, ug_path FROM users_groups 
				WHERE ug_lk >= ? AND ug_rk <= ?`;

				return this.constructor.conn().s(sql, [ug_group['ug_lk'], ug_group['ug_rk']])
					.bind(this)
					.then(function (list)
					{
						list.forEach(function (item)
						{
							item['ug_path'] = item['ug_path'].toLowerCase();

							if (item['ug_path'] != 'root' && item['ug_path'] != 'admin')
								ug_ids_for_del.push(item['ug_id']);
						});

						return Promise.resolve([ug_group, ug_ids_for_del]);
					});
			})
			.spread(function (ug_group, ug_ids_for_del)
			{
				if (!ug_ids_for_del.length)
					return Promise.resolve(ug_group);

				let placeHolders = this.constructor.placeHoldersForIn(ug_ids_for_del);

				let sql = `DELETE FROM users_groups_rights WHERE ug_id IN(${placeHolders}) AND m_id = ? AND c_id = ?`;
				let sqlData = ug_ids_for_del;
				sqlData.push(m_id, c_id);

				return this.constructor.conn().del(sql, sqlData)
					.then(function ()
					{
						return Promise.resolve(ug_group);
					});
			})
			.then(function (ug_group)
			{
				if (!cm_ids.length || !ug_group['ug_id'])
					return Promise.resolve(1);

				//права так же выставляем для всех родительских групп
				let sql = `SELECT ug_id FROM users_groups WHERE ug_lk <= ? AND ug_rk >= ?`;

				return this.constructor.conn().s(sql, [ug_group['ug_lk'], ug_group['ug_rk']])
					.bind(this)
					.then(function (g_list)
					{
						let sql_vals = [];
						let sqlData = [];

						g_list.forEach(function (g_id)
						{
							cm_ids.forEach(function(cm_id){
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
			.bind(this)
			.then(function ()
			{
				if (!ug_ids.length)
					return Promise.resolve(ug_ids);

				return this.getAll(ug_ids)
					.then(function (ug_list)
					{
						if (!ug_list)
							return Promise.resolve(ug_ids);

						let groups = [];

						//работаем только с реальными id групп
						ug_list.forEach(function (g)
						{
							groups.push(g['ug_id']);
						});

						return Promise.resolve(groups);
					})
			})
			.then(function (ug_ids)
			{
				/*if (!ug_ids.length)
					return Promise.resolve(ug_ids);*/

				let where = ['u_id = ?'];
				let sqlData = [u_id];
				if (ug_ids.length)
				{
					let placeHolders = this.constructor.placeHoldersForIn(ug_ids);
					where.push(`ug_id IN(${placeHolders})`);

					sqlData = sqlData.concat(ug_ids);
				}

				let sql = `DELETE FROM users_in_groups
				WHERE ${where.join(' AND ')} `;

				return this.constructor.conn().del(sql, sqlData)
					.then(function ()
					{
						return Promise.resolve(ug_ids);
					});
			})
			.then(function (ug_ids)
			{
				let sqlData = [];
				let sql_vals = [];

				ug_ids.forEach(function (ug_id)
				{
					sql_vals.push('(?,?)');
					sqlData.push(u_id, ug_id);
				});

				let sql = ``;

				if (ug_ids.length)
				{
					sql += `INSERT INTO users_in_groups (u_id, ug_id) VALUES ${sql_vals.join(',')}
						ON DUPLICATE KEY UPDATE 
						ug_id=VALUES(ug_id);`;
				}

				sql += `UPDATE users SET ug_ids = ? WHERE u_id = ?`;
				sqlData.push(ug_ids.join(','), u_id);

				return this.constructor.conn().multis(sql, sqlData)
					.then(function ()
					{
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
	 * @param ug_path
	 * @param m_id
	 * @returns {Promise}
	 */
	getGroupRightsByPathAndMenu(ug_path, m_id)
	{
		let sql =
			`SELECT ug.ug_id, m.m_id, cm.cm_id, cm.cm_method, IF(ugr.cm_id IS NULL, 0, 1) AS b_allowed
			FROM (SELECT NULL) AS z
			JOIN users_groups AS ug ON(ug.ug_path = ?)
			JOIN menu AS m ON(m.m_id = ?)
			JOIN controllers_methods AS cm ON(cm.c_id = m.c_id )
			JOIN users_groups_rights AS ugr ON(ugr.ug_id = ug.ug_id AND ugr.m_id = m.m_id AND ugr.c_id = cm.c_id 
			AND ugr.cm_id = cm.cm_id)`;

		return this.constructor.conn().ps(sql, [ug_path, m_id]);
	}


	/**
	 * список прав для указанного пользователя
	 * @param u_id - id пользователя
	 * @param m_id - id меню
	 * @returns {Promise}
	 */
	getUserRights(u_id, m_id)
	{
		let sql =
			`SELECT uing.ug_id, m.m_id, cm.cm_id, cm.cm_method, IF(ugr.cm_id IS NULL, 0, 1) AS b_allowed
			FROM (SELECT NULL) AS z
			JOIN users_in_groups AS uing ON (uing.u_id = ?)
			JOIN menu AS m ON(m.m_id = ?)
			JOIN controllers_methods AS cm ON(cm.c_id = m.c_id )
			JOIN users_groups_rights AS ugr ON(ugr.ug_id = uing.ug_id AND ugr.m_id = m.m_id AND ugr.c_id = cm.c_id 
			AND ugr.cm_id = cm.cm_id)`;

		return this.constructor.conn().ps(sql, [u_id, m_id]);
	}
}

module.exports = UserGroups;