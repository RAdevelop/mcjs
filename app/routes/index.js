"use strict";
//const Logger = require('app/lib/logger');
const express = require('express');
const router = express.Router();
//const Errors = require('app/lib/errors');

let Controllers = new WeakMap();

//let startDate = new Date();
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

	//router.use(require('app/middlewares/_reqbody'));
	router.use(require('app/middlewares/user/load.js')(Classes));
	
	router.use(require('app/middlewares/menu/site.js')(Classes));

	
	router.use('/chat', require('app/routes/chat'));
	
	/*****************************************************/
	
	//GET home page.
	
	//именно после верхних роутеров, которых нет в меню (в БД)
	router.all('*', function(req, res, next)
	{
		let cName = (res.locals.menuItem.c_path[0] == '/') ? res.locals.menuItem.c_path.substr(1) : res.locals.menuItem.c_path;
		console.log('cName = ' + cName);
		//let C = new (Control.get(cName))(req, res, Classes);

		let cn = {[cName]:cName};
		if (!Controllers.has(cn))
			Controllers.set(cn, new (Control.get(cName))(req, res, Classes) );

		Controllers.get(cn)
			.callAction()
			.then((json) =>
			{
				return Controllers.get(cn).view.render(json)
					.then(() =>
					{
						//console.log('\n-----------RA 6');
						calcTimeForGC();
						//так как Controllers это WeakMap то пока закомментим
						//Controllers.get(cn) = null;
						//cn = null;

						//console.log("response time: ", end.getTime() - startDate.getTime() + " ms");
					});
			})
			.catch((err) =>
			{
				//Logger.error(err);
				//так как Controllers это WeakMap то пока закомментим = null
				//C = null;
				//cn = null;
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
/*

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
}*/
