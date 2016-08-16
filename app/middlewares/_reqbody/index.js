"use strict";
/**
 * Created by Asus on 27.02.2016.
 */
const Helpers = require("app/helpers");

module.exports = function (req, res, next)
{	
	if (req.method.toLowerCase() == 'get') return next();
	
	var reqBody = Object.assign({}, req.body);
	req._reqbody = Helpers.varsValidate(reqBody);
	
	reqBody = null;
	
	next();
};