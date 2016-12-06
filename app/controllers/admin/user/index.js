/**
 * Created by ra on 03.12.16.
 */
"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require('app/lib/pages');

const CtrlMain = require('app/lib/controller');

//let limit_per_page = 20;

class AdminUser extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?page\/[0-9]+\/?$' : [ ,"i_page"] //список с постраничкой
				,'^\/?[0-9]+\/?$': ['ui_u_id']
				,'^\/?$': null
			},
			"edit": {
				'^\/?$': null
			}
		};
	}

	indexActionGet()
	{
		let {i_page=1, ui_u_id=null} = this.routeArgs;

		if (ui_u_id)
			return this.viewUser(ui_u_id);

		return this.getUserList(i_page);
	}

	getUserList(i_page)
	{
		//{users:users, users_cnt:users_cnt, Pages:Pages}
		return this.getClass("user").getUsers(new Pages(i_page))
			.bind(this)
			.then(function(users)
			{
				let tplFile = 'admin/user';
				let tplData = {};
				tplData['user_list'] = users.users || [];

				tplData["pages"] = users.Pages.setLinksUri(this.getBaseUrl()).pages();

				//экспрот данных в JS на клиента
				//this.getRes().expose(tplData.user_list, 'user_list');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * показываем страницу пользователя по id
	 *
	 */
	viewUser(ui_u_id)
	{
		let tplFile = 'admin/user/user.ejs';

		if(!ui_u_id)
			throw new Errors.HttpError(404);

		return this.getClass('user').getUser(ui_u_id)
			.bind(this)
			.then(function (uData)
			{
				if (!uData)
					throw new Errors.HttpError(404);

				return this.getClass('user/groups').getAll()
					.then(function (userGroupsList)
					{
						let tplData = {
							'user': uData,
							'userGroupsList': userGroupsList
						};

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				//экспрот данных в JS на клиента
				//this.getRes().expose(tplData.userGroupsList, 'userGroupsList');
				//this.getRes().expose(tplData.menuList, 'menuList');
				//this.getRes().expose(tplData.methodsList, 'methodsList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * обновляем данные пользователя по id
	 *
	 */
	editActionPost()
	{
		let tplData = this.getParsedBody();
		let action = tplData["btn_user_save"] || null;

		switch (action)
		{
			default:

				if (!tplData["ui_u_id"])
					throw new Errors.HttpError(404);

				return this.getClass('user').getById(tplData["ui_u_id"])
					.bind(this)
					.then(function (user)
					{
						if (!user)
							throw new Errors.HttpError(404);

						switch (action)
						{
							default:
								throw new Errors.HttpError(400);
								break;

							case 'user_to_groups':
								return this.addUserToGroups(tplData);
								break;
						}
					});
				break;
		}
	}

	/**
	 * добавляем пользователя в указанные группы
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	addUserToGroups(tplData)
	{
		let tplFile = 'admin/user/groups/index.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};

				if (!tplData["ui_u_id"])
					errors["ui_u_id"] = "Не указан пользователь";

				tplData["ug_ids"] = tplData["ug_ids"] || [];

				this.parseFormErrors(tplData, errors);

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/groups').addUserToGroups(tplData["ui_u_id"], tplData["ug_ids"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = AdminUser;