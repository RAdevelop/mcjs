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
	getAllMethods(c_id)
	{
		let sql = `SELECT cvsm.c_id, cvsm.cm_id, cm.cm_method
			FROM controllers_vs_methods AS cvsm
			JOIN controllers_methods AS cm ON (cm.cm_id = cvsm.cm_id)
			WHERE c_id = ?`;
		
		return this.constructor.conn().ps(sql, [c_id]);
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

		/*sql = 'SELECT @res AS res FROM DUAL;'
		 self.db.q(sql, function(err, res)
		 {
		 //self.db.end();
		 if(err) return cb(err);

		 cb(null, rId);
		 });*/
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
	* добавляем метод в общий список, и привязываем его к указанному контроллеру
	 *
	* @param c_id
	* @param cm_method
	*/
	addMethod(c_id, cm_method)
	{
		let sql = `CALL controllers_method_create(?, ?, @сmId); SELECT @сmId AS cm_id FROM DUAL;`;

		return this.constructor.conn().multis(sql, [c_id, cm_method])
			.bind(this)
			.then(function (res)
			{
				let cm_id = (res[1][0] && res[1][0]["cm_id"] ? res[1][0]["cm_id"] : 0);

				if (!cm_id)
					throw new Errors.HttpError(500, 'не удалось создать метод');

				return Promise.resolve(cm_id);
			});
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
