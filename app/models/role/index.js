/**
 * Created by RA on 28.02.2016.
 */
'use strict';

//var IORedis = require('ioredis'); TODO может быть придется использовать для кеширования

//***** module.exports
module.exports = function(db)
{
	Role.db = db;
	return Role;
};

/**
 * модель ролей
 *
 * @constructor
 */
function Role() {}

/**
 * создаем новую роль
 * 
 * @param i_rl_pid
 * @param i_rl_after_id
 * @param s_rl_path
 * @param s_rl_name
 * @param t_rl_desc
 * @param cb
 */
Role.add = function(i_rl_pid, i_rl_after_id, s_rl_path, s_rl_name, t_rl_desc, cb)
{
	var i_rl_after_id = i_rl_after_id || 0;
	var sql = 'CALL role_create(?, ?, ?, ?, ?, @last_ins_id);';
	var sqlData = [i_rl_pid, i_rl_after_id, s_rl_path, s_rl_name, t_rl_desc];
	var self = this;
	
	this.db.q(sql, sqlData, function(err, res)
	{
		if(err) return cb(err);
		
		sql = 'SELECT @last_ins_id AS id FROM DUAL;'
		self.db.q(sql, function(err, res)
		{
			//this.db.end();
			if(err) return cb(err);
			
			cb(null, res[0]["id"]);
		});
	});
};

//TODO
Role.getById = function ( cb)
{
	
};
//TODO
Role.updById = function ( cb)
{
	
};

/**
 * получаем список ролей
 * @param cb
 */
Role.getAll = function ( cb)
{
	var sql = "SELECT rl_id, rl_pid, rl_path, rl_name, rl_desc, rl_level, rl_lk, rl_rk " +
		", REPEAT('&nbsp;', IF(rl_level > 1, rl_level*2, 0)) AS nbsp" +
		"FROM `roles` ORDER BY rl_lk";
	
	this.db.pq(sql, [], function(err, res)
	{
		//self.db.end();
		
		if (err) return cb(err, null);
		//не нашли
		if(res["info"]["numRows"] == 0) return cb(null, []);
		
		var list = JSON.parse(JSON.stringify(res));
		
		cb(null, list);
	});
};