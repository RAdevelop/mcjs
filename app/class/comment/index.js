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
		
		let btn_save_comment = tplData['btn_save_comment'];
		switch (btn_save_comment)
		{
			default:
				throw new Errors.HttpError(400);
				break;
			
			case 'add':
			case 'edit':
				let errors = {};
				
				tplData = Controller.constructor.stripTags(tplData, ['t_comment']);
				tplData['t_comment'] = Controller.constructor
					.cheerio(tplData["t_comment"]).root().cleanTagEvents().html();
				
				if (!!tplData['t_comment'] === false)
					errors['t_comment'] = 'Укажите комментарий';
				
				tplData['ui_cm_pid'] = tplData['ui_cm_pid']||0;
				
				if (btn_save_comment == 'add')
				return this._addCommentAction(Controller, obj_name, tplData, tplFile, errors);
				
				if (btn_save_comment == 'edit')
				return this._editCommentAction(Controller, obj_name, tplData, tplFile, errors);
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
	 * @param errors
	 * @returns {Promise}
	 * @private
	 */
	_addCommentAction(Controller, obj_name, tplData, tplFile, errors)
	{
		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (Controller.parseFormErrors(tplData, errors))
				{
					return this.model('comment')
						.commentCreate(Controller.getUserId(), tplData['ui_obj_id'], obj_name, tplData['t_comment'], tplData['ui_cm_pid'])
						.then((cm_id)=>
						{
							return Promise.join(
								Controller.getUser(Controller.getUserId()),
								this.getComment(cm_id)
							, (user, comment)=>
								{
									tplData['user'] = user;
									Object.assign(tplData, comment);
									
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
	
	/**
	 * редактируем комментарий
	 *
	 * @param Controller - класс контроллера
	 * @param tplData - данные добавляемого комментария
	 * @param tplFile - названия файла с шаблоном
	 * @param errors
	 * @returns {Promise}
	 * @private
	 */
	_editCommentAction(Controller, obj_name, tplData, tplFile, errors)
	{
		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (Controller.parseFormErrors(tplData, errors))
				{
					return Promise.join(
						this.getClass('user/groups').isRootAdmin(Controller.getUserId()),
						this.getComment(tplData['ui_cm_id'], tplData['ui_obj_id'], obj_name)
						, (isRootAdmin, comment)=>
						{
							if (!!comment === false || (!isRootAdmin && comment['u_id'] != Controller.getUserId()))
							{
								errors['t_comment'] = 'Комментарий не найден';
								Controller.parseFormErrors(tplData, errors);
							}
							else 
							{
								return Promise.resolve([tplData, isRootAdmin]);
							}
						})
						.spread((tplData, isRootAdmin)=>
						{
							return this.editComment(tplData['ui_cm_id'], tplData['t_comment'])
								.then((comment)=>
								{
									if (!!comment === false)
									{
										errors['t_comment'] = 'Комментарий не найден';
										Controller.parseFormErrors(tplData, errors);
									}
									else
									{
										Comment._commentEditable(Controller.getUserId(), isRootAdmin, new Date(), comment);
										
										Object.assign(tplData, comment);
										Controller.view.setTplData(tplFile, tplData);
									}
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
	 * @param Controller
	 * @param objClass - инстанс класса, для которого работает с комментариями
	 * @param isRootAdmin
	 * @param obj_id - id объекта (например, id новости, или события)
	 * @param Pages
	 * @returns {Promise}
	 */
	getCommentList(Controller, objClass, isRootAdmin, obj_id, Pages)
	{
		let obj_name = this.getObjName(objClass);
		
		return this.countComment(obj_id, obj_name)
			.then((cnt)=>
			{
				Pages.setTotal(cnt);
				if (!cnt)
					return [[], Pages];
				
				return this.model("comment")
					.getCommentList(obj_id, obj_name, Pages.getLimit(), Pages.getOffset())
					.then((comments)=>
					{
						let nowDate = new Date();
						let u_ids = comments.map((cm)=>
						{
							Comment._commentEditable(Controller.getUserId(), isRootAdmin, nowDate, cm);
							return cm['u_id'];
						});
						
						return this.getClass('user').getUserListById(u_ids, comments)
							.spread((users, comments)=>
							{
								u_ids = users = null;
								
								this.helpers.nlTextSplit(comments, 'cm_text');
								return [comments, Pages];
							});
					});
			});
	}
	
	static _commentEditable(u_id, isRootAdmin, nowDate, cm)
	{
		let editable = (cm['u_id'] == u_id && !Comment._commentIsOutdated(nowDate, cm['cm_create_ts']));
		
		cm['cm_editable'] = (editable || isRootAdmin );
		cm['cm_owner'] = (u_id == cm['u_id']);
	}
	static _commentIsOutdated(nowDate, cm_create_ts, min = 15)
	{
		min = min*60; //в секундах
		return (nowDate.getTime()/1000 - cm_create_ts > min);
	}
	
	/**
	 * данные указанного комментария
	 * 
	 * @param cm_id
	 * @param cm_obj_id
	 * @param obj_name
	 * @returns {Promise}
	 */
	getComment(cm_id, cm_obj_id = null, obj_name = null)
	{
		return this.model('comment').getComment(cm_id, cm_obj_id, obj_name)
			.then((comment)=>
			{
				if (!comment)
					return Promise.resolve(comment);
				
				this.helpers.nlTextSplit(comment, 'cm_text');
				return Promise.resolve(comment);
			});
	}
	
	/**
	 * редактируем текст комментария
	 * @param cm_id
	 * @param cm_text
	 * @returns {Promise}
	 */
	editComment(cm_id, cm_text)
	{
		return this.model('comment').editComment(cm_id, cm_text)
			.then(()=>
			{
				return this.getComment(cm_id);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Comment;