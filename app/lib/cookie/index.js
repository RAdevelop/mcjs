"use strict";
/**
 * Created by Asus on 07.04.2016.
 */

const AppConfig = require('app/config');

module.exports = Cookie;

function Cookie(){}


Cookie.clearCookie = function(req, res, name)
{
	if(req.signedCookies[name])
		res.clearCookie(name, {httpOnly: true, path: '/', signed: true });
};

Cookie.setCookie = function(res, name, value, maxAge)
{
	res.cookie(name, value, {httpOnly: true, maxAge: maxAge, path: '/'
		, signed: true
		, secure: true //TODO типа только для https
	});
};


Cookie.setUserId = function(res, value)
{
	Cookie.setCookie(res, 'rtid', value, AppConfig.userCookieExpires);	
};

Cookie.clearUserId = function(req, res)
{
	Cookie.clearCookie(req, res, 'rtid');
};

