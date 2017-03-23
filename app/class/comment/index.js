"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class Comment extends Base
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

	countComment(obj_id, obj_name)
	{
		return this.model("comment").countComment(obj_id, obj_name);
	}

	/**
	 *
	 * @param objClass - инстанс класса, для которого работает с комментариями
	 * @param obj_id - id объекта (например, id новости, или события)
	 * @param Pages
	 * @returns {Promise}
	 */
	getCommentList(objClass, obj_id, Pages)
	{
		let obj_name = this.getObjName(objClass);

		return this.countComment(obj_id, obj_name)
			.then((cnt)=>
			{
				Pages.setTotal(cnt);
				if (!cnt)
					return [[], Pages];

				return this.model("comment").getCommentList(obj_id, obj_name, Pages.getLimit(), Pages.getOffset())
					.then((comments)=>
					{
						return [comments, Pages];
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Comment;