"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Home extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': []
			}
		}
	}

	/**
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		const self = this;
		
		self.getClass("user").getUser(self.getUserId())
			.then(function(userData)
			{
				self.view.setTplData("home", {});
				self.view.addPartialData("user/left", {user: userData});
				self.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(Errors.NotFoundError, function(err)
			{
				//self.view.setTplData("home", {});
				//return cb(null);
				throw new Errors.HttpStatusError(404, "Not found");
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Home;
