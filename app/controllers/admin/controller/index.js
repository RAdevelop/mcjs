"use strict";
const _ = require('lodash');
const Async = require('async');
const Errors = require('app/lib/errors');
const ValidatorJs = require('validatorjs');
ValidatorJs.useLang('ru');

const Template = require('app/lib/template');
const Models = require('app/models');

function defaultData(){
	var tplData = {
		controllerId: "", controllerPid:"0", controllerPath:'', controllerName: '', controllerDesc: '',
		controllerList: [], methodsList: [],
		cAfterId: 0,
		h1: 'Router start page',
		s_rm_method: ""
	};
	
	tplData.formError = {
		message: '',
		error: false,
		fields: {
			controllerPid: null,
			controllerPath: null,
			controllerName: null,
			controllerDesc: null
		}
	};
	return tplData;
}

/*console.log(req.originalUrl); // '/admin/new'
console.log(req.baseUrl); // '/admin'
console.log(req.path); // '/new'*/

/**
 * путь к файлу шаблона
 * @type {string}
 */
var tplFile = 'admin/controller/index.ejs';

/**
 * показываем стартовую страницу для Роутеров
 *
 * @param req
 * @param res
 * @param next
 */
exports.main = function(req, res, next) 
{
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Router start page';
	
	Async.waterfall(
		[function(asyncCb) //список роутеров
		{
			Models.get("Router").getAll(function(err, controllerList)
			{
				if(err) return asyncCb(err, tplData);
				
				tplData.controllerList = controllerList;
				asyncCb(null, tplData);
			});
		}], 
		function(err, tplData)
		{
			//Models.end();
			if(err) return next(err);
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		}
	);
};
/**
 * добавляем роутер
 *
 * @param req
 * @param res
 * @param next
 */
exports.add = function(req, res, next) 
{
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Router start page';
	tplData = _.assign(tplData, req.body);
	
	Async.waterfall(
	[
		function(asyncCb) //валидация формы
		{
			controllerFormValidation(tplData, function(err, tplData)
			{
				if(err)
				{
					Models.get("Router").getAll(function(err2, controllerList)
					{
						if(err2) return asyncCb(err2, controllerList);
						
						tplData.controllerList = controllerList;
						
						return asyncCb(err, controllerList);
					});
				}
				else 
				return asyncCb(null, tplData);
			});
		},
		function(tplData, asyncCb) //добавление в БД
		{
			Models.get("Router").add(tplData.controllerPid, tplData.cAfterId, tplData.controllerPath, tplData.controllerName, tplData.controllerDesc, function(err, rId)
			{
				if(err)
				{
					Models.get("Router").getAll(function(err2, controllerList)
					{
						if(err2) return asyncCb(err2, tplData);
						
						tplData.controllerList = controllerList;
						
						return asyncCb(err, tplData);
					});
				}
				else
				return asyncCb(null, rId);
			});
		}
	], function (err, rId)
	{
		//Models.end();
		//tplData.formError = false;
		/*
		 нужно проверять тип шибки. в зависимости от типа ошибки,
		 принимать решение,вызывать ли next(err) или обработать ситуацию
		 */
		
		if(err)
		{
			tplData.formError.error = true;
			tplData.formError.message = err.message;
			
			switch (err.name)
			{
				default:
					return  next(err);
					break;
				
				case 'ValidationError':
					
					for(var i in err.errors)
						tplData.formError.fields[err.errors[i].field] = err.errors[i].message;
					break;
				
				case 'DbErrDuplicateEntry':
					
					tplData.formError.message = "Роутер с таким путем уже есть!";
					break;
			}
		}
		else if (rId)
		return res.redirect(req.baseUrl+'/'+rId+'/edit');
		
		//экспрот данных в JS на клиента
		res.expose(tplData.controllerList, 'controllerList');
		
		var View = new Template(req, res, next, Models);
		View.render(tplFile, tplData);
	});
};

/**
 * показываем страницу для Роутера по его id
 *
 * @param req
 * @param res
 * @param next
 */
exports.edit = function(req, res, next)
{	
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Router start page';
	
	var rId = parseInt(req.params.id, 10);
	if(!rId || rId <= 0) return next(Errors.HttpStatusError(404, "Роутер не найден"));
	
	var parallelTasks = [
		function(cb){
			setTimeout(function()
			{
				Models.get("Router").getById(rId, function(err, rData)
				{
					if(err) return cb(err);
					
					if(!rData) return cb(Errors.HttpStatusError(404, "Роутер не найден"));
					
					tplData.controllerId = rData["c_id"];
					tplData.controllerPid = rData["c_pid"];
					tplData.controllerPath = rData["c_path"];
					tplData.controllerName = rData["c_name"];
					tplData.controllerDesc = rData["c_desc"];
					
					return cb(null, tplData);
				});
			}, 1);
		},
		function(cb){
			setTimeout(function(){
				Models.get("Router").getAll(function(err, controllerList)
				{
					if(err) return cb(err, tplData);
					
					cb(null, controllerList);
				});
			}, 1);
		},
		function(cb){
			setTimeout(function(){
				Models.get("Router").getAllMethods(rId, function(err, mList)
				{
					if(err) return cb(err, mList);
					
					return cb(null, mList);
				});
			}, 1);
		}
	];
	
	Async.parallel(parallelTasks,
		function(err, results)
		{
			//Models.end();
			if(err) return next(err);
			
			tplData = results[0] || tplData;
			tplData.controllerList = results[1] || [];
			tplData.methodsList = results[2] || [];
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			res.expose(tplData.methodsList, 'methodsList');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		}
	);
};
/**
 * обновляем данные для Роутера по его id
 *
 * @param req
 * @param res
 * @param next
 */
exports.update = function(req, res, next)
{	
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Router start page';
	tplData = _.assign(tplData, req.body);
	
	tplData.controllerId = parseInt(tplData.controllerId, 10);
	if(!tplData.controllerId || tplData.controllerId <= 0) return next(new Errors.HttpStatusError(404, "Роутер не найден"));
	
	Async.waterfall(
		[
			function(asyncCb) //валидация формы
			{
				controllerFormValidation(tplData, function(err, tplData)
				{
					if(err)
					{
						Models.get("Router").getAll(function(err2, controllerList)
						{
							if(err2) return asyncCb(err2, tplData);
							
							tplData.controllerList = controllerList;
							
							return asyncCb(err, tplData);
						});
					}
					else
						return asyncCb(err, tplData);
					
				});
			},
			function(tplData, asyncCb) //
			{
				Models.get("Router").getById(tplData.controllerId, function(err, rData)
				{
					if(err) return asyncCb(err, null);
					return asyncCb(null, tplData);
				});
			},
			function(tplData, asyncCb)
			{
				Models.get("Router").updById(tplData.controllerId, tplData.controllerPid, tplData.cAfterId, tplData.controllerPath, tplData.controllerName, tplData.controllerDesc, function(err, rId)
				{
					if(err)
					{
						Models.get("Router").getAll(function(err2, controllerList)
						{
							if(err2) return asyncCb(err2, tplData);
							
							tplData.controllerList = controllerList;
							
							return asyncCb(err, tplData);
						});
					}
					else
					return asyncCb(err, tplData);
				});
			}
		],
		function (err, tplData)
		{
			//Models.end();
			//console.log(err);
			/*
			 нужно проверять тип шибки. в зависимости от типа ошибки,
			 принимать решение,вызывать ли next(err) или обработать ситуацию
			 */
			if(err)
			{
				tplData.formError.error = true;
				tplData.formError.message = err.message;
				switch (err.name)
				{
					default:
						return  next(err);
					break;
					
					case 'ValidationError':
						
						for(var i in err.errors)
							tplData.formError.fields[err.errors[i].field] = err.errors[i].message;
					break;
					
					case 'DbErrDuplicateEntry':
						tplData.formError.message = "Роутер с таким путем уже есть!";
					break;
				}
			}
			else if (tplData)
			return res.redirect(req.baseUrl+'/'+tplData.controllerId+'/edit');
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		}
	);
};

/**
 * добавляем метод к рутеру (ajax)
 * @param req
 * @param res
 * @param next
 */
exports.addMethod = function(req, res, next)
{
	var tplData = _.assign({}, req.body);
	//req._reqbody;
	tplData.methodsList = [];
	
	tplData.formError = {
		message: '',
		error: false,
		fields: {
			i_controller_id: null,
			s_rm_method: null
		}
	};
	
	Async.waterfall(
		[
			function(asyncCb) //провека формы
			{
				var formErrs = {};
				
				if (!req._reqbody["i_controller_id"])
					formErrs["i_controller_id"] = "Не указан роутер";
				else
					tplData.controllerId = tplData["i_controller_id"];
				
				if (!req._reqbody["s_rm_method"] || !(tplData["s_rm_method"].search(/^[a-zA-Z][a-zA-Z_]{2,33}$/ig) != -1))
					formErrs["s_rm_method"] = "Не указан метод";
				
				var kErr = Object.keys(formErrs);
				if (kErr.length > 0)
				{
					tplData.formError.error = true;
					tplData.formError.message = "Ошибка заполнения формы";
					
					kErr.forEach(function(e, i){
						tplData.formError.fields[e] = formErrs[e];
					});
					
					return asyncCb(new Errors.ValidationError(tplData.formError.message), tplData);
				}
				
				return asyncCb(null, tplData);
			},
			function(tplData, asyncCb) //добавим метод
			{
				Models.get("Router").addMethod(tplData.i_controller_id, tplData.s_rm_method, function(err, rmId)
				{
					
					tplData.rmId = null;
					
					if (err) return asyncCb(err, tplData);
					
					tplData.rmId = rmId;
					return asyncCb(null, tplData);
				});
			}
		],
		function(err, tplData)
		{
			//Models.end();
			//console.log(err);
			if(err)
			{
				tplData.formError.error = true;
				
				switch (err.name)
				{
					default:
						tplData.formError.message = "Ошибка заполнения формы. Попробуйте позже";
						break;
					
					case 'DbErrDuplicateEntry':
						tplData.formError.message = "Такой метод уже есть у роутера.";
						break;
					case 'ValidationError':
						
						break;
				}
			}
			
			var View = new Template(req, res, next, Models);
			View.render('admin/controller/methods.ejs', tplData);
		}
	);
};

/**
 * удаляем (отвязываем) метод от рутера (AJAX)
 * @param req
 * @param res
 * @param next
 */
exports.delMethod = function(req, res, next)
{
	var tplData = _.assign({}, req.body);
	
	tplData.formError = {
		message: '',
		error: false,
		fields: {
			i_controller_id: null,
			i_method_id: null
		}
	};
	
	var modelsEnd = false;
	
	Async.waterfall(
		[
			function(asyncCb) //провека формы
			{
				var formErrs = {};
				
				if (!req._reqbody["i_controller_id"])
					formErrs["i_controller_id"] = "Не указан роутер";
				
				if (!req._reqbody["i_method_id"])
					formErrs["i_method_id"] = "Не указан метод";
				
				var kErr = Object.keys(formErrs);
				if (kErr.length > 0)
				{
					tplData.formError.error = true;
					tplData.formError.message = "Ошибка заполнения формы";
					
					kErr.forEach(function(e, i){
						tplData.formError.fields[e] = formErrs[e];
					});
					
					return asyncCb(new Errors.ValidationError(tplData.formError.message), tplData);
				}
				
				return asyncCb(null, tplData);
			},
			function(tplData, asyncCb) //отвяжем метод от роутера
			{
				Models.get("Router").delMethod(tplData.i_controller_id, tplData.i_method_id, function(err, rmId)
				{
					if (err) return asyncCb(err, tplData);
					
					return asyncCb(null, tplData);
				});
			}
		],
		function(err, tplData)
		{
			//Models.end();
		
			if(err)
			{
				tplData.formError.error = true;
				
				switch (err.name)
				{
					default:
						tplData.formError.message = "Ошибка заполнения формы. Попробуйте позже";
						break;
					
					case 'ValidationError':
						
						break;
				}
			}
			//var View = new Template(req, res, next, Models);
			//View.render('admin/controller/methods.ejs', tplData);
			
			res.json(tplData);
		}
	);  
};

//////////////////

function controllerFormValidation(tplData, cb)
{
	tplData.controllerPid = tplData.controllerPid.toLowerCase().trim();
	
	tplData.cAfterId = tplData.cAfterId.toLowerCase().trim();
	tplData.cAfterId = parseInt(tplData.cAfterId, 10);
	tplData.cAfterId = (tplData.cAfterId < 0 ? 0 : tplData.cAfterId);
	
	tplData.controllerPath = tplData.controllerPath.toLowerCase().trim().replace("\\", "/");
	
	tplData.controllerPath = tplData.controllerPath.split("/");
	
	if (tplData.controllerPath[tplData.controllerPath.length-1] == "")
	tplData.controllerPath.pop();
	
	tplData.controllerPath = tplData.controllerPath.join("/");
	
	tplData.controllerName = tplData.controllerName.trim();
	tplData.controllerDesc = tplData.controllerDesc.trim();
	
	var formFields = {
		controllerPid: tplData.controllerPid,
		cAfterId: tplData.cAfterId,
		controllerPath: tplData.controllerPath,
		controllerName: tplData.controllerName
	};
	
	var validRules = {
		controllerPid: 'required|numeric',
		controllerPath: ['required','regex:/^\/([0-9a-zA-Z_-]+\/?)+$/'],
		controllerName: 'required|min:3|max:100'
	};
	
	var validator = new ValidatorJs(formFields, validRules, {
		"required.controllerPid": "Родитель не указан",
		"numeric.controllerPid": "Родитель не указан",
				
		"required.controllerPath": "Путь указан не верно",
		"regex.controllerPath": "Путь указан не верно",
		
		"required.controllerName": "Название не верно указано",
		"min.controllerName": "Название указано не верно",
		"max.controllerName": "Название указано не верно",
	});

	
	/*
	 console.log(validator.passes());
	 console.log(validator.fails());
	 console.log(validator.errors.all());
	 */
	if(validator.fails())
	{
		var inputErrors = new Errors.ValidationError('Ошибка при заполнении фомры');
		
		if(validator.errors.has('controllerPid'))     inputErrors.addError(new Errors.ValidationError(validator.errors.first('controllerPid'),'', 'controllerPid'));
		if(validator.errors.has('controllerPath'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('controllerPath'),'', 'controllerPath'));
		if(validator.errors.has('controllerName'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('controllerName'),'', 'controllerName'));
		
		return cb(inputErrors, tplData);
	}
	
	return cb(null, tplData);
}

/**
 * данные, которые хотим подгрузить (вызываетя в Async-методах)
 * @returns {*[]} - массив "задач" для Async-методов
 */
/*
function getDataTasks(rId)
{
	return [function(cb)
	{
		Models.get("Router").getAll(function(err, controllerList)
		{
			if(err) return asyncCb(err, tplData);
			tplData.controllerList = controllerList;
			
			asyncCb(null, tplData);
		});
	},
	function(cb)
	{
		Models.get("Router").getAllMethods(rId, function(err, mList)
		{
			if(err) return cb(err, mList);
			
			return cb(null, mList);
		});
	}];
};*/
