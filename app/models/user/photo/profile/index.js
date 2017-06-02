"use strict";

//const Errors = require('app/lib/errors');
//const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const UserPhoto = require('app/models/user/photo');

class UserPhotoProfile extends UserPhoto
{
	/**
	 * получаем фотографию профиля пользователя
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	getUserAva(u_id)
	{
		let ava = {
			a_id: null,
			u_id: null,
			f_id: null,
			f_dir: null
		};
		let sql = `SELECT a.a_id, a.u_id, ai.f_id, ai.f_dir, ai.f_type
		FROM (SELECT NULL) AS z
		JOIN album_type AS t ON (t.a_type_alias = ?)
		JOIN album AS a ON (t.a_type_id = a.a_type_id)
		JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = ? AND ai.f_profile = ?)
		LIMIT 1;`;
		
		u_id = parseInt(u_id, 10);
		let sqlData = [this.constructor.albumProfile, u_id, 1];
		
		return this.constructor.conn().psRow(sql, sqlData)
			.then((res) =>
			{
				if (res)
					Object.assign(ava, res);
				
				return Promise.resolve(ava);
			});
	}

	/**
	 * получаем аватарки указанных юзеров
	 *
	 * @param user_ids
	 * @returns {avaList = {u_id:{avaData}}}
	 */
	getUsersAva(user_ids = [])
	{
		let placeHolders = this.constructor.placeHoldersForIn(user_ids);
		let sql = `SELECT a.a_id, a.u_id, ai.f_id, ai.f_dir, ai.f_type
		FROM (SELECT NULL) AS z
		JOIN album_type AS t ON (t.a_type_alias = ?)
		JOIN album AS a ON (t.a_type_id = a.a_type_id)
		JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id IN (${placeHolders}) AND ai.f_profile = ?);`;

		let sqlData = [];
		sqlData = sqlData.concat(user_ids);
		sqlData.unshift(this.constructor.albumProfile);
		sqlData.push(1);

		return this.constructor.conn().ps(sql, sqlData)
			.then((res) =>
			{
				let ava = {
					a_id: null,
					u_id: null,
					f_id: null,
					f_dir: null
				};

				let avaList = {};

				user_ids.forEach((u_id) =>
				{
					avaList[u_id] = Object.assign({}, ava, {u_id:u_id});;
					if (res)
					{
						res.forEach((item) =>
						{
							if (item.u_id == u_id)
								avaList[u_id] = Object.assign({}, avaList[u_id], item);
						});
					}
				});

				ava = null;
				return Promise.resolve(avaList);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhotoProfile;