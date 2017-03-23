"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class KeyWords extends Base
{
	getObjName(objClass)
	{
		if (objClass instanceof this.getClass('events').constructor)
			return 'events_list';
		if (objClass instanceof this.getClass('news').constructor)
			return 'news_list';
		if (objClass instanceof this.getClass('blog').constructor)
			return 'blog_list';
		if (objClass instanceof this.getClass('user').constructor)
			return 'user_photo';

		objClass = null;
		
		return null;
	}

	/**
	 * получаем список слов-меток для указанного объекта
	 *
	 * @param objClass
	 * @param obj
	 * @param obj_id_name
	 *
	 * @returns {Promise}
	 */
	getObjKeyWords(objClass, obj, obj_id_name)
	{
		let obj_name = this.getObjName(objClass);
		obj[obj_id_name] = parseInt(obj[obj_id_name], 10)||0;
		obj['kw_names'] = [];

		if (!obj || !!obj[obj_id_name] === false || !!obj_name === false)
			return Promise.resolve(obj);

		return this.model("keywords").getObjKeyWords(obj_name, obj[obj_id_name])
			.then((kw_list)=>
			{
				if (kw_list && kw_list.length > 0)
				{
					obj['kw_names'] = kw_list.map((kw)=>
					{
						return kw['kw_name'];
					});
				}
				return Promise.resolve(obj);
			});
	}

	getKeyWordByName(kw_name)
	{
		return this.model("keywords").getKeyWordByName(kw_name);
	}
	countObjByKwId(objClass, kw_id)
	{
		let obj_name = this.getObjName(objClass);
		kw_id = parseInt(kw_id, 10)||0;

		if (!!kw_id === false || !!obj_name === false)
			return Promise.resolve(0);

		return this.model("keywords").countObjByKwId(obj_name, kw_id);
	}

	getObjListByKwId(objClass, kw_id, limit = 20, offset = 0)
	{
		let obj_name = this.getObjName(objClass);

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

	saveKeyWords(objClass, obj_id, s_tags = '', obj_show = 0, obj_create_ts = 0, delimeter = ',')
	{
		let obj_name = this.getObjName(objClass);
		obj_id = parseInt(obj_id, 10)||0;

		if (!obj_id || !!obj_name === false)
			return Promise.resolve(1);

		s_tags = this.helpers.clearSymbol(s_tags||'', `-_${delimeter}`);
		let tags = [];
		s_tags.split(delimeter).forEach((tag)=>
		{
			tag = tag.trim();
			if (tag != '' && tag.length > 2)
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