"use strict";
const Async = require('async');
//const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const Json = require('./menu.js');

/*console.log('JsonMenu');
console.log(Json.menu());
console.log('----');*/

let m = Json.menu();

module.exports = function siteMenu(Classes)
{
	return function(req, res, next)
	{
		res.locals.menuSite = [];
		res.locals.menuItem = null;

/*
		console.log("req.method %s", req.method);
		console.log("req.baseUrl %s", req.baseUrl);
		console.log("req.originalUrl %s", req.originalUrl);
		console.log("req.path %s", req.path);
*/

		//TODO ???
		//if(req.xhr) return next();

		menu(Classes, req, function(err, menuData)
		{
			if (err) return next(err);
			
			res.locals.menuSite = menuData.menuList;
			res.locals.menuItem = menuData.menuItem;
			
			if(!menuData.menuItem)
			{
				/*console.log('in %s', __dirname);
				console.log('');
				console.log('menuData.menuItem');
				console.log(menuData.menuItem);
				console.log('---');
				console.log("req.method %s", req.method);
				 console.log("req.baseUrl %s", req.baseUrl);
				 console.log("req.originalUrl %s", req.originalUrl);
				 console.log("req.path %s", req.path);
				*/

				return next(new Errors.HttpError(404));
			}

			return next();
		});
	}
};

//function menu(Classes, req, res, cb)
function menu(Classes, req, cb)
{
	let path = req.path.split('/');

	/*console.log("path = ", path);

	path.forEach(function(item, i)
	{
		if (item == '') path.splice(i, 1);
	});*/

	let is_admin_menu = (path[1] && path[1].toLowerCase() == 'admin' ? 1 : 0);

	let menuData = {};
	menuData.menuList = [];
	menuData.menuItem = null;
	
	/*console.log("req.method %s", req.method);
	console.log("req.baseUrl %s", req.baseUrl);
	console.log("req.originalUrl %s", req.originalUrl);
	console.log("req.path %s", req.path);*/
	
	Async.waterfall(
		[
			function (aCb)
			{
				if(req.xhr)
					return aCb(null, menuData);
				
				Classes.model("menu").getAll(is_admin_menu, false, function(err, menuList)
				{
					if (err) return aCb(err, menuData);
					
					menuData.menuList = menuList || [];
					return aCb(null, menuData);
				});
			},
			function(menuData, aCb)
			{
				let res_path = [];
				let req_path = req.path.split('/');
				
				for (let p in req_path)
				{
					if (req_path[p] == '') req_path.splice(p, 1);
				}
				
				let cnt = req_path.length;
				
				for (let p in req_path)
				{
					res_path.push('/'+(req_path.slice( 0, cnt)).join('/'));
					cnt--;
				}
				
				for (let p in res_path)
				{
					if (m[res_path[p]])
					{
						menuData.menuItem = m[res_path[p]];
						return aCb(null, menuData);
					}
				}
				
				//если там нет, смотрим тут
				Classes.model("menu").getByPath(req.path, is_admin_menu, function(err, menuItem)
				{
					if (err)
						return aCb(err, menuData);
					
					menuData.menuItem = menuItem;
					return aCb(null, menuData);
				});
			}
		],
		function(err, menuData)
		{
			if(err) return cb(err, menuData);
			
			return cb(null, menuData);
		}
	);
}