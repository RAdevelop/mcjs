"use strict";

//const Errors = require('app/lib/errors');
//const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class KeyWords extends BaseModel
{
	/**
	 * получаем список слов-меток для указанного объекта
	 *
	 * @param obj_id - например, для таблицы blog_list = b_id
	 * @param obj_name - например, для таблицы blog_list = blog_list
	 * @returns {Promise}
	 */
	getObjKeyWords(obj_id, obj_name)
	{
		if (!!obj_id === false || !!obj_name === false)
			return Promise.resolve([]);

		let sql = `SELECT kw.kw_id, kw.kw_name 
		FROM (SELECT NULL) AS z
		JOIN key_words_vs_objects AS kwo ON(kwo.obj_id = ? AND kwo.obj_name = ?)
		JOIN key_words AS kw ON(kw.kw_id = kwo.kw_id)`;

		obj_id = parseInt(obj_id, 10);
		let sqlData = [obj_id, obj_name];

		//console.log(sql, sqlData);

		return this.constructor.conn().ps(sql, sqlData);
	}

	getKeyWordByName(kw_name)
	{
		if (!!kw_name === false)
			return Promise.resolve(null);

		let sql = `SELECT kw.kw_id, kw.kw_name 
		FROM key_words AS kw
		WHERE kw.kw_name = ?`;

		let sqlData = [kw_name];

		//console.log(sql, sqlData);

		return this.constructor.conn().sRow(sql, sqlData);
	}
	
	countObjByKwId(kw_id, obj_name)
	{
		kw_id = parseInt(kw_id, 10);
		if (!!kw_id === false || !!obj_name === false)
			return Promise.resolve(0);
		
		let sql = `SELECT COUNT(kwo.obj_id) AS cnt FROM key_words_vs_objects AS kwo
		WHERE kwo.kw_id = ? AND kwo.obj_show = ? AND kwo.obj_name = ?`;
		
		let sqlData = [kw_id, 1, obj_name];
		
		//console.log(sql, sqlData);
		
		return this.constructor.conn().sRow(sql, sqlData)
			.then((res) =>
			{
				return Promise.resolve(res["cnt"] || 0);
			});
	}

	getObjListByKwId(kw_id, obj_name, limit = 20, offset = 0)
	{
		kw_id = parseInt(kw_id, 10);
		if (!!kw_id === false || !!obj_name === false)
			return Promise.resolve([]);

		limit = parseInt(limit, 10)||20;
		offset = parseInt(offset, 10)||0;

		let sql = `SELECT kwo.obj_id FROM key_words_vs_objects AS kwo
		WHERE kwo.kw_id = ? AND kwo.obj_show = ? AND kwo.obj_name = ?
		ORDER BY kwo.obj_create_ts DESC
		LIMIT ${limit} OFFSET ${offset}`;

		let sqlData = [kw_id, 1, obj_name];

		//console.log(sql, sqlData);

		return this.constructor.conn().ps(sql, sqlData);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = KeyWords;