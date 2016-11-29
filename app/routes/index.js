"use strict";
const Logger = require('app/lib/logger');
const express = require('express');
const router = express.Router();
//const Errors = require('app/lib/errors');

const UserIsAuth = require('app/middlewares/user/auth.js');

let Controllers = new WeakMap();

let startDate = new Date();
let memoryUsage;
let tInterval = null;

module.exports = function(Classes, Control)
{
	/*
	 controller.use('/template/of/url', function (req, res, next) {
	 получаем данные...
	 если они есть call  next('route');
	 а если что-то пошло не так call next(err);
	 });
	
	 */

	router.use(require('app/middlewares/_reqbody'));
	router.use(require('app/middlewares/user/load.js')(Classes));

	//сработает для всех адресов site.com/admin*
	router.use('/admin*', UserIsAuth);

	router.use(require('app/middlewares/menu/site.js')(Classes));

	
	router.use('/chat', require('app/routes/chat'));
	
	/*****************************************************/
	
	//GET home page.
	
	//именно после верхних роутеров, которых нет в меню (в БД)
	//TODO наверное после '*', добавить миддле варе для проверки прав юзера у текущего пункта меню
	//а возможно лучше добавить в класс /app/lib/controller/index.js
	//и проверять по имени метода разрешенного.. get_edit post_edit post_add get_index ...
	//и если права есть, то права на владение редактируемого объекта проверять в контроллере
	//например, редактировать фотоальбом может только его владелец u_id
	router.all('*', function(req, res, next)
	{

		let cName = (res.locals.menuItem.c_path[0] == '/') ? res.locals.menuItem.c_path.substr(1) : res.locals.menuItem.c_path;
		console.log('cName = ' + cName);
		//let C = new (Control.get(cName))(req, res, Classes);

		let cn = {[cName]:cName};
		if (!Controllers.has(cn))
		{
			Controllers.set(cn, new (Control.get(cName))(req, res, Classes) );
		}

		Controllers.get(cn).callAction()
			.then(function (json)
			{
				return Controllers.get(cn).view.render(json)
					.then(function ()
					{
						calcTimeForGC();
						//Controllers.get(cn) = null;  //так как Controllers это WeakMap то пока закомментим = null

						//console.log("response time: ", end.getTime() - startDate.getTime() + " ms");
					});
			})
			.catch(function (err)
			{
				Logger.error(err);
				//C = null; //так как Controllers это WeakMap то пока закомментим = null
				return next(err);
			});
	});

	return router;
};

tInterval = setInterval(function ()
{
	memoryUsage = process.memoryUsage();
	if (global.gc && memoryUsage['rss']/ 1000000 > 100)
	{
		global.gc();
		//console.log("\n------------------------");
		//console.log("\ncalcTimeForGC");
		//console.log("\n------------------------");
	}
}, 60000);
function calcTimeForGC()
{
	if (!global.gc || (memoryUsage && ['rss'] && memoryUsage['rss']/ 1000000 <= 100))
	{
		clearInterval(tInterval);
		tInterval = null;
	}
}

function v1_calcTimeForGC()
{
	let endDate = new Date();

	//--optimize_for_size --max_old_space_size=460 --nouse-idle-notification --expose-gc --gc_interval=100
	let time = (endDate.getTime() - startDate.getTime()) / 1000 / 60;
	time = Math.ceil(time);
	//console.log("\n------------------------ startDate = ", startDate);
	//console.log("\n------------------------ Math.ceil(time) = ", time);

	if ( time > 1)
	{
		startDate = endDate;

		if (global.gc)
		{
			let mem = process.memoryUsage();
			if(mem['rss']/ 1000000 > 100)
			{
				global.gc();
				console.log("\n------------------------");
				console.log("\ncalcTimeForGC");
				console.log("\n------------------------");
			}
		}
	}
}