"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");
const BaseModel = require('app/lib/db');

class VideoAlbums extends BaseModel
{
	/**
	 * подсчитываем кол-во альбомов пользователя
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	countUserVideoAlbums(u_id)
	{
		let sql = `SELECT COUNT(va_id) AS cnt FROM video_albums WHERE u_id = ?;`;
		u_id = parseInt(u_id, 10);
		return this.constructor.conn().sRow(sql, [u_id])
			.then((res) =>
			{
				return Promise.resolve(res["cnt"]);
			});
	}

	getVideoAlbumList(u_id, offset = 0, limit = 20)
	{
		offset = parseInt(offset, 10) || 0;
		limit = parseInt(limit, 10) || 10;
		u_id = parseInt(u_id, 10);

		let sql = `SELECT va.va_id, va.u_id, va.va_name, va.va_alias, va.va_text, va.va_cnt, va.va_create_ts, 
		va.va_update_ts, v.v_id, v.v_img, FROM_UNIXTIME(va.va_create_ts, "%d-%m-%Y") AS dt_create_ts
		FROM (SELECT NULL) AS z
		JOIN video_albums AS va ON (va.u_id = ?)
		LEFT JOIN video AS v ON (v.va_id = va.va_id AND v.u_id = va.u_id AND v.v_pos = ?)
		ORDER BY va.va_update_ts DESC
		LIMIT ${limit} OFFSET ${offset}`;

		//console.log(sql);

		return this.constructor.conn().s(sql, [u_id, 0]);
	}

	addVideoAlbum(u_id, va_name, va_alias, va_text)
	{
		let sql = `INSERT INTO video_albums (u_id, va_name, va_alias, va_text, va_create_ts, va_update_ts)
		VALUES (?, ?, ?, ?, ?, ?)`;

		let now_ts = Moment().unix();

		return this.constructor.conn()
			.ins(sql, [u_id, va_name, va_alias, va_text, now_ts, now_ts])
			.then((res) =>
			{
				return Promise.resolve(res['insertId'])
			})
			.catch((err)=>
			{
				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	/**
	 * выбранный альбом пользователя
	 * @param u_id
	 * @param va_id
	 * @returns {Promise}
	 */
	getVideoAlbum(u_id, va_id)
	{
		let sql = `SELECT va.va_id, va.u_id, va.va_name, va.va_alias, va.va_text, va.va_cnt, va.va_create_ts, 
		va.va_update_ts, v.v_id, v.v_img, FROM_UNIXTIME(va.va_create_ts, "%d-%m-%Y") AS dt_create_ts
		FROM (SELECT NULL) AS z
		JOIN video_albums AS va ON (va.va_id = ? AND va.u_id = ?)
		LEFT JOIN video AS v ON (v.va_id = va.va_id AND v.u_id = va.u_id AND v.v_pos = ?);`;
		va_id = parseInt(va_id, 10);
		u_id = parseInt(u_id, 10);
		return this.constructor.conn().sRow(sql, [va_id, u_id, 0]);
	}
	
	/**
	 * редактируем название и описание альбома пользователя
	 *
	 * @param u_id
	 * @param va_id
	 * @param va_name
	 * @param va_alias
	 * @param va_text
	 * @returns {Promise}
	 */
	editVideoAlbum(u_id, va_id, va_name, va_alias, va_text)
	{
		let sql = `UPDATE video_albums SET va_name = ?, va_alias = ?, va_text = ?, va_update_ts = ? 
		WHERE va_id = ? AND u_id = ?`;

		let now_ts = Moment().unix();

		va_id = parseInt(va_id, 10);
		u_id = parseInt(u_id, 10);
		return this.constructor.conn().upd(sql, [va_name, va_alias, va_text, now_ts, va_id, u_id])
			.then(()=>
			{
				return Promise.resolve(va_id);
			})
			.catch((err)=>
			{
				if (err.name == 'DbErrDuplicateEntry')
					throw new Errors.AlreadyInUseError();

				throw err;
			});
	}

	delVideoAlbum(u_id, va_id)
	{
		let sql = `CALL video_album_delete(?,?);`;
		return this.constructor.conn().call(sql, [u_id, va_id])
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = VideoAlbums;