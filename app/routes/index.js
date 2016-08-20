"use strict";
const express = require('express');
const router = express.Router();
//const Errors = require('app/lib/errors');

const UserIsAuth = require('app/middlewares/user/auth.js');

module.exports = function(Classes, Control)
{
	/*
	 controller.use('/template/of/url', function (req, res, next) {
	 получаем данные...
	 если они есть call  next('route');
	 а если что-то пошло не так call next(err);
	 });
	
	 */
	
	//router.use(Classes.setReqRes());
	router.use(require('app/middlewares/_reqbody'));

	router.use(require('app/middlewares/user/load.js')(Classes));
	router.use(require('app/middlewares/menu/site.js')(Classes));
	
	router.use('/chat', require('app/routes/chat'));
	
	//сработает для всех адресов site.com/admin*
	router.use('/admin*', UserIsAuth);
	
	//router.use('/admin/menu', require('app/routes/admin/menu'));//TODO переписать на контроллеры
	router.use('/admin/controller', require('app/routes/admin/controller')); //TODO переписать на контроллеры
	
	/*****************************************************/
	
	//GET home page.
	
	//именно после верхних роутеров, которых нет в меню (в БД)
	
	router.all('*', function(req, res, next)
	{
		let cName = (res.locals.menuItem.c_path[0] == '/') ? res.locals.menuItem.c_path.substr(1) : res.locals.menuItem.c_path;
		console.log('cName = ' + cName);

		Classes.setReqRes();

		let C = new (Control.get(cName))(req, res, next, Classes);

		C.callAction(function(err, json = false)
		{
			if (err)
			{
				console.log('----- in router.all ----');
				console.log(__dirname);
				console.log(err);
				console.log('----- END in router.all ----');

				//C.view = null;
				C = null;
				return next(err);
			}

			C.view.render(json);
		});
	});

	
	return router;
};