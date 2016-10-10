"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Home extends Base
{
	/**
	 *
	 * @returns {*}
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
			.catch(Errors.NotFoundError, function(err)
			{
				throw new Errors.HttpStatusError(404, "Not found");
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
