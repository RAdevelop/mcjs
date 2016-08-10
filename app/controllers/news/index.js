"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class News extends Base
{
	indexActionGet(cb)
	{
		const self = this;

		self.getClass("user").getUser(self.getUserId())
		.then(function(userData)
		{
			self.view.setTplData("news", {});
			self.view.addPartialData("user/left", {user: userData});

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
module.exports = News;