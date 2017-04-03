"use strict";

const Errors = require('app/lib/errors');
const bcrypt = require('bcrypt');
const Crypto = require('crypto');
const Moment = require('moment');
//const Async = require('async');
//const Promise = require("bluebird");
//const IORedis = require('app/lib/ioredis'); //TODO

//***** module.exports
const User = require('app/models/user');

class Auth extends User
{
	/**
	* регистрация пользователя
	*
	* @param email - логин (не пустая строка. без пробелов только латинские буквы, цыфры [условие проверки, как для имени в e-mail адресе])
	* @param password - пароль (не пустая строка, длинной не менее 6 символов)
	* @param cb - ф-ция обратного вызова типа: function(err, result){}
	* @throws
	*  errors.AlreadyInUseError
	*/
	reg(email, password, cb)
	{
		password = password.trim();
		const self = this;
		//поиск пользователя по email
		self.getByEmail(email, (err, userData)=>
		{
			if(err)
			{
				switch (err.name)
				{
					default:
						if(err)
							return cb(err, null);
						break;
					
					case 'NotFoundError':
						//если не нашли, то все ок, и можно регистрировать нового пользователя
						break;
				}
			}
			//если нашли
			if(userData)
				return cb(new Errors.AlreadyInUseError('Такой пользователь уже зарегистрирован!', 'm_email'),null);
			
			//создаем нового пользователя (регистрируем)
			self.createUser(email, password, (err, user)=>
			{
				if(err) 
					return cb(err, null);
				
				process.nextTick(()=>
				{
					return cb(null, user);
				});
			});
		});
	}

	/**
	* добавляем нового пользователя.
	*
	* @param email
	* @param password
	* @param cb
	* @throws
	*  errors.data.SQLError
	*/
	createUser(email, password, cb)
	{
		const self = this;
		let user = {};
			user.u_mail = email;
		
		self.hashPassword(password, function(err, hashData)
		{
			if(err) return cb(err);
			
			let sql = 'INSERT INTO `users` (u_mail, u_salt,  u_pass, u_date_reg, u_date_visit) VALUES(?,?,?,?,?)';
			let now_ts = Moment().unix();
			let sqlData = [user.u_mail.trim(), hashData.salt, hashData.hash, now_ts, now_ts];
			
			self.constructor.conn().ins(sql, sqlData, (err, res)=>
			{
				if(err) return cb(err);

				user.u_id = res.insertId;
				
				self.createReqConfirmKey(user, (err, user)=>
				{
					if (err) return cb(err);
					
					return cb(null, user);
				});
			});
		});
	}
	
	/**
	 * создаем ключ для последующей отправке на подтверждение регистрации
	 * 
	 * @param user
	 * @param cb
	 */
	createReqConfirmKey(user, cb)
	{
		let u_req_type = 'reg_confirm';
		
		//задаем хеш для сохранения;
		let hash = Crypto.createHash('md5').update(user.u_id+u_req_type).digest('hex');
		
		user.u_req_key = hash+user.u_id;
		
		let u_req_end_ts = Moment().add(1, 'd').unix();
		
		let sql = `INSERT INTO user_change_request (u_id, u_req_type, u_req_key, u_req_end_ts)
			 VALUES(?,?,?,?)
			 ON DUPLICATE KEY UPDATE u_req_key=VALUES(u_req_key), u_req_end_ts=VALUES(u_req_end_ts);`;
		
		this.constructor.conn().ins(sql, [user.u_id, u_req_type, user.u_req_key, u_req_end_ts], (err)=>
		{
			if (err) return cb(err, user);
			
			process.nextTick(()=>
			{
				return cb(null, user);
			});
		});
	}
	
	/**
	 * создаем ключ для последующей отправке по почте для смены пароля 
	 * @param user
	 * @param cb
	 */
	createPassResetConfirmKey(user, cb)
	{
		let u_req_type = 'pass_reset_confirm';
		
		//задаем хеш для сохранения;
		let hash = Crypto.createHash('md5').update(user.u_id+u_req_type).digest('hex');
		
		user.u_req_key = hash+user.u_id;
		
		let u_req_end_ts = Moment().add(1, 'd').unix();
		
		let sql = `INSERT INTO user_change_request (u_id, u_req_type, u_req_key, u_req_end_ts)
			VALUES(?,?,?,?)
			ON DUPLICATE KEY UPDATE u_req_key=VALUES(u_req_key), u_req_end_ts=VALUES(u_req_end_ts);`;
		
		this.constructor.conn().ins(sql, [user.u_id, u_req_type, user.u_req_key, u_req_end_ts], (err) => 
		{
			if (err)
				return cb(err, user);
			
			process.nextTick(()=>
			{
				return cb(null, user);
			});
		});
	}
	
	/**
	* создание соли и хеша для паролья пользователя
	* 
	* @param u_pass
	* @param cb
	* @return hashData{salt, hash}
	*/
	hashPassword(u_pass, cb)
	{
		let hashData = {};
		
		//генерируем соль
		bcrypt.genSalt(12, (err, salt) =>
		{
			if(err) return cb(err);
			
			//задаем пользователю соль для сохранения
			hashData.salt = salt;
			
			//генерируем хеш пароля
			bcrypt.hash(u_pass, salt, (err, hash) =>
			{
				if(err) return cb(err);
				
				//задаем хеш для сохранения
				hashData.hash = hash;
				cb(null, hashData);
			});
		});
	}

	/**
	* подтверждение регистрации
	*
	* @param u_id
	* @param u_reg_key
	* @param cb
	*/
	regConfirm(u_id, u_reg_key, cb)
	{
		let u_req_type = 'reg_confirm';
		
		const self = this;
		
		let sql = `SELECT 1 AS f FROM user_change_request
		WHERE u_id = ? AND u_req_type = ? AND u_req_key = ? AND u_req_end_ts >= ?;`;

		u_id = parseInt(u_id, 10);
		let sqlData = [u_id,u_req_type, u_reg_key, Moment().unix()];
		
		self.constructor.conn().ps(sql, sqlData, (err, res)=>
		{
			if (err)
				return cb(err, false);
			
			if (res["info"]["numRows"] == 1)
			{
				sql = `DELETE FROM user_change_request WHERE (u_id = ? AND u_req_type = ?) OR u_req_end_ts < ?;`;
				
				self.constructor.conn().del(sql, [u_id, u_req_type, Moment().unix()], (err)=>
				{
					if (err)
						return cb(err, false);
					
					sql = `UPDATE users SET u_reg = ? WHERE u_id = ?;`;
					
					self.constructor.conn().upd(sql, [1, u_id], (err)=>
					{
						if (err)
							return cb(err, false);
						
						process.nextTick(()=>
						{
							return cb(null, true);
						});
					});
				});
			}
			else
			{
				//обязательно через {else}
				process.nextTick(()=>
				{
					return cb(null, false);
				});
			}
		});
	}
	
	/**
	 * обновляем пароль для пользователя
	 * 
	 * @param u_id
	 * @param password
	 * @param cb
	 */
	updPassword(u_id, password, cb)
	{
		const self = this;
		
		self.hashPassword(password, (err, hashData) =>
		{
			if(err)
				return cb(err);
			
			let sql = `UPDATE users SET u_salt = ?, u_pass = ? WHERE u_id = ?`;
			
			u_id = parseInt(u_id, 10);
			let sqlData = [hashData.salt, hashData.hash, u_id];
			
			self.constructor.conn().upd(sql, sqlData, (err) =>
			{
				if(err)
					return cb(err);
				
				process.nextTick(()=>
				{
					return cb();
				});
			});
		});
	}
}

module.exports = Auth;