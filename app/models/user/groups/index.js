"use strict";

//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const BaseModel = require('app/lib/db');

class UserGroups extends BaseModel
{
	/**
	 * получаем список групп
	 *
	 * @returns {Promise}
	 */
	getAll()
	{
		let sql = `SELECT ug_id, ug_pid, ug_path, ug_name, ug_desc, ug_level, ug_lk, ug_rk, ug_on_register, REPEAT('&nbsp;', IF(ug_level > 1, (ug_level-1)*2, 0)) AS ug_nbsp
			FROM users_groups
			ORDER BY ug_lk`;
		
		return this.constructor.conn().s(sql);
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
}

module.exports = UserGroups;