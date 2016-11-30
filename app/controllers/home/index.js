"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Home extends Base
{
	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		return this.getUser(this.getUserId())
			.bind(this)
			.then(function(userData)
			{
				this.view.setTplData("home", {});
				this.view.addPartialData("user/left", {user: userData});
				this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(Errors.NotFoundError, function()
			{
				throw new Errors.HttpError(404);
			})
			.catch(function(err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Home;
