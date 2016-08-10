'use strict';
/**
 * Created by RA on 07.02.2016.
 */
//const Errors = require('app/lib/errors');

module.exports = function(req, res, next)
{
	if(!req._user)
	{
		//console.log(req.originalUrl);
		//return next(Errors.HttpStatusError(401, "Требуется авторизация")); //TODO
		return res.redirect('/login?back='+req.originalUrl);
	}
	next();
};