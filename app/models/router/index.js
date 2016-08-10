"use strict";
/**
 * Created by RA on 07.02.2016.
 */
//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования
const BaseModel = require('app/lib/db');

class Router extends BaseModel
{
	/**
	* получаем спиок роутеров\
	*
	* @param cb
	* @throws
	*  DBError
	*/
	getAll(cb)
	{
		let sql = "SELECT c_id,	c_pid, c_path, c_name, c_desc, c_level, c_lk, c_rk, REPEAT('&nbsp;', IF(c_level > 1, c_level*2, 0)) AS c_nbsp " +
			"FROM `controllers` " +
			"ORDER BY c_lk";
		
		this.constructor.conn().ps(sql, [], function(err, res)
		{
			if (err) return cb(err, []);
			//не нашли
			if(res["info"]["numRows"] == 0) return cb(null, []);
			
			//var list = JSON.parse(JSON.stringify(res)) || [];
			//console.log(list);
			cb(null, res);
		});
	}
}

module.exports = Router;




/**  ****************************************************            OOLD VERSION
 * Created by RA on 07.02.2016.
 */

/*
 User.prototype.auth - такой определение метода будет работать только, если потом создать объект new User()
 User.auth - а так не обязательно создавать объект new User. что-то вроде статичного метода
 */
//var _ = require('lodash');

/////////***** module.exports
/*
module.exports = function(db)
{
	Router.db = db;
	return Router;
};

/!**
 * модель пользователя
 * @param obj
 * @constructor
 *!/
function Router()
{
}

/!**
 * добавляем в БД роутер
 * @param rPid
 * @param rPath
 * @param rName
 * @param rDesc
 * @param cb
 * @throws
 *  Errors.data.SQLError
 *  
 *!/
Router.add = function(rPid, rAfterId, rPath, rName, rDesc, cb)
{
	var sql = 'CALL controller_create(?, ?, ?, ?, ?, @last_ins_id);';
	var sqlData = [rPid, rAfterId, rPath, rName, rDesc];
	
	var self = this;
	this.db.q(sql, sqlData, function(err, res)
	{
		if(err) return cb(err);
		
		sql = 'SELECT @last_ins_id AS c_id FROM DUAL;';
		self.db.q(sql, function(err, res)
		{
			if(err) return cb(err);
			
			cb(null, res[0]["c_id"]);
		});
	});
};

/!**
 * обновляем основные данные роутера по его id
 * @param rId
 * @param rPid
 * @param rAfterId
 * @param rPath
 * @param rName
 * @param rDesc
 * @param cb
 *!/
Router.updById = function(rId, rPid, rAfterId, rPath, rName, rDesc, cb)
{
	var sql = "CALL controller_update(?, ?, ?, ?, ?, ?,@res);";
	
	var sqlData = [rId, rPid, rAfterId, rPath, rName, rDesc];
	//var self = this;
	this.db.q(sql, sqlData, function(err, res)
	{
		//self.db.end();
		if(err) return cb(err);
		
		return cb(null, rId);
		
		/!*sql = 'SELECT @res AS res FROM DUAL;'
		self.db.q(sql, function(err, res)
		{
			//self.db.end();
			if(err) return cb(err);
			
			cb(null, rId);
		});*!/
	});
};

/!**
 * Получаем данные для роутера по его id
 * @param rId
 * @param cb
 * @throws
 *  DbError
 *!/
Router.getById = function(rId, cb)
{
	//var self = this;
	var sql = "SELECT c_id,	c_pid, c_path, c_name, c_desc, c_level, c_lk, c_rk FROM `controllers` WHERE c_id = ?";
	this.db.pq(sql, [rId], function(err, res)
	{
		//this.db.end();
		if (err) return cb(err);
		
		//не нашли
		if(res["info"]["numRows"] == 0) return cb(null, null);
		
		cb(null, res[0]);
	});
};



/!**
 * получаем список пользовательских методов, достыпных для роутера
 * @param rId
 * @param cb
 *!/
Router.getAllMethods = function(rId, cb)
{
	var sql = "SELECT rvsm.rvsm_id, rvsm.c_id, rvsm.rm_id, rm.rm_method	" +
		"FROM routers_vs_methods AS rvsm " +
		"JOIN router_methods AS rm ON (rm.rm_id = rvsm.rm_id) " +
		"WHERE c_id = ?";
	
	this.db.pq(sql, [rId], function(err, res)
	{
		if (err) return cb(err, []);
		//не нашли
		if(res["info"]["numRows"] == 0) return cb(null, []);
		
		var list = JSON.parse(JSON.stringify(res)) || [];
		//console.log(list);
		cb(null, list);
	});
};

/!**
 * добавляем метод в общим список, и привязываем его к указанному роутеру
 * @param rId
 * @param rmMethod
 * @param cb
 *!/
Router.addMethod = function(rId, rmMethod, cb)
{
	var sql = 'CALL routes_method_create(?, @rmId);';
	var sqlData = [rmMethod];
	
	var self = this;
	this.db.q(sql, sqlData, function(err, res)
	{
		if(err) return cb(err);
		
		sql = 'SELECT @rmId AS rm_id FROM DUAL;';
		self.db.q(sql, function(err, res)
		{
			if(err) return cb(err);
			
			var rmId = res[0]["rm_id"];
			
			sql = 'INSERT INTO `routers_vs_methods` SET c_id = ?, rm_id = ?;';
			
			sqlData = [rId, rmId];
			self.db.q(sql, sqlData, function(err, res)
			{
				if(err) return cb(err);
				
				return cb(null, rmId);
			});
			
		});
	});
};

/!**
 * отвязываем метод от указанного роутера
 * @param rId
 * @param rmMethod
 * @param cb
 *!/
Router.delMethod = function(rId, rmId, cb)
{
	var sql = 'CALL routes_method_del(?, ?);';
	var sqlData = [rId, rmId];
	
	this.db.q(sql, sqlData, function(err, res)
	{
		if(err) return cb(err);
		
		return cb(null, rmId);
	});
};*/
