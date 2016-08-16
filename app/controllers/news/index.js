"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class News extends Base
{
	indexActionGet(cb)
	{
		this.getClass("user").getUser(this.getUserId())
			.bind(this)
		.then(function(userData)
		{
			this.view.setTplData("news", {});
			this.view.addPartialData("user/left", {user: userData});

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