'use strict';

/*
 User.prototype.auth - такой определение метода будет работать только, если потом создать объект new User()
 User.auth - а так не обязательно создавать объект new User. что-то вроде статичного метода
*/

const Moment = require('moment'); //работа со временем
const Errors = require('app/lib/errors');
const bcrypt = require('bcrypt');
//const Async = require('async');
//const Promise = require("bluebird");
//const IORedis = require('ioredis'); TODO может быть придется использовать для кеширования

const BaseModel = require('app/lib/db');

class User extends BaseModel
{
	filterData(uData, keys)
	{
		keys = keys || [];
		keys.push('u_pass', 'u_salt');
		
		for (let i in keys)
		{
			if (keys.hasOwnProperty(i))
			delete uData[keys[i]];
		}
		return uData;
	}
	
	/**
	 * поиск пользователя по id
	 *
	 * @param uId
	 * @param cb
	 * @throws
	 *  errors.TypeError
	 *  errors.data.SQLError
	 *  errors.NotFoundError
	 */
	getById(uId, cb)
	{
		uId = parseInt(uId, 10);
		let user = {u_id: null, u_mail: '', u_date_visit: '', u_login: '', u_reg: ''};

		let msg = "Такого пользователя не существует";

		if (!uId)
			return cb(new Errors.NotFoundError(msg), user);
		
		let sql = "SELECT u_id, u_mail, u_date_visit, u_login, u_reg FROM `users` WHERE u_id = ?;";

		this.constructor.conn().psRow(sql, [uId], function (err, userData)
		{
			//console.log(userData);
			if (err) return cb(err, user);

			if (userData)
			{
				Object.assign(user, userData);
				return cb(null, user);
			}
			
			//не нашли
			return cb(new Errors.NotFoundError(msg), user);
		});
	}
	
	/**
	 * обновляем время последнего посещения пользователя
	 * @param uId
	 * @param cb
	 * @throws
	 *  errors.data.SQLError
	 */
	setLastVisit(uId, cb)
	{
		//let rKey = 'users:'+uId; для РЕдиа
		
		let now_ts = Moment().unix();   //чтобы было в секундах....
		
		let sql = 'UPDATE `users` SET u_date_visit = ? WHERE u_id = ?';
		let sqlData = [now_ts, uId];
		
		this.constructor.conn().upd(sql, sqlData, function (err) {
			if (err) return cb(err);
			
			cb(null);
			
			/*const Redis = new IORedis();
			 Redis.hset(rKey, 'u_date_visit', now_ts, function (err)
			 {
			 Redis.quit();
			 if (err) return cb(new Errors.AppRedisError('Redis error', err), null);
			 
			 cb(null);
			 });*/
		});
	}
	
	/**
	 * поиск пользователя по e-mail адресу
	 *
	 * @param email
	 * @param cb - ф-ция обратного вызова: function(err, userData)
	 * @throws
	 *  errors.data.SQLError
	 *  errors.NotFoundError
	 */
	getByEmail(email, cb)
	{
		email = email.toLowerCase().trim();
		
		let sql = "SELECT u_id, u_mail, u_salt, u_pass, u_date_visit, u_reg, u_login FROM `users` WHERE u_mail = ?;";
		this.constructor.conn().ps(sql, [email], function (err, userData) {
			if (err) return cb(err, null);
			
			if (userData["info"]["numRows"] == 1) return cb(null, userData[0]);
			
			//не нашли
			return cb(new Errors.NotFoundError("Пользователя с таким email не существует", err), null);
		});
	}
	
	/**
	 * получаем данные для юзера из users_data
	 * @param u_id
	 */
	getUserData(u_id)
	{
		let userData = {u_id: null, u_name:'', u_surname:'', u_sex:'', u_sex_name:'', u_birthday:'',bd_birthday:''};

		if (!u_id)
			return Promise.resolve(userData);

		let sql = "SELECT u_id, u_name, u_surname, u_sex, u_birthday FROM `users_data` WHERE u_id = ?;";
		
		return this.constructor.conn().psRow(sql, [u_id])
			.then(function (res)
			{
				if (!res)
					return Promise.resolve(userData);

				if (res['u_id'])
				Object.assign(userData, res);

				if (userData['u_birthday'] > 0)
					userData['bd_birthday'] = Moment.unix(userData['u_birthday']).format("DD-MM-YYYY");

				switch (userData.u_sex)
				{
					default:
						userData.u_sex_name = '';
						break;
					case "1":
						userData.u_sex_name = 'мужской';
						break;
					case "0":
						userData.u_sex_name = 'женский';
						break;
				}

				return Promise.resolve(userData);
			});
	}
	
	/**
	 * получаем данные о населенном пункте пользователя
	 * @param u_id
	 * @param cb
	 */
	getUserLocation(u_id)
	{
		let userData = {
			u_id: null, u_location_id:null, u_latitude: null, u_longitude: null,
			l_pid:null, l_name:'', l_latitude:null,l_longitude:null,
			l_kind: '', l_full_name: '', l_level: null, l_lk: null, l_rk: null
		};

		if (!u_id)
			return Promise.resolve(userData);

		let sql = "SELECT ud.u_location_id, ud.u_latitude, ud.u_longitude, uln.l_pid, uln.l_name, uln.l_latitude, uln.l_longitude, uln.l_kind, uln.l_full_name, ul.l_level, ul.l_lk, ul.l_rk " +
			"FROM `users_data` AS ud " +
			"JOIN `location_names` AS uln ON (uln.l_id = ud.u_location_id) " +
			"JOIN `location` AS ul ON (ul.l_id = ud.u_location_id) " +
			"WHERE ud.u_id = ?;";
		
		return this.constructor.conn().psRow(sql, [u_id])
			.then(function (res)
			{
				if (res)
					Object.assign(userData, res);

				return Promise.resolve(userData);
			});
	}

	/**
	 * получаем данные по населенному пункту указанных юзеров
	 *
	 * @param user_ids
	 * @returns {usersLocation = {u_id:{ocationData}}}
	 */
	getUsersLocation(user_ids = [])
	{
		let sql = "SELECT ud.u_id, ud.u_location_id, ud.u_latitude, ud.u_longitude, uln.l_pid, uln.l_name, uln.l_latitude, uln.l_longitude, uln.l_kind, uln.l_full_name, ul.l_level, ul.l_lk, ul.l_rk " +
			"FROM `users_data` AS ud " +
			"JOIN `location_names` AS uln ON (uln.l_id = ud.u_location_id) " +
			"JOIN `location` AS ul ON (ul.l_id = ud.u_location_id) " +
			"WHERE ud.u_id IN ("+(new Array(user_ids.length)).fill('?').join(',')+");";

		return this.constructor.conn().ps(sql, user_ids)
			.then(function (res)
			{
				let userData = {
					u_id: null, u_location_id:null, u_latitude: null, u_longitude: null,
					l_pid:null, l_name:'', l_latitude:null,l_longitude:null,
					l_kind: '', l_full_name: '', l_level: null, l_lk: null, l_rk: null
				};

				let usersLocation = {};

				user_ids.forEach(function (u_id)
				{
					userData["u_id"] = u_id;
					usersLocation[u_id] = userData;
					if (res)
					{
						res.forEach(function (item)
						{
							if (item.u_id == u_id)
							usersLocation[u_id] = Object.assign({}, usersLocation[u_id], item);
						});
					}
				});

				userData = null;
				return Promise.resolve(usersLocation);
			});
	}
	
	/**
	 * проверяем, есть ли неистекший ключ на нужный тип запроса для пользователя
	 * 
	 * @param u_req_type
	 * @param u_req_key
	 * @param cb
	 */
	issetChangeRequest(u_req_type, u_req_key, cb)
	{
		let u_id = u_req_key.substr(32);
		
		let sql = "SELECT 1 AS f FROM `user_change_request`" +
			" WHERE u_id = ? AND u_req_type = ? AND u_req_key = ? AND u_req_end_ts >= ?;";
		
		let sqlData = [u_id, u_req_type, u_req_key, Moment().unix()];
		
		return this.constructor.conn().ps(sql, sqlData, function(err, res)
		{
			if (err) return cb(err, false);
			
			return cb(null, (res["info"]["numRows"] == 1));
		});
	}


	/**
	 * удаляем ранее созданный запрос на изменения для указанного пользователя и типа запроса
	 *
	 * @param u_id
	 * @param u_req_type
	 * @param cb
	 */
	clearUserChangeRequest(u_id, u_req_type, cb)
	{
		let sql = "DELETE FROM `user_change_request` " +
			"WHERE u_id = ? AND u_req_type = ?;";

		return this.constructor.conn().del(sql, [u_id, u_req_type], function(err)
		{
			if (err) return cb(err, u_id);

			return cb(null, u_id);
		});
	}

	/**
	 * подсчет кол-ва всех пользователей
	 */
	countUsers()
	{
		let sql = "SELECT COUNT(u_id) AS u_cnt FROM users";

		return this.constructor.conn().sRow(sql)
			.then(function (res)
			{
				if(!res)
					return Promise.resolve(0);

				return Promise.resolve(res["u_cnt"]);
			});
	}

	/**
	 * список пользователей
	 *
	 * @param offset
	 * @param limit
	 * @returns {*}
	 */
	getUsers(offset, limit)
	{
		offset = parseInt(offset, 10) || 0;
		limit = parseInt(limit, 10) || 20;

		let sql = "SELECT u.u_id, u.u_mail, u.u_date_reg, u.u_date_visit, u.u_login, u.u_reg," +
			" ud.u_name, ud.u_surname, ud.u_sex, ud.u_birthday, ud.u_location_id, ud.u_latitude, ud.u_longitude" +
			" FROM users AS u" +
			" JOIN users_data AS ud ON (ud.u_id = u.u_id)" +
			" LIMIT "+limit+" OFFSET "+offset;

		return this.constructor.conn().s(sql)
			.then(function (res)
			{
				let user = {
					u_id:null, u_mail:null, u_date_reg:null, u_date_visit:null, u_login:null, u_reg:null, u_name:null, u_surname:null, u_sex:null,
					u_birthday:null, u_location_id:null, u_latitude:null, u_longitude:null
				};

				let users_ids = [];
				let users = [];

				if (res.info.numRows)
				{
					res.forEach(function (u)
					{
						if (u.hasOwnProperty("u_id"))
						{
							users_ids.push(u.u_id);
							users.push(Object.assign({}, user, u));
						}
					});
				}

				return [users, users_ids];
			});
	}
}

module.exports = User;

/********************************************************** OLD VERSION

/!**
 * добавляем нового пользователя.
 *
 * @param cb
 * @throws
 *  errors.data.SQLError
 *!/




/!**
 * поиск пользователя по id
 *
 * @param uId
 * @param cb
 * @throws
 *  errors.TypeError
 *  errors.data.SQLError
 *  errors.NotFoundError
 *!/
User.getById = function(uId, cb)
{
	let self = this;
	process.nextTick(function()
	{
		uId = parseInt(uId, 10);
		
		if(!uId)    return cb(new Errors.TypeError("uId is not a number"), null);
		
		//const Redis = new IORedis();
		//let rKey = 'users:'+uId;
		Async.waterfall([
			function(asyncCb)//есть ли в кеше Redisa
			{
				
				return asyncCb(null, null); //TODO пока убераем выборку из Редиса
				
				/!*Redis.exists(rKey, function(err, res)
				{
					if(err)     return asyncCb(new Errors.AppRedisError('Ошибка redis', err), null);
					if(!res)    return asyncCb(null, null);
					
					Redis.multi().hgetall(rKey).expire(rKey, hashUserDataTime).exec(function (err, results)
					{
						if (err)    return asyncCb(new Errors.AppRedisError('Redis error', err), null);
						
						var res = results[0][1];
						
						var userData = {};
						if (Array.isArray(res)) 
						{
							for (var i = 0; i < res.length; i += 2)
							{
								userData[res[i]] = res[i + 1];
							}
						}
						return asyncCb(null, userData);
					});
				});*!/
			},
			function(userData, asyncCb)//если нет в Redise, забираем данные из MySQL и добавляем в Redis
			{
				//если есть в кеше Redisa
				if (userData)   return asyncCb(null, userData);
				
				var sql = "SELECT u_id, u_mail, u_date_visit, u_login FROM `users` WHERE u_id = ?;";
				self.db.pq(sql, [uId], function(err, userData)
				{
					if(err) return asyncCb(err, null);
					
					if(userData[0] && userData[0].u_id > 0)
					{
						/!*
						 //TODO пока убераем выборку из Редиса Кеширование сделать потом
						Redis.multi().hmset(rKey, userData[0]).expire(rKey, hashUserDataTime).exec(function (err) 
						{
							if (err) return asyncCb(new Errors.AppRedisError('Redis error', err), null);
						});*!/
						
						return asyncCb(null, userData[0]);
					}
					
					//не нашли
					return asyncCb(new Errors.NotFoundError("Пользователя с таким id не существует"), null);
				});	
			}
		], 
		function (err, userData)
		{
			//Redis.quit();
			if(err) return cb(err, null);
			cb(null, userData);
		});
	});
};
 
/!**
 * смена емейла
 * TODO
 * @param u_id
 * @param u_reg_key
 * @param cb
 *!/
User.changeEmail = function(u_id, u_mail, cb)
{
	this.getByEmail(u_mail, function(err, userData)
	{
		if (err)
		{
			switch (err.name)
			{
				default:
					if(err) return cb(err, null);
					break;
				
				case 'NotFoundError':
					//если не нашли, то все ок, 
					break;
			}
		}
		
		return cb(null, userData);
		
		//let sql = 'UPDATE `users` SET u_reg_key = ? WHERE u_id = ?;';
		/!*bcrypt.genSalt(12, function(err, salt)
		{
			if(err) return cb(err);
			
			//задаем пользователю u_mail_key для сохранения
			bcrypt.hash(u_mail, salt, function(err, u_mail_key)
			{
				if(err) return cb(err);
				
				//задаем хеш для сохранения
				u_mail_key = u_mail_key+u_id;
				
				let sql = 'UPDATE `users` SET u_mail_key = ?, u_change_mail = ? WHERE u_id = ?;';
				User.db.q(sql, [u_mail_key, u_mail, u_id], function(err)
				{
					if (err) return cb(err);
					
					return cb(null, true); //TODO
				});
			});
		});*!/
	});
};


User.list = function(offset, limit, cb)
{
	let self = this;
	process.nextTick(function()
	{
		offset = parseInt(offset, 10);
		limit = parseInt(limit, 10);

		if(offset <= 0 || limit <= 0)
		return cb(new Error("неверно заданы параметры"), null);

		//для LIMIT запросов надо делать так
		//var sql = 'SELECT * FROM `users` LIMIT '+limit+' OFFSET '+offset;

		let sql = 'SELECT * FROM users WHERE u_id = :u_id AND u_mail = :u_mail';
		let sqlData = {u_id: limit, u_mail: offset};
		
		self.db.pq(sql, sqlData, function(err, rows)
		{
			if(err) return cb(err, null);

			return cb(null, rows);
		});
	});
};*/
