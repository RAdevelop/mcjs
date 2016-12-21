"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");
const Video = require('app/models/video');

class VideoAlbums extends Video
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

		return this.constructor.conn().sRow(sql, [u_id])
			.then((res) => {
				return Promise.resolve(res["cnt"]);
			});
	}

	getVideoAlbumList(u_id, offset = 0, limit = 20)
	{
		offset = parseInt(offset, 10) || 0;
		limit = parseInt(limit, 10) || 10;
		
		let sql = `SELECT va.va_id, va.u_id, va.va_name, va.va_alias, va.va_text, va.va_cnt, va.va_create_ts, 
		va.va_update_ts, v.v_id, v.v_img
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
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = VideoAlbums;