"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const UserPhoto = require('app/models/user/photo');

class UserPhotoProfile extends UserPhoto
{
	/**
	 * получаем фотографию профиля пользователя
	 *
	 * @param u_id
	 * @returns {*}
	 */
	getUserAva(u_id)
	{
		let ava = {
			a_id: null,
			u_id: u_id,
			ai_id: null,
			ai_dir: null
		};
		let sql = "SELECT a.a_id, a.u_id, ai.ai_id, ai.ai_dir" +
			" FROM (SELECT NULL) AS z" +
			" JOIN album_type AS t ON (t.a_type_alias = ?)" +
			" JOIN album AS a ON (t.a_type_id = a.a_type_id)" +
			" JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = ? AND ai.ai_pos = ?)" +
			" LIMIT 1;";
		let sqlData = [this.constructor.albumProfile, u_id, 0];

		return this.constructor.conn().psRow(sql, sqlData)
			.then(function (res)
			{
				if (res)
					ava = Object.assign(ava, res);

				return Promise.resolve(ava);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhotoProfile;