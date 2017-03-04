'use strict';

/*
 User.prototype.auth - такой определение метода будет работать только, если потом создать объект new User()
 User.auth - а так не обязательно создавать объект new User. что-то вроде статичного метода
*/

const Moment = require('moment'); //работа со временем
const Errors = require('app/lib/errors');
const bcrypt = require('bcrypt');
//const Promise = require("bluebird");
//const IORedis = require('app/lib/ioredis'); TODO может быть придется использовать для кеширования

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

	static userGroupIds(ug_ids)
	{
		ug_ids = ug_ids.split(',');
		ug_ids.forEach((ug_id, i, arr) =>
		{
			if (!ug_id)
				arr.splice(i, 1);
		});

		return ug_ids || [];
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
		let user = {u_id: null, u_mail: '', u_date_visit: '', u_login: '', u_reg: '', ug_ids: []};

		let msg = "Такого пользователя не существует";

		if (!uId)
			return cb(new Errors.NotFoundError(msg), user);
		
		let sql = `SELECT u_id, u_mail, u_date_visit, u_login, u_reg, ug_ids 
		FROM users WHERE u_id = ?;`;

		uId = parseInt(uId, 10);
		this.constructor.conn().psRow(sql, [uId], (err, userData) =>
		{
			//console.log(userData);
			if (err)
				return cb(err, user);

			if (userData)
			{
				userData['ug_ids'] = User.userGroupIds(userData['ug_ids']);
				
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
		uId = parseInt(uId, 10);

		let sql = 'UPDATE `users` SET u_date_visit = ? WHERE u_id = ?';
		let sqlData = [now_ts, uId];
		
		this.constructor.conn().upd(sql, sqlData, (err) =>
		{
			if (err)
				return cb(err);
			
			cb(null, now_ts);
			
			/*const Redis = new IORedis();
			 Redis.hset(rKey, 'u_date_visit', now_ts, (err) => {
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
		
		let sql = `SELECT u_id, u_mail, u_salt, u_pass, u_date_visit, u_reg, u_login, ug_ids 
		FROM users WHERE u_mail = ?;`;

		this.constructor.conn().sRow(sql, [email], (err, userData) =>
		{
			if (err)
				return cb(err, null);
			
			if (userData)
			{
				userData['ug_ids'] = User.userGroupIds(userData['ug_ids']);
				return cb(null, userData);
			}
			
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
		let userData = {u_id: null, u_name:'', u_surname:'',
			u_sex:'', u_sex_name:'', u_birthday:'',bd_birthday:''};

		if (!u_id)
			return Promise.resolve(userData);

		let sql = `SELECT u_id, u_name, u_surname, u_sex, u_birthday FROM users_data WHERE u_id = ?;`;

		u_id = parseInt(u_id, 10);
		return this.constructor.conn().psRow(sql, [u_id])
			.then((res) =>
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

		let sql = `SELECT ud.u_location_id, ud.u_latitude, ud.u_longitude, uln.l_pid, uln.l_name, 
		uln.l_latitude, uln.l_longitude, uln.l_kind, uln.l_full_name, ul.l_level, ul.l_lk, ul.l_rk
		FROM users_data AS ud
		JOIN location_names AS uln ON (uln.l_id = ud.u_location_id)
		JOIN location AS ul ON (ul.l_id = ud.u_location_id)
		WHERE ud.u_id = ?;`;

		u_id = parseInt(u_id, 10);
		return this.constructor.conn().psRow(sql, [u_id])
			.then((res) =>
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
	 * @returns {usersLocation = {u_id:{locationData}}}
	 */
	getUsersLocation(user_ids = [])
	{
		let placeHolders = this.constructor.placeHoldersForIn(user_ids);

		let sql = `SELECT ud.u_id, ud.u_location_id, ud.u_latitude, ud.u_longitude, uln.l_pid, uln.l_name
		, uln.l_latitude, uln.l_longitude, uln.l_kind, uln.l_full_name, ul.l_level, ul.l_lk, ul.l_rk
		FROM users_data AS ud
		JOIN location_names AS uln ON (uln.l_id = ud.u_location_id)
		JOIN location AS ul ON (ul.l_id = ud.u_location_id)
		WHERE ud.u_id IN (${placeHolders});`;

		return this.constructor.conn().ps(sql, user_ids)
			.then((res) =>
			{
				let userData = {
					u_id: null, u_location_id:null, u_latitude: null, u_longitude: null,
					l_pid:null, l_name:'', l_latitude:null,l_longitude:null,
					l_kind: '', l_full_name: '', l_level: null, l_lk: null, l_rk: null
				};

				let usersLocation = {};

				user_ids.forEach((u_id) =>
				{
					//userData["u_id"] = u_id;
					usersLocation[u_id] = Object.assign({}, userData, {u_id: u_id});
					if (res)
					{
						res.forEach((item) =>
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
		let u_id = parseInt(u_req_key.substr(32), 10);
		
		let sql = `SELECT 1 AS f FROM user_change_request
		WHERE u_id = ? AND u_req_type = ? AND u_req_key = ? AND u_req_end_ts >= ?;`;
		
		let sqlData = [u_id, u_req_type, u_req_key, Moment().unix()];
		
		return this.constructor.conn().ps(sql, sqlData, (err, res) =>
		{
			if (err)
				return cb(err, false);
			
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
		let sql = `DELETE FROM user_change_request
		WHERE u_id = ? AND u_req_type = ?;`;

		u_id = parseInt(u_id, 10);
		return this.constructor.conn().del(sql, [u_id, u_req_type], (err) =>
		{
			if (err)
				return cb(err, u_id);

			return cb(null, u_id);
		});
	}

	/**
	 * подсчет кол-ва всех пользователей
	 * @param loc_ids - массив с id locations
	 * @param s_name
	 */
	countUsers(loc_ids = [], s_name = '')
	{
		let sqlData = [];
		let sql = [`SELECT COUNT(u.u_id) AS u_cnt FROM users AS u`];
		if (loc_ids.length > 0)
		{
			sql.push(`JOIN users_locations AS ul ON(ul.u_id = u.u_id AND ul.l_id IN(${this.constructor.placeHoldersForIn(loc_ids)}))`);
			sqlData = [].concat(loc_ids);
		}

		sql = sql.join(`\n`);

		/*console.log('\n');
		console.log(sql);
		console.log(sqlData);*/

		return this.constructor.conn().sRow(sql, sqlData)
			.then((res) =>
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
	 * @param loc_ids - массив с id locations
	 * @param s_name
	 * @returns {Promise}
	 */
	getUsers(offset, limit, loc_ids = [], s_name = '')
	{
		offset = parseInt(offset, 10) || 0;
		limit = parseInt(limit, 10) || 20;

		let sqlData = [];
		let sql = [`SELECT u.u_id, u.u_mail, u.u_date_reg, u.u_date_visit, u.u_login, u.u_reg,
		ud.u_name, ud.u_surname, ud.u_sex, ud.u_birthday, ud.u_location_id, ud.u_latitude, ud.u_longitude
		FROM users AS u
		JOIN users_data AS ud ON (ud.u_id = u.u_id)`];

		if (loc_ids.length > 0)
		{
			sql.push(`JOIN users_locations AS ul ON(ul.u_id = u.u_id AND ul.l_id IN(${this.constructor.placeHoldersForIn(loc_ids)}))`);
			sqlData = [].concat(loc_ids);
		}
		sql.push(`LIMIT ${limit} OFFSET ${offset}`);

		sql = sql.join(`\n`);

		/*console.log('\n');
		console.log(sql);
		console.log(sqlData);*/

		return this.constructor.conn().ps(sql, sqlData)
			.then((res) =>
			{
				let user = {
					u_id:null, u_mail:null, u_date_reg:null, u_date_visit:null, u_login:null, u_reg:null,
					u_name:null, u_surname:null, u_sex:null, u_birthday:null,
					u_location_id:null, u_latitude:null, u_longitude:null
				};

				let users_ids = [];
				let users = [];

				if (res.info.numRows)
				{
					res.forEach((u) =>
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

	/**
	 * получаем список пользователей по указанным id
	 * @param u_ids
	 * @returns {Promise}
	 */
	getUserListById(u_ids)
	{
		let sql = `SELECT u.u_id, u.u_mail, u.u_date_reg, u.u_date_visit, u.u_login, u.u_reg,
		ud.u_name, ud.u_surname, ud.u_sex, ud.u_birthday, ud.u_location_id, ud.u_latitude, ud.u_longitude
		FROM users AS u
		LEFT JOIN users_data AS ud ON (ud.u_id = u.u_id)
		WHERE u.u_id IN(${this.constructor.placeHoldersForIn(u_ids)})`;
		//console.log(sql, u_ids);
		return this.constructor.conn().ps(sql, u_ids);
	}

	/**
	 * список стран, к которым привязаны юзеры
	 * @returns {*}
	 */
	getUsersCountryList()
	{
		let sql = `SELECT ln.l_id, ln.l_name 
		FROM (SELECT NULL) AS z
		JOIN location_names AS ln ON(ln.l_kind IN('country'))
		JOIN users_locations AS ul ON(ul.l_id = ln.l_id)
		GROUP BY ln.l_id
		ORDER BY ln.l_name`;

		//console.log(sql);

		return this.constructor.conn().ps(sql);
	}

	getUsersCityList(ui_country_id)
	{
		let sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?`;

		ui_country_id = parseInt(ui_country_id, 10)||0;

		if (!!ui_country_id === false)
			return Promise.resolve(null);

		return this.constructor.conn().psRow(sql, [ui_country_id])
			.then((res)=>
			{
				if (!res)
					return Promise.resolve(null);

				res['l_lk'] = parseInt(res['l_lk'], 10)||0;
				res['l_rk'] = parseInt(res['l_rk'], 10)||0;

				if (!res['l_lk'] || !res['l_rk'])
					return Promise.resolve(null);

				let kinds = ['province','locality'];

				let sqlData = [].concat(kinds);
				sqlData.unshift(res['l_lk'], res['l_rk']);

				sql = `SELECT ln.l_id, ln.l_name, ln.l_full_name
				FROM (SELECT NULL) AS z
				JOIN location AS l ON(l.l_lk >= ? AND l.l_rk <= ?)
				JOIN location_names AS ln ON(l.l_id = ln.l_id AND ln.l_kind IN(${this.constructor.placeHoldersForIn(kinds)}))
				JOIN users_locations AS ul ON(ul.l_id = ln.l_id)
				GROUP BY ln.l_id
				ORDER BY ln.l_name`;

				//console.log(sql, sqlData);

				return this.constructor.conn().ps(sql, sqlData);
			});
	}
}

module.exports = User;