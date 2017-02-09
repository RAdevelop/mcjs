"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class KeyWords extends Base
{
	objName(obj)
	{
		if (obj instanceof this.getClass('blog').constructor)
			return 'blog_list';

		if (obj instanceof this.getClass('user/photo').constructor)
			return 'user_photo';

		if (obj instanceof this.getClass('news').constructor)
			return 'news';

		if (obj instanceof this.getClass('events').constructor)
			return 'events';

		//let list = ['blog_list', 'user_photo', 'news', 'events'];
	}

	setObjName(obj)
	{
		if (!!this._objName === false)
		this._objName = this.objName(obj);
		obj = null;
		return this;
	}

	getObjName()
	{
		return this._objName;
	}

	/**
	 * получаем список слов-меток для указанного объекта
	 *
	 * @param obj_id - например, для таблицы blog_list = b_id
	 *
	 * @returns {Promise}
	 */
	getObjKeyWords(obj_id)
	{
		return this.model("keywords").getObjKeyWords(obj_id, this.getObjName());
	}

	getKeyWordByName(kw_name)
	{
		return this.model("keywords").getKeyWordByName(kw_name);
	}
	countObjByKwId(kw_id)
	{
		return this.model("keywords").countObjByKwId(kw_id, this.getObjName());
	}

	getObjListByKwId(kw_id, limit = 20, offset = 0)
	{
		return this.model("keywords").getObjListByKwId(kw_id, this.getObjName(), limit, offset)
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