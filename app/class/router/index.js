"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class Router extends Base
{
	getAll()
	{
		return this.model('router').getAll();
	}

	getById(r_id)
	{
		return this.model('router').getById(r_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Router;