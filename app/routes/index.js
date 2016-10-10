"use strict";
const Logger = require('app/lib/logger');
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
		//let start = new Date();

		let cName = (res.locals.menuItem.c_path[0] == '/') ? res.locals.menuItem.c_path.substr(1) : res.locals.menuItem.c_path;
		console.log('cName = ' + cName);

		let C = new (Control.get(cName))(req, res, Classes);

		C.callAction()
			.then(function (json)
			{
				return C.view.render(json)
					.then(function ()
					{
						C = null;

						//let end = new Date();
						//console.log("response time: ", end.getTime() - start.getTime() + " ms");
					});
			})
			.catch(function (err)
			{
				Logger.error(err);
				C = null;
				return next(err);
			});
	});

	return router;
};