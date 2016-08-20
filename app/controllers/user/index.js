"use strict";


const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const Mail = require('app/lib/mail');
//const _ = require('lodash');

const Base = require('app/lib/controller');

class User extends Base 
{
	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));

		return this.getClass("user").getUser(this.getUserId())
			.bind(this)
			.then(function(userData)
			{
				this.view.setTplData("user", {});
				this.view.addPartialData("user/left", {user: userData});
				//self.view.addPartialData("user/right", {}); //TODO

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
