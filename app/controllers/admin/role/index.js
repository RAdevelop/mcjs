/**
 * Created by RA on 28.02.2016.
 */
'use strict';
const _ = require('lodash');
const Async = require('async');
const Errors = require('app/lib/errors');

const Template = require('app/lib/template');
const Models = require('app/models');

function defaultData(res)
{
	var tplData = {
		i_rl_id: "", i_rl_pid:"0", i_rl_after_id:"0", s_rl_path:'', s_rl_name: '', t_rl_desc: '',
		roleList: [],
		title: res.app.settings.title,
		h1: 'Редактирование роли пользователей'
	};
	
	tplData.formError = {
		message: '',
		error: false,
		fields: {
			i_rl_id: null,
			i_rl_pid: null,
			i_rl_after_id: null,
			s_rl_path: null,
			s_rl_name: null,
			t_rl_desc: null
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
var tplFile = 'admin/role/index.ejs';

/**
 * GET запрос. стартовая страница по работе с ролями
 * 
 * @param req
 * @param res
 * @param next
 */
exports.main = function(req, res, next)
{
	var tplData = defaultData(res);
	tplData.title += ' | Role start page';
	
	Async.waterfall([
		function(asyncCb)
		{
			Models.get("Role").getAll(function(err, roleList)
			{
				if (err) return asyncCb(err, tplData);
				
				tplData.roleList = roleList;
				asyncCb(null, tplData);
			});
		}
	]
		, function(err, tplData)
		{
			//Models.end();
			if(err) return next(err);
			
			//экспрот данных в JS на клиента
			res.expose(tplData.roleList, 'roleList');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);	
		}
	);
};

/**
 * POST  запрос. добавляем роль
 * 
 * @param req
 * @param res
 * @param next
 */
exports.add = function(req, res, next)
{
	var tplData = defaultData(res);
	tplData.title += ' | Role start page';
	tplData = _.assign(tplData, req.body);
	
	Async.waterfall(
		[
			function(asyncCb) //валидация формы
			{
				roleFormValidation(req, tplData, function(err, tplData)
				{
					if(err)
					{
						Models.get("Role").getAll(function(err2, roleList){
							if(err2) return asyncCb(err2, tplData);
							
							tplData.roleList = roleList;
							
							return asyncCb(err, tplData);
						});
					}
					else
						return asyncCb(null, tplData);
				});
			},
			function(tplData, asyncCb) //добавление в БД
			{
				Models.get("Role").add(tplData.i_rl_pid, tplData.i_rl_after_id, tplData.s_rl_path, tplData.s_rl_name, tplData.t_rl_desc, function(err, i_rl_id)
				{
					if(err)
					{
						Models.get("Role").getAll(function(err2, roleList){
							if(err2) return asyncCb(err2, tplData);
							
							tplData.roleList = roleList;
							
							return asyncCb(err, tplData);
						});
					}
					else 
					{
						tplData.i_rl_id = i_rl_id;
						return asyncCb(null, tplData);
					}
				});
			}
		], function (err, tplData)
		{
			//Models.end();
			//tplData.formError = false;
			/*
			 нужно проверять тип шибки. в зависимости от типа ошибки,
			 принимать решение,вызывать ли next(err) или обработать ситуацию
			 */
			
			if(err)
			{
				switch (err.name)
				{
					default:
						return  next(err);
						break;
					
					case 'ValidationError':
						// покажем ошибки
						break;
					
					case 'DbErrDuplicateEntry':
						tplData.formError.error = true;
						tplData.formError.message = "Роль с таким альясом или именем уже есть!";
						break;
				}
			}
			else if (tplData.i_rl_id)
				return res.redirect(req.baseUrl+'/'+tplData.i_rl_id+'/edit');
			
			//экспрот данных в JS на клиента
			res.expose(tplData.roleList, 'roleList');
			res.expose(tplData.formError, 'formError');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		});
};

/**
 * GET запрос показываем страницу редактирования  роли
 * 
 * @param req
 * @param res
 * @param next
 */
exports.edit = function(req, res, next)
{
	var tplData = defaultData(res);
	tplData.title += ' | Role start page';
	
	
	//экспрот данных в JS на клиента
	res.expose(tplData.roleList, 'roleList');
	
	var View = new Template(req, res, next, Models);
	View.render(tplFile, tplData);
};

/**
 * POST запрос обновления данных роли
 * 
 * @param req
 * @param res
 * @param next
 */
exports.update = function(req, res, next)
{
	var tplData = defaultData(res);
	tplData.title += ' | Role start page';
	
	
	//экспрот данных в JS на клиента
	res.expose(tplData.roleList, 'roleList');
	
	var View = new Template(req, res, next, Models);
	View.render(tplFile, tplData);
};

/**
 * валидация формы редактирования роли
 * @param req
 * @param tplData
 * @param cb
 * @returns {*}
 */
function roleFormValidation(req, tplData, cb)
{
	var errors = {};
	
	if (req._reqbody["i_rl_pid"] == null)
	errors["i_rl_pid"] = "не верно указан родитель";
	
	if (req._reqbody["i_rl_after_id"] == null)
	tplData.i_rl_after_id = 0;
	
	tplData.s_rl_path = tplData.s_rl_path.replace('|//+|', '/');
	
	if (!(tplData.s_rl_path.search(/^[a-zA-Z][0-9a-zA-Z_\-\/]{3,254}$/ig) != -1))
	errors["s_rl_path"] = "Не указан альяс";
	else
		tplData.s_rl_path = tplData.s_rl_path.toLowerCase();
	
	if (tplData.s_rl_name == '')
	errors["s_rl_name"] = "Не указано название роли";
	
	if (tplData.t_rl_desc == '')
	errors["t_rl_desc"] = "Не указано описание роли";
	
	var errKeys = Object.keys(errors);
	
	if (!errKeys.length)
	return cb(null, tplData);
	
	tplData.formError.message = 'Ошибки при заполнении формы';
	tplData.formError.error = true;
	
	errKeys.forEach(function(e, i){
		tplData.formError.fields[e] = errors[e];
	});
	
	return cb(new Errors.ValidationError(tplData.formError.message), tplData);
}