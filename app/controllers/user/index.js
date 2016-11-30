"use strict";


const Errors = require('app/lib/errors');
const Pages = require('app/lib/pages');
const Promise = require("bluebird");
//const Mail = require('app/lib/mail');
//const _ = require('lodash');

const Base = require('app/lib/controller');

let limit_per_page = 20;

class User extends Base 
{
	routePaths()
	{
		return {
			"index": {
				"^\/?page\/[0-9]+\/?$" : [ ,"i_page"] //список с постраничкой
				,"^\/?[1-9]+[0-9]*\/?$" : ['i_u_id'] //профиль пользователя
				,"^\/?$" : null //список пользователей
			}
		}
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

		console.log("this.routeArgs;");
		console.log(this.routeArgs);

		let {i_u_id} = this.routeArgs;

		if (i_u_id)
		return this.userProfile(i_u_id);

		return this.usersList();
	}

	/**
	 * просмотр профиля выбранного пользователя
	 *
	 * @param u_id
	 */
	userProfile(u_id)
	{
		return this.getUser(u_id)
			.bind(this)
			.then(function (userData)
			{
				if (!userData || !userData.u_id)
					throw new Errors.HttpError(404);

				return this.getClass('user/photo').getAlbumList(this.getUserId(), u_id, new Pages(1, 4))
					.spread(function (albums)//, Pages
					{
						return [userData, albums];
					});
			})
			.spread(function (userData, albums)
			{
				let tplFile = "user/profile.ejs";
				let tplData = {
					user: userData,
					albums: albums
				};
				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData("user/left", {user: userData});
				//self.view.addPartialData("user/right", {}); //TODO

				return Promise.resolve(null);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * список пользователей
	 *
	 * @returns {Promise.<T>}
	 */
	usersList()
	{
		let {i_page} = this.routeArgs;

		return Promise.props({
			user: this.getUser(this.getUserId()),
			users: this.getClass("user").getUsers(new Pages(i_page, limit_per_page)) //{users:users, users_cnt:users_cnt, Pages:Pages}
		})
			.bind(this)
			.then(function(props)
			{
				let tplFile = "user";
				let tplData = {
					"user": props.user,
					"users": props.users.users,
					"users_cnt": props.users.users_cnt
				};

				const Pages = props.users.Pages.setLinksUri(this.getBaseUrl());
				delete props.users.Pages;

				tplData["pages"] = Pages.setLinksUri(this.getBaseUrl()).pages();

				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData("user/left", {user: tplData.user});
				//self.view.addPartialData("user/right", {}); //TODO

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
