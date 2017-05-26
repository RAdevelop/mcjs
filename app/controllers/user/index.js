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

		this.view.useCache(true);

		return this._usersList();
	}
	
	indexActionPost()
	{
		let tplData = this.getParsedBody();
		
		if (!this.isAuthorized() || !!tplData['btn_user_search'] === false)
			throw new Errors.HttpError(401);
		
		if (!tplData['ui_country'])
			throw new Errors.HttpError(404);
		
		let isAjax = this.getReq().xhr;
		
		return this.getClass("user").getUsersCityList(tplData['ui_country'])
			.then((city_list)=>
			{
				tplData['city_list'] = city_list;
				
				this.view.setTplData(tplData);
				return Promise.resolve(isAjax);
			});
	}
	
	/**
	 * список пользователей
	 *
	 * @returns {Promise}
	 */
	_usersList()
	{
		let {i_page} = this.routeArgs;
		let isAjax = this.getReq().xhr;

		let {ui_country, ui_city, s_name} = this._locReqQuery();

		/*console.log('isAjax = ', isAjax);
		console.log('ui_country = ', ui_country);
		console.log('ui_city = ', ui_city);
		console.log('s_name = ', s_name);*/
		
		let loc_ids = [];
		let location_id = [];
		if (ui_country)
		{
			loc_ids.push(ui_country);
			if (ui_city)
				loc_ids.push(ui_city);
		}
		
		if(!!loc_ids[loc_ids.length-1])
			location_id = [loc_ids[loc_ids.length-1]];
		
		return Promise.join(
			this.getClass('user').getUsers( new Pages(i_page, limit_per_page), location_id, s_name, true ),
			(isAjax ? Promise.resolve(null) : this.getUser(this.getUserId())),
			(isAjax ? Promise.resolve(null) : this.getClass("user").getUsersCountryList(ui_country)),
			(isAjax ? Promise.resolve(null) : this.getClass("user").getUsersCityList(ui_country, ui_city))
			, (users, user, country_list, city_list)=>
			{
				let tplData = {
					'user': user,
					'users': users['users'],
					'users_cnt': users['users_cnt'],
					'country_list': country_list||[],
					'city_list': city_list||[],
					'u_search_name': s_name
				};

				const Pages = users.Pages;

				if (loc_ids.length)
					Pages.setLinksQuery({loc: loc_ids});

				if (!!s_name)
					Pages.setLinksQuery({s_name: s_name}, true);

				Pages.setLinksUri(this.getBaseUrl());

				tplData['pages'] = Pages.pages();

				let tplFile = (isAjax ? 'user/list.ejs' : 'user/index.ejs');

				this.view.setTplData(tplFile, tplData, isAjax);

				if (!isAjax)
				{
					this.view.addPartialData('user/left', {user: tplData['user']});
					//this.view.addPartialData("user/right", {});
					
					this.getRes().expose(tplData['users'], 'users');
					this.getRes().expose(tplData["pages"], 'pages');
					this.getRes().expose(country_list, 'country_list');
					this.getRes().expose(city_list, 'city_list');
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
			l = parseInt(l, 10);
			if (!!l === false)
				loc.splice(inx, 1);
			else
				loc[inx] = l;
		});
		s_name = CtrlMain.helpers.clearSymbol(s_name, '-');
		loc = CtrlMain.helpers.varsValidate({ui_country: loc[0], ui_city: loc[1], s_name: s_name})

		return loc;
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
