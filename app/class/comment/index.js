"use strict";

const Errors = require('app/lib/errors');
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

	/**
	 * данные для вывода на клиентскую часть
	 *
	 * @param obj_id
	 * @param comments
	 * @param count
	 * @returns {{obj_id: number, list: Array, count: number}}
	 */
	commentsData(obj_id = 0, comments = [], count = 0)
	{
		return {
			obj_id: obj_id,
			list: comments,
			count: count
		};
	}

	/**
	 *
	 * @param Controller
	 * @param objClass
	 * @returns {Promise}
	 */
	commentActionPost(Controller, objClass)
	{
		let tplFile = 'comment/index.ejs';
		let tplData = Controller.getParsedBody();
		let obj_name = this.getObjName(objClass);

		//console.log('Controller.getUserId() = ', Controller.getUserId());
		//console.log('tplData = ', tplData);

		if (!tplData["ui_obj_id"] || !tplData['btn_save_comment'])
			throw new Errors.HttpError(400);

		switch (tplData['btn_save_comment'])
		{
			default:
				throw new Errors.HttpError(400);
				break;

			case 'add':
				return this._addCommentAction(Controller, obj_name, tplData, tplFile);
				break;

			//для добавления коммента к другому комменту не забыть проверять наличие этого комментария и передавать его id
		}
	}

	/**
	 * добавляем комментарий
	 *
	 * @param Controller - класс контроллера
	 * @param tplData - данные добавляемого комментария
	 * @param tplFile - названия файла с шаблоном
	 * @returns {Promise}
	 * @private
	 */
	_addCommentAction(Controller, obj_name, tplData, tplFile)
	{
		let errors = {};
		
		tplData = Controller.constructor.stripTags(tplData, ['t_comment']);
		tplData['t_comment'] = Controller.constructor.cheerio(tplData["t_comment"]).root().cleanTagEvents().html();

		if (!!tplData['t_comment'] === false)
			errors['t_comment'] = 'Укажите комментарий';

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (Controller.parseFormErrors(tplData, errors))
				{
					return this.model('comment')
						.commentCreate(Controller.getUserId(), tplData['ui_obj_id'], obj_name, tplData['t_comment'], 12)
						.then((cm_id)=>
						{
							return Controller.getUser(Controller.getUserId())
								.then((user)=>
								{
									tplData['user'] = user;
									tplData['ui_cm_id'] = cm_id;

									Controller.view.setTplData(tplFile, tplData);
									return Promise.resolve(true);
								});
						});
				}
			})
			.catch(Errors.ValidationError, (err) =>
			{
				//такие ошибки не уводят со страницы.
				Controller.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			});
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