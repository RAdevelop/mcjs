"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class KeyWords extends Base
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
		return this.model("keywords").getObjKeyWords(obj_id, obj_name);
	}

	getKeyWordByName(kw_name)
	{
		return this.model("keywords").getKeyWordByName(kw_name);
	}
	countObjByKwId(kw_id, obj_name)
	{
		return this.model("keywords").countObjByKwId(kw_id, obj_name);
	}

	getObjListByKwId(kw_id, obj_name, limit = 20, offset = 0)
	{
		return this.model("keywords").getObjListByKwId(kw_id, obj_name, limit, offset)
			.then((list)=>
			{
				if(!!list.length === false)
					return Promise.resolve(null);

				let ids = list.map((obj)=>
				{
					return parseInt(obj['obj_id'], 10)||0;
				});
				list = null;
				return Promise.resolve(ids);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = KeyWords;