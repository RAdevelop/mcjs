"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const CtrlMain = require('app/lib/controller');

class Home extends CtrlMain
{
	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		return this.getUser(this.getUserId())
			.then((userData) =>
			{
				this.view.setTplData("home", {});
				this.view.addPartialData("user/left", {user: userData});
				this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(Errors.NotFoundError, () =>
			{
				throw new Errors.HttpError(404);
			})
			.catch((err) =>
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Home;
