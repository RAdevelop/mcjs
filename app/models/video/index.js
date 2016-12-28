"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");
const VideoAlbums = require('app/models/video/albums');

class Video extends VideoAlbums
{
	/**
	 * список видео в альбоме
	 *
	 * @param u_id
	 * @param va_id
	 * @param offset
	 * @param limit
	 */
	getAlbumVideos(u_id, va_id, offset = 0, limit = 20)
	{
		offset = parseInt(offset, 10) || 0;
		limit = parseInt(limit, 10) || 10;
		
		/*console.log('limit = ', limit);
		 console.log('offset = ', offset);*/

		let sql = `SELECT va.va_id, va.u_id, v.v_id, v.v_create_ts, v.v_update_ts, v.v_pos, v.v_name, v.v_alias, 
		v.v_text, v.v_img, v.v_content, v.v_url
		 FROM (SELECT NULL) AS z
		 JOIN video_albums AS va ON (va.va_id = ? AND va.u_id = ?)
		 JOIN video AS v ON (v.va_id = va.va_id)
		 ORDER BY v.v_pos
		 LIMIT ${limit} OFFSET ${offset};`;
		
		//console.log(sql);
		return this.constructor.conn().s(sql, [va_id, u_id]);
	}

	addVideo(u_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
	{
		let sqlData = [va_id, u_id];
		let now_ts = Moment().unix();

		let sql = `UPDATE video SET v_pos = v_pos+1 WHERE va_id = ? AND u_id = ?`;

		return this.constructor.conn().upd(sql, sqlData)
			.then(()=>
			{
				sql = `INSERT INTO video (va_id, u_id, v_create_ts, v_update_ts, v_pos, v_name, v_alias, v_text, 
		v_img, v_content, v_url) 
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
				sqlData = [va_id, u_id, now_ts, now_ts, 0, v_name, v_alias, v_text, v_img, v_content, v_url];
				return this.constructor.conn().ins(sql, sqlData);
			})
			.then((res)=>
			{
				sql = `UPDATE video_albums SET va_cnt = va_cnt+1 WHERE va_id = ? AND u_id = ?`;
				sqlData = [va_id, u_id];
				return this.constructor.conn().upd(sql, sqlData)
					.then(()=>
					{
						return Promise.resolve(res['insertId']);
					});
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;