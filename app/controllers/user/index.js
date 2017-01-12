"use strict";


const Errors = require('app/lib/errors');
const Pages = require('app/lib/pages');
const Promise = require("bluebird");

const CtrlMain = require('app/lib/controller');

let limit_per_page = 2;

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

		return Promise.props({
			user: this.getUser(this.getUserId()),
			users: this.getClass("user").getUsers(new Pages(i_page, limit_per_page)) //{users:users, users_cnt:users_cnt, Pages:Pages}
		})
			.then((props) => {
				let tplFile = "user";
				let tplData = {
					"user": props.user,
					"users": props.users.users,
					"users_cnt": props.users.users_cnt
				};

				const Pages = props.users.Pages.setLinksUri(this.getBaseUrl());
				
				tplData["pages"] = Pages.pages();

				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData("user/left", {user: tplData.user});
				//self.view.addPartialData("user/right", {}); //TODO
				props = null;
				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
