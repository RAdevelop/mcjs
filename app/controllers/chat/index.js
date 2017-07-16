"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const CtrlMain = require('app/lib/controller');

class Chat extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			}
		};
	}
	
	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		if(!this.getUserId())
			return this.getRes().redirect('/login');
		
		this.view.useCache(false);
		
		//TODO список комнат/чатов потом перенести в БД и редис
		let namespace_list = [
			{
				id: 1,
				name: `room1`,
				user_count: 0
			},
			{
				id: 2,
				name: `room2`,
				user_count: 0
			},
			{
				id: 3,
				name: `room3`,
				user_count: 0
			}
		];
		
		//TODO нужно ли?
		let tplData = {
			namespace_list: namespace_list
		};
		
		let tplFile = 'chat/chat.ejs';
		this.view.setTplData(tplFile, tplData);
		//this.view.addPartialData("user/left", {user: userData});
		//this.view.addPartialData("user/right", {title: 'right_col'});
		
		this.getRes().expose(namespace_list, 'namespace_list');
		
		return Promise.resolve(null);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Chat;