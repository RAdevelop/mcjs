"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class KeyWords extends Base
{
	/**
	 * получаем список слов-меток для указанного объекта
	 *
	 * @param obj_name - например, для таблицы blog_list = blog_list
	 * @param obj_id - например, для таблицы blog_list = b_id
	 *
	 * @returns {Promise}
	 */
	getObjKeyWords(obj_name, obj_id)
	{
		return this.model("keywords").getObjKeyWords(obj_name, obj_id);
	}

	getKeyWordByName(kw_name)
	{
		return this.model("keywords").getKeyWordByName(kw_name);
	}
	countObjByKwId(obj_name, kw_id)
	{
		return this.model("keywords").countObjByKwId(obj_name, kw_id);
	}

	getObjListByKwId(obj_name, kw_id, limit = 20, offset = 0)
	{
		return this.model("keywords").getObjListByKwId(obj_name, kw_id, limit, offset)
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

	saveKeyWords(obj_name, s_tags, obj_id, obj_show, obj_create_ts, delimeter = ',')
	{
		obj_id = parseInt(obj_id, 10);
		if (!obj_id || !!obj_name === false)
			return Promise.resolve(1);

		s_tags = this.helpers.clearSymbol(s_tags||'', `-_${delimeter}`);
		let tags = [];
		s_tags.split(delimeter).forEach((tag)=>
		{
			tag = tag.trim();
			if (tag != '' && tag.length > 3)
				tags.push(tag);
		});

		return this.model("keywords").unlinkKeyWordObj(obj_id, obj_name)
			.then(()=>
			{
				if (tags.length == 0)
					return Promise.resolve(1);

				obj_show = (!!obj_show && obj_show == 1 ? 1 : 0);

				let promiseKwIds = tags.map((tag)=>
				{
					return this.model("keywords").addKeyWord(tag);
				});

				return Promise.all(promiseKwIds)
					.spread((...spread)=>
					{
						let promiseKwIds = spread.map((kw_id)=>
						{
							return this.model("keywords")
								.linkKeyWordObj(kw_id, obj_name, obj_id, obj_show, obj_create_ts)
						});

						return Promise.all(promiseKwIds);
					});
			});
	}
	getKeyWordList()
	{
		return this.model("keywords").getKeyWordList();
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = KeyWords;