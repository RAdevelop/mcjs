"use strict";

//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const BaseModel = require('app/lib/db');

class Controller extends BaseModel
{
	/**
	* получаем спиок контроллеров
	*
	* @throws
	*  DBError
	*/
	getAll()
	{
		let sql = `SELECT c_id,	c_pid, c_path, c_name, c_desc, c_level, c_lk, c_rk, REPEAT('&nbsp;', IF(c_level > 1, (c_level-1)*2, 0)) AS c_nbsp
			FROM controllers
			ORDER BY c_lk`;
		
		return this.constructor.conn().s(sql);
	}

	/**
	 * контролеер по его id
	 *
	 * @param c_id
	 * @returns {Promise}
	 */
	getById(c_id)
	{
		let sql = `SELECT c_id,	c_pid, c_path, c_name, c_desc, c_level, c_lk, c_rk 
		FROM controllers 
		WHERE c_id = ?`;

		return this.constructor.conn().sRow(sql, [c_id]);
	}

	/**
	 * получаем список пользовательских методов, достыпных для контроллера
	 *
	 * @param c_id
	 * @returns {Promise}
	 */
	getControllerMethods(c_id)
	{
		let sql = `SELECT c_id, cm_id, cm_method, cm_name, cm_desc
			FROM controllers_methods
			WHERE c_id = ?`;
		
		return this.constructor.conn().s(sql, [c_id]);
	}

	/**
	 * обвноляем данные контроллера
	 * @param c_id
	 * @param cPid
	 * @param cAfterId
	 * @param cPath
	 * @param cName
	 * @param cDesc
	 * @returns {Promise}
	 */
	updById(c_id, cPid, cAfterId, cPath, cName, cDesc)
	{
		let sql = `CALL controller_update(?, ?, ?, ?, ?, ?,@res); SELECT @res AS res FROM DUAL;`;

		let sqlData = [c_id, cPid, cAfterId, cPath, cName, cDesc];

		return this.constructor.conn().call(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				if (!(res[1][0] && res[1][0]["res"]))
					throw new Errors.HttpError(500, 'не удалось обновить контроллер');

				return Promise.resolve(c_id);
			})
			.catch(function (err)
			{
				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * добавляем новый контроллер в БД
	 *
	 * @param cPid
	 * @param cAfterId
	 * @param cPath
	 * @param cName
	 * @param cDesc
	 * @returns {Promise}
	 */
	add(cPid, cAfterId, cPath, cName, cDesc)
	{
		let sql = `CALL controller_create(?, ?, ?, ?, ?,@c_id); SELECT @c_id AS c_id FROM DUAL;`;

		let sqlData = [cPid, cAfterId, cPath, cName, cDesc];

		return this.constructor.conn().multis(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				let c_id = (res[1][0] && res[1][0]["c_id"] ? res[1][0]["c_id"] : 0);

				if (!c_id)
					throw new Errors.HttpError(500, 'не удалось создать контроллер');

				return Promise.resolve(c_id);
			})
			.catch(function (err)
			{
				if (err.name == 'DbErrDuplicateEntry')
				throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * добавляем метод, и привязываем его к указанному контроллеру
	 *
	 * @param c_id
	 * @param cm_method
	 * @returns {Promise}
	 */
	addMethod(c_id, cm_method)
	{
		let sql = `INSERT INTO controllers_methods (cm_method, cm_name, cm_desc, c_id) VALUES (?,?,?,?)`;

		//TODO добавить cm_name, cm_desc

		return this.constructor.conn().ins(sql, [cm_method, '', '', c_id])
			.then(function (res)
			{
				let cm_id = parseInt(res["insertId"], 10);

				if (!cm_id)
					throw new Errors.HttpError(500, 'не удалось создать метод');

				return Promise.resolve(cm_id);
			})
			.catch(function (err)
			{
				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * редактируем метод
	 *
	 * @param cm_id
	 * @param cm_method
	 */
	updateMethod(cm_id, cm_method)
	{
		//TODO добавить cm_name, cm_desc

		let sql = `UPDATE controllers_methods SET cm_method = ? WHERE cm_id = ?`;
		return this.constructor.conn().upd(sql, [cm_method, cm_id])
			.then(function ()
			{
				return Promise.resolve(cm_id);
			})
			.catch(function (err)
			{
				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * удаляем метод
	 *
	 * @param cm_id
	 * @param c_id
	 */
	deleteMethod(cm_id, c_id)
	{
		//TODO
		/**
		 * удаляем связь между cm_id, c_id, ug_id!!
		 *
		 * проверяем связи cm_id с другими c_id
		 * если связи нет - удаляем метод совсем
		 */
		return this.model('controller').delMethod(cm_id, c_id);
	}
}

module.exports = Controller;




/**  ****************************************************            OOLD VERSION
 * Created by RA on 07.02.2016.
 *
 * отвязываем метод от указанного роутера
 * @param rId
 * @param cm_method
 * @param cb
 *!/
Router.delMethod = function(c_id, rmId, cb)
{
	let sql = 'CALL routes_method_del(?, ?);';
	let sqlData = [c_id, rmId];
	
	this.db.q(sql, sqlData, function(err, res)
	{
		if(err) return cb(err);
		
		return cb(null, rmId);
	});
};*/
