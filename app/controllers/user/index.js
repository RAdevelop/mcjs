"use strict";


const Errors = require('app/lib/errors');
const Pages = require('app/lib/pages');
const Promise = require("bluebird");

const CtrlMain = require('app/lib/controller');

let limit_per_page = 20;

class User extends CtrlMain
{
	static routePaths()
	{
		return {
			"index": {
				"^\/?page\/[0-9]+\/?$" : [ ,"i_page"] //список с постраничкой
				,"^\/?$" : null //список пользователей
			}
		};
	}

	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		if (!this.isAuthorized())
			throw new Errors.HttpError(401);

		return this.usersList();
	}

	/**
	 * список пользователей
	 *
	 * @returns {Promise}
	 */
	usersList()
	{
		let {i_page} = this.routeArgs;
		let isAjax = this.getReq().xhr;

		return Promise.props({
			user: (isAjax ? Promise.resolve(null) : this.getUser(this.getUserId())),
			users: this.getClass("user").getUsers(new Pages(i_page, limit_per_page)) //{users:users, users_cnt:users_cnt, Pages:Pages}
		})
			.then((props) =>
			{
				let tplData = {
					"user": props.user,
					"users": props.users['users'],
					"users_cnt": props.users.users_cnt
				};

				const Pages = props.users.Pages;

				Pages.setLinksUri(this.getBaseUrl()).setAjaxPagesType(true);

				tplData["pages"] = Pages.pages();

				let tplFile = (isAjax ? 'user/list.ejs' : 'user/index.ejs');

				this.view.setTplData(tplFile, tplData, isAjax);
				this.view.addPartialData("user/left", {user: tplData.user});
				//this.view.addPartialData("user/right", {});


				if (!isAjax)
				{
					this.getRes().expose(tplData['users'], 'users');
					this.getRes().expose(tplData["pages"], 'pages');
				}

				props = null;
				return Promise.resolve(null);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
