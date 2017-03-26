"use strict";

//const Errors = require('app/lib/errors');
//const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Comment extends BaseModel
{
	countComment(obj_id, obj_name)
	{
		obj_id = parseInt(obj_id, 10);
		if (!!obj_id === false || !!obj_name === false)
			return Promise.resolve(0);

		let sql = `SELECT COUNT(cm_id) AS cnt FROM comments AS cm
		WHERE cm_obj_id = ? AND cm_obj_name = ?`;

		let sqlData = [obj_id, obj_name];

		//console.log(sql, sqlData);

		return this.constructor.conn().sRow(sql, sqlData)
			.then((res) =>
			{
				return Promise.resolve(res["cnt"] || 0);
			});
	}

	/**
	 * комментарии для указанного "объекта" комментирования
	 * @param objClass - инстанс класса, для которого работает с комментариями
	 * @param obj_id - id объекта (например, id новости, или события)
	 * @returns {Promise}
	 */
	getCommentList(obj_id, obj_name, limit = 20, offset = 0)
	{
		obj_id = parseInt(obj_id, 10)||0;

		if (!!obj_id === false || !!obj_name === false)
			return Promise.resolve([]);

		limit = parseInt(limit, 10)||20;
		offset = parseInt(offset, 10)||0;

		let sql = `SELECT cm_id, cm_obj_name, cm_obj_id, cm_lk, cm_rk, cm_level, cm_create_ts, u_id, cm_text, 
		cm_sum_vote, cm_moderated, cm_moderate_ts, cm_hide,
		FROM_UNIXTIME(cm_create_ts, "%d-%m-%Y %H:%i:%s") AS dt_create_ts,
		FROM_UNIXTIME(cm_moderate_ts, "%d-%m-%Y %H:%i:%s") AS dt_moderate_ts, cm_pid
		FROM comments
		WHERE cm_obj_id = ? AND cm_obj_name = ?
		ORDER BY cm_obj_id, cm_lk
		LIMIT ${limit} OFFSET ${offset}`;

		let sqlData = [obj_id, obj_name];

		//console.log(sql, sqlData);
		return this.constructor.conn().ps(sql, sqlData);
	}

	/**
	 * комментарий по его id
	 *
	 * @param cm_id
	 * @returns {Promise}
	 */
	getComment(cm_id)
	{
		cm_id = parseInt(cm_id, 10)||0;

		let sql = `SELECT cm_id, cm_obj_name, cm_obj_id, cm_lk, cm_rk, cm_level, cm_create_ts, u_id, cm_text, 
		cm_sum_vote, cm_moderated, cm_moderate_ts, cm_hide,
		FROM_UNIXTIME(cm_create_ts, "%d-%m-%Y %H:%i:%s") AS dt_create_ts,
		FROM_UNIXTIME(cm_moderate_ts, "%d-%m-%Y %H:%i:%s") AS dt_moderate_ts, cm_pid
		FROM comments
		WHERE cm_id = ?`;

		//console.log(sql, sqlData);
		return this.constructor.conn().psRow(sql, [cm_id]);
	}

	/**
	 * добавляем комментарий
	 *
	 * @param u_id - кто
	 * @param obj_id - id объекта
	 * @param obj_name - имя объекта (новости, блоги и тп)
	 * @param t_comment - текст комментария
	 * @param cm_pid - id комментария, к которому добавляем комментарий
	 * @returns {*}
	 */
	commentCreate(u_id, obj_id, obj_name, t_comment, cm_pid = 0)
	{
		obj_id = parseInt(obj_id, 10)||0;
		u_id = parseInt(u_id, 10)||0;

		if (!!u_id === false  || !!obj_id === false || !!obj_name === false || !!t_comment === false)
			return Promise.resolve(0);

		let sql = `CALL comment_create (?, ?, ?, UNIX_TIMESTAMP(), ?, ?, @com_id,@com_rgt,@com_lv);
		SELECT @com_id AS cm_id, @com_rgt AS com_rgt, @com_lv AS com_lv FROM DUAL;`;

		let sqlData = [obj_id, obj_name, cm_pid, u_id, t_comment];
		//console.log(sql, sqlData);

		return this.constructor.conn().multis(sql, sqlData)
			.then((res) =>
			{
				let cm_id = (res[1] && res[1][0] && res[1][0]['cm_id'] ? parseInt(res[1][0]['cm_id'], 10) : 0);

				return Promise.resolve(cm_id);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Comment;