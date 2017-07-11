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
		
		let tplData = {};
		
		let tplFile = 'chat/chat.ejs';
		this.view.setTplData(tplFile, tplData);
		//this.view.addPartialData("user/left", {user: userData});
		//this.view.addPartialData("user/right", {title: 'right_col'});
		
		return Promise.resolve(null);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Chat;