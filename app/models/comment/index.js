"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Comment extends BaseModel
{
	countComment(obj_id, obj_name)
	{
		obj_id = parseInt(obj_id, 10);
		if (!!obj_id === false || !!obj_name === false)
			return Promise.resolve(0);
		
		/*let sql = `SELECT COUNT(cm_id) AS cnt FROM comments AS cm
		WHERE cm_obj_id = ? AND cm_obj_name = ?`;*/
		
		let sql = `SELECT cm_cnt AS cnt FROM comments_stat AS cm WHERE cm_obj_id = ? AND cm_obj_name = ?`;
		let sqlData = [obj_id, obj_name];
		
		//console.log(sql, sqlData);
		
		return this.constructor.conn().sRow(sql, sqlData)
			.then((res) =>
			{
				let cnt = (!!res && !!res['cnt'] ? parseInt(res['cnt'], 10) : 0);
				return Promise.resolve(cnt);
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
		GROUP BY cm_lk
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
	 * @param cm_obj_id
	 * @param obj_name
	 * @returns {Promise}
	 */
	getComment(cm_id, cm_obj_id = null, obj_name = null)
	{
		cm_id = parseInt(cm_id, 10)||0;
		cm_obj_id = parseInt(cm_obj_id, 10)||0;
		
		let sqlData = [cm_id];
		
		let sql = [`SELECT cm_id, cm_obj_name, cm_obj_id, cm_lk, cm_rk, cm_level, cm_create_ts, u_id, cm_text, 
		cm_sum_vote, cm_moderated, cm_moderate_ts, cm_hide,
		FROM_UNIXTIME(cm_create_ts, "%d-%m-%Y %H:%i:%s") AS dt_create_ts,
		FROM_UNIXTIME(cm_moderate_ts, "%d-%m-%Y %H:%i:%s") AS dt_moderate_ts, cm_pid
		FROM comments
		WHERE cm_id = ?`];
		
		if (!!cm_obj_id && !!obj_name)
		{
			sqlData.push(cm_obj_id);
			sql.push(`cm_obj_id = ?`);
		
			sqlData.push(obj_name);
			sql.push(`cm_obj_name = ?`);
		}
		sql = sql.join(` AND `);
		
		//console.log(sql);
		//console.log(sqlData);
		
		return this.constructor.conn().psRow(sql, sqlData);
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
	
	editComment(cm_id, cm_text)
	{
		cm_id = parseInt(cm_id, 10)||0;
		
		if (!!cm_id === false || !!cm_text === false)
			return Promise.resolve(null);
		
		let now_ts = Moment().unix();
		let sqlData = [cm_text, now_ts, cm_id];
		let sql = `UPDATE comments SET cm_text = ?, cm_moderate_ts = ? WHERE cm_id = ?`;
		
		//console.log(sql, sqlData);
		
		return this.constructor.conn().upd(sql, sqlData);
	}
	
	/**
	 * удаляем комментария
	 *
	 * @param isRootAdmin
	 * @param u_id
	 * @param cm_id
	 * @returns {Promise}
	 */
	deleteComment(isRootAdmin, u_id, cm_id)
	{
		isRootAdmin = (!!isRootAdmin ? 1 : 0);
		cm_id = parseInt(cm_id, 10)||0;
		u_id = parseInt(u_id, 10)||0;
		
		if (!!cm_id === false || !!u_id === false)
			return Promise.resolve(0);
		
		let sql = `CALL comment_delete (?, ?, ?, @is_del, @cm_cnt);
		SELECT @is_del AS is_del, @cm_cnt AS cm_cnt FROM DUAL;`;
		
		let sqlData = [cm_id, isRootAdmin, u_id];
		//console.log(sql, sqlData);
		
		return this.constructor.conn().multis(sql, sqlData)
		.then((res) =>
		{
			//console.log('res = ', res[1][0]);
			let is_del = (!!res[1] && !!res[1][0] && !!res[1][0]['is_del'] ? parseInt(res[1][0]['is_del'], 10) : 0);
			let cm_cnt = (!!res[1] && !!res[1][0] && !!res[1][0]['cm_cnt'] ? parseInt(res[1][0]['cm_cnt'], 10) : 0);
			
			return Promise.resolve([is_del, cm_cnt]);
		});
	}
	
	/**
	 * удаляем все комментарии для указанного объекта (новость, блон и тп)
	 *
	 * @param objClass
	 * @param obj_id
	 * @returns {Promise}
	 */
	deleteCommentForObj(obj_id, obj_name)
	{
		obj_id = parseInt(obj_id, 10)||0;
		
		if (!!obj_id === false || !!obj_name === false)
			return Promise.resolve(0);
		
		let sqlData = [obj_id, obj_name];
		let sql = `DELETE FROM comments WHERE obj_id = ? AND obj_name = ?`;
		
		//console.log(sql, sqlData);
		
		return this.constructor.conn().del(sql, sqlData);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Comment;