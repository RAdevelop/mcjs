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

		let {ui_country, ui_city, s_name} = this._locReqQuery();
		console.log('ui_country = ', ui_country);
		console.log('ui_city = ', ui_city);
		console.log('s_name = ', s_name);

		return Promise.join(
			(isAjax ? Promise.resolve(null) : this.getUser(this.getUserId())),
			this.getClass("user").getUsers( new Pages(i_page, limit_per_page) ),
			(isAjax ? Promise.resolve(null) : this.getClass("user").getUsersCountryList())
			, (user, users, country_list)=>
			{
				let tplData = {
					'user': user,
					'users': users['users'],
					'users_cnt': users['users_cnt'],
					'country_list': country_list
				};

				const Pages = users.Pages;

				Pages.setLinksUri(this.getBaseUrl());

				tplData['pages'] = Pages.pages();

				let tplFile = (isAjax ? 'user/list.ejs' : 'user/index.ejs');

				this.view.setTplData(tplFile, tplData, isAjax);
				this.view.addPartialData('user/left', {user: tplData.user});
				//this.view.addPartialData("user/right", {});

				if (!isAjax)
				{
					this.getRes().expose(tplData['users'], 'users');
					this.getRes().expose(tplData["pages"], 'pages');
				}

				return Promise.resolve(isAjax);
			});
	}
	
	/**
	 * парсим поисковый GET запрос
	 * @private
	 */
	_locReqQuery()
	{
		let {loc=[], s_name=''} = this.reqQuery();
		s_name = s_name.trim();
		loc.forEach((l, inx)=>
		{
			l.trim();
			if (l == '')
			loc.splice(inx, 1);
		});

		loc = CtrlMain.helpers.varsValidate({ui_country: loc[0], ui_city: loc[1], s_name: s_name})

		return loc;
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
