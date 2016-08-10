"use strict";

//var _ = require('lodash');
const Errors = require('app/lib/errors');
const Moment = require('moment');
const Promise = require("bluebird");
//const IORedis = require('app/lib/ioredis'); //TODO 
//const Logger = require('app/lib/logger')();

//***** module.exports
const User = require('app/models/user');

class Photo extends User
{
	static get albumUploaded()
	{
		return 'uploaded';
	}

	static get albumProfile()
	{
		return 'profile';
	}

	static get albumNamed()
	{
		return 'named';
	}

	/**
	 * создаем профильный альбом пользователя
	 *
	 * @param u_id
	 * @returns {Promise.<T>}
	 */
	createAlbumProfile(u_id)
	{
		let a_type_id;
		let sql = 'SELECT a_type_id FROM album_type WHERE a_type_alias = ?';

		return this.constructor.conn().psRow(sql, [this.constructor.albumProfile])
			.bind(this)
			.then(function (res)
			{
				a_type_id = res["a_type_id"];

				sql = 'SELECT a_id FROM album WHERE u_id = ? AND a_type_id = ?';
				return this.constructor.conn().psRow(sql, [u_id, a_type_id])
					.then(function (res)
					{
						if (!res)
							return Promise.reject(new Errors.NotFoundError());

						return Promise.resolve(res["a_id"]);
					});

			})
			.catch(Errors.NotFoundError, function ()
			{
				let a_name = 'Фотографии профиля';
				return this._insAlbum(u_id, a_type_id, a_name, a_name, a_name);
			});
	}

	_insAlbum(u_id, a_type_id, a_name, a_alias, a_text)
	{
		let sql = 'INSERT INTO album (u_id, a_type_id, a_name, a_alias, a_text, a_create_ts, a_update_ts) ' +
			'VALUES (?, ?, ?, ?, ?, ?, ?)';
		let now_ts = Moment().unix();

		return this.constructor.conn().ins(sql, [u_id, a_type_id, a_name, a_alias, a_text, now_ts, now_ts])
			.then(function (res)
			{
				return Promise.resolve(res['insertId'])
			});
	}

	createAlbumUploaded(u_id)
	{
		this.constructor.albumUploaded;
	}

	createAlbumNamed(u_id, a_name, a_text)
	{
		let a_type_id;
		let sql = 'SELECT a_type_id FROM album_type WHERE a_type_alias = ?';

		return this.constructor.conn().psRow(sql, [this.constructor.albumNamed])
			.bind(this)
			.then(function (res)
			{
				a_type_id = res["a_type_id"];

				return this._insAlbum(u_id, a_type_id, a_name, a_name, a_text);
			})
	}

	addProfilePhoto(u_id, fileData)
	{
		return this.createAlbumProfile(u_id)
			.bind(this)
			.then(function (a_id)
			{
				return this.insImage(a_id, u_id)
					.then(function (res)
					{
						fileData["a_id"] = a_id;
						fileData["u_id"] = u_id;
						fileData["ai_id"] = res['insertId'];
						return Promise.resolve(fileData);
					});
			});
	}

	insImage(a_id, u_id)
	{
		let now_ts = Moment().unix();
		let sql = 'INSERT INTO album_image (a_id, u_id, ai_create_ts, ai_update_ts)' +
			'VALUES (?, ?, ?, ?);';

		return this.constructor.conn().ins(sql, [a_id, u_id, now_ts, now_ts]);
	}

	updImage(u_id, a_id, ai_id, ai_latitude, ai_longitude, ai_text, ai_dir, ai_name, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL album_image_update(?, ?, ?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [u_id, a_id, ai_id, ai_latitude, ai_longitude, ai_text, ai_dir, ai_name, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(function ()
			{
				return Promise.resolve(ai_id);
			});
	}

	delImage(u_id, a_id, ai_id)
	{
		let sql = "CALL album_image_delete(?, ?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";

		return this.constructor.conn().multis(sql, [u_id, a_id, ai_id])
			.then(function (res)
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);

				return Promise.resolve(is_del);
			});
	}

	/**
	 * список фотоальбомов пользователя
	 * @param u_id
	 * @returns {*}
	 */
	getAlbumList(u_id)
	{
		let sql = "SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.a_img_cnt, a.a_create_ts, a.a_update_ts," +
			"t.a_type_alias, ai.ai_id, ai.ai_latitude, ai.ai_longitude, ai.ai_dir" +
			" FROM (SELECT NULL) AS z" +
			" JOIN album AS a ON (a.u_id = ?)" +
			" JOIN album_type AS t ON (t.a_type_id = a.a_type_id)" +
			" LEFT JOIN album_image AS ai ON (ai.a_id = a.a_id AND ai.u_id = ? AND ai_pos = ?)" +
			" ORDER BY a.a_create_ts DESC;";

		return this.constructor.conn().s(sql, [u_id, u_id, 0]);
	}

	/**
	 * выбранный альбом пользователя
	 * @param u_id
	 * @param a_id
	 * @returns {*}
	 */
	getAlbum(u_id, a_id)
	{
		let sql = "SELECT a.a_id, a.u_id, a.a_type_id, a.a_name, a.a_alias, a.a_text, a.a_img_cnt, a.a_create_ts, a.a_update_ts," +
			"t.a_type_alias" +
			" FROM (SELECT NULL) AS z" +
			" JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)" +
			" JOIN album_type AS t ON (t.a_type_id = a.a_type_id);";

		return this.constructor.conn().sRow(sql, [a_id, u_id]);
	}
}

module.exports = Photo;