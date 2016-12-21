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
		//TODO
		let sql = `SELECT a.a_id, a.u_id, ai.ai_id, ai.ai_create_ts, ai.ai_update_ts, ai.ai_name, ai.ai_text, ai.ai_pos,
			ai.ai_latitude, ai.ai_longitude, ai.ai_dir
			 FROM (SELECT NULL) AS z
			 JOIN album AS a ON (a.a_id = ? AND a.u_id = ?)
			 JOIN album_type AS t ON (t.a_type_id = a.a_type_id)
			 JOIN album_image AS ai ON (ai.a_id = a.a_id)
			 ORDER BY ai.ai_pos
			 LIMIT ${limit} OFFSET ${offset};`;
		
		//console.log(sql);
		return this.constructor.conn().s(sql, [va_id, u_id]);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;