"use strict";

const Errors = require('app/lib/errors');
const Crypto = require('crypto');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const User = require('app/models/user');

class Profile extends User
{
	
	/**
	 * Сохраняем изменения в логине данные пользователя (должен быть уникальным)
	 *
	 * @param u_id
	 * @param u_login
	 */
	updLogin(u_id, u_login)
	{
		let sql = `SELECT u_id FROM users WHERE u_login = ? LIMIT 1`;
		let sqlData = [u_login];
		
		return this.constructor.conn().s(sql, sqlData)
			.then((res) =>
			{
				if (res["info"]["numRows"] > 0 && res[0] != u_id)
					throw new Errors.AlreadyInUseError('Такой логин уже занят!');

				return Promise.resolve(u_id);
			})
			.then((u_id) =>
			{
				sql = `UPDATE users SET u_login = ? WHERE u_id = ?`;

				u_id = parseInt(u_id, 10);
				sqlData = [u_login, u_id];

				return this.constructor.conn().upd(sql, sqlData)
					.then(() =>
					{
						return Promise.resolve(u_id);
					});
			});
	}
	
	/**
	 * Сохраняем основные данные пользователя
	 *
	 * @param u_id
	 * @param u_name
	 * @param u_surname
	 * @param u_sex
	 * @param u_birthday
	 * @returns {Promise}
	 */
	updBaseInfo(u_id, u_name, u_surname, u_sex, u_birthday)
	{
		u_sex = u_sex || 2;
		let sql = `INSERT INTO users_data (u_id, u_name, u_surname, u_sex, u_birthday)
		VALUES(?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE u_name=VALUES(u_name), u_surname=VALUES(u_surname), u_sex=VALUES(u_sex), u_birthday=VALUES(u_birthday)`;
		
		let sqlData = [u_id, u_name, u_surname, u_sex, u_birthday];
		
		return this.constructor.conn().ins(sql, sqlData)
			.then(() =>
			{
				return Promise.resolve(u_id);
			});
	}
	
	/**
	 * создаем ключ для последующей отправке на подтверждение смены емейла
	 *
	 * @param user
	 * @param new_mail
	 * @param cb
	 */
	createReqChangeMailKey(user, new_mail, cb)
	{
		this.getByEmail(new_mail, true, (err, tmpUser)=>
		{
			if (err)
			{
				switch (err.name)
				{
					default:
						if(err)
							return cb(err, null);
						break;
					case 'NotFoundError':
						//если не нашли, то все ок,
					break;
				}
			}
			else if (tmpUser.u_id != user.u_id)
			{
				return cb(new Errors.AlreadyInUseError());
			}
			
			let u_req_type = 'reg_mail_change';
			let hash = Crypto.createHash('md5').update(user.u_id+u_req_type).digest('hex');
			
			user.u_req_key = hash+user.u_id;
			
			let u_req_end_ts = Moment().add(1, 'd').unix();
			
			let sql = `INSERT INTO user_change_request (u_id, u_req_type, u_req_key, u_req_end_ts, u_req_data)
			VALUES(?,?,?,?,?)
			ON DUPLICATE KEY UPDATE u_req_key=VALUES(u_req_key), 
			u_req_end_ts=VALUES(u_req_end_ts), u_req_data=VALUES(u_req_data);`;
			
			let sqlData = [user.u_id, u_req_type, user.u_req_key, u_req_end_ts, new_mail];
			
			this.constructor.conn().ins(sql, sqlData, (err)=>
			{
				if (err)
					return cb(err, user);
				
				process.nextTick(()=>
				{
					return cb(null, user);
				});
			});
		});
	}
	
	/**
	 * 
	 * заменяем емейл адрес пользователю по ранее созданному "запросу"
	 * 
	 * @param u_id
	 * @param key
	 * @param cb
	 */
	confirmReqChangeMail(u_id, key, cb)
	{
		u_id = parseInt(u_id, 10);
		let u_req_type = 'reg_mail_change';
		
		let sql = `SELECT u_req_data FROM user_change_request
		WHERE u_id = ? AND u_req_type = ? AND u_req_key = ? AND u_req_end_ts >= ?`;
		
		let sqlData = [u_id, u_req_type, key, Moment().unix()];
		
		this.constructor.conn().ps(sql, sqlData, (err, res)=>
		{
			if (err)
				return cb(err);
			
			if (res["info"]["numRows"] != 1)
			{
				process.nextTick(()=>
				{
					return cb(null, false);
				});
			}
			else 
			{
				sql = `UPDATE users SET u_mail = ? WHERE u_id = ?;`;
				
				this.constructor.conn().upd(sql, [res[0]["u_req_data"], u_id], (err)=>
				{
					if (err)
						return cb(err, false);
					
					sql = `DELETE FROM user_change_request WHERE u_id = ? AND u_req_type = ?`;
					
					this.constructor.conn().del(sql, [u_id, u_req_type], (err)=>
					{
						if (err)
							return cb(err, true);
						
						process.nextTick(()=>
						{
							return cb(null, true);
						});
					});
				});
			}
		});
	}
	
	/**
	 * сохраняем расположение (населенный пункт) пользователя
	 * 
	 * @param u_id
	 * @param f_lat
	 * @param f_lng
	 * @param location_id
	 * @return {Promise}
	 */
	updLocation(u_id, f_lat, f_lng, location_id)
	{
		let sql = `INSERT INTO users_data (u_id, u_location_id, u_latitude, u_longitude)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE 
		u_location_id=VALUES(u_location_id), u_latitude=VALUES(u_latitude), u_longitude=VALUES(u_longitude)`;

		let sqlData = [u_id, location_id, f_lat, f_lng];

		return this.constructor.conn().ins(sql, sqlData)
			.then(() =>
			{
				sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?;`;
				location_id = parseInt(location_id, 10);
				return this.constructor.conn().sRow(sql, [location_id]);
			})
			.then((res) =>
			{
				let {l_lk, l_rk} = res;
				l_lk = parseInt(l_lk, 10);
				l_rk = parseInt(l_rk, 10);

				sql = `SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;`;
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then((res) =>
			{
				let sqlIns = [], sqlData = [u_id], pids = [];
				res.forEach((item) => {
					sqlIns.push("(?, ?)");
					sqlData.push(u_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = `DELETE FROM users_locations WHERE u_id = ?;
					INSERT INTO users_locations (u_id, l_id) VALUES ${sqlIns.join(',')}
					ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);
					UPDATE users_data SET u_location_pids = ? WHERE u_id = ?;`;
				sqlData.push(pids.join(','), u_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(() =>
			{
				return Promise.resolve(location_id);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Profile;