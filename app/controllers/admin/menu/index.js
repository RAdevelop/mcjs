"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

//const Async = require('async');
const Base = require('app/lib/controller');

class Menu extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': null,
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_menu_id']
			}
		}
	}

	indexActionGet()
	{
		let tplFile = 'admin/menu/index.ejs';

		let tplData = {
			menuId: "", menuPid:"0", menuAfterId:"0", menuPath:'', menuName: '', menuTitle: '', menuH1: '', menuDesc: '',
			menuControllerId: null,
			menuControllerPath: '',
			menuList: [],
			controllerList: []
		};

		return Promise.props({
			menuList: this.getClass("menu").getAll(),
			controllerList: this.getClass("controller").getAll()
		})
			.bind(this)
			.then(function(props)
			{
				tplData['menuList'] = props.menuList || [];
				tplData['controllerList'] = props.controllerList || [];

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.controllerList, 'controllerList');
				this.getRes().expose(tplData.menuList, 'menuList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	* показываем страницу для меню по его id
	*
	* @param req
	* @param res
	* @param next
	*/
	editActionGet()
	{
		let tplFile = 'admin/menu/index.ejs';
		
		const self = this;
		
		let tplData = {
			menuId: "", menuPid:"0", menuAfterId:"0", menuPath:'', menuName: '', menuTitle: '', menuH1: '', menuDesc: '',
			menuControllerId: null,
			menuControllerPath: '',
			menuList: [],
			controllerList: []
		};

		let {i_menu_id=null} = this.routeArgs;

		if(!i_menu_id || i_menu_id <= 0)
			throw new Errors.HttpError(404);

		return this.getClass("menu").getById(i_menu_id)
			.bind(this)
			.then(function (mData)
			{
				if (!mData)
					throw new Errors.HttpError(404);

				tplData.menuId = mData["m_id"];
				tplData.menuPid = mData["m_pid"];
				tplData.menuPath = mData["m_path"];
				tplData.menuName = mData["m_name"];
				tplData.menuTitle = mData["m_title"];
				tplData.menuH1 = mData["m_h1"];
				tplData.menuDesc = mData["m_desc"];
				tplData.menuControllerId = mData["c_id"];
				tplData.menuControllerPath = mData["c_path"];

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return Promise.props({
					menuList: this.getClass("menu").getAll(),
					controllerList: this.getClass("controller").getAll()
				})
				.then(function(props)
				{
					tplData.menuList = props.menuList || [];
					tplData.controllerList = props.controllerList || [];

					return Promise.resolve(tplData);
				});
			})
			.then(function (tplData)
			{
				//экспрот данных в JS на клиента
				self.getRes().expose(tplData.controllerList, 'controllerList');
				self.getRes().expose(tplData.menuList, 'menuList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	editActionPost()
	{
		let tplData = this.getParsedBody();
		let btn_save_menu = tplData["btn_save_menu"] || null;
		
		switch (btn_save_menu)
		{
			default:

				if (!tplData["i_menu_id"])
					throw new Errors.HttpError(404);

				return this.getClass('menu').getById(tplData["i_menu_id"])
					.bind(this)
					.then(function (menu)
					{
						if (!menu)
							throw new Errors.HttpError(404);

						switch (btn_save_menu)
						{
							default:
								throw new Errors.HttpError(400);
								break;

							case 'update':
								return this.update(tplData);
								break;
						}
					});
				break;

			case 'add':
				return this.add(tplData);
				break;
		}
	}

	/**
	 * добавляем новый контроллер в БД
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	add(tplData)
	{
		let tplFile = 'admin/controller/index.ejs';



		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};

				tplData = this.stripTags(tplData, ["s_menu_path", "s_menu_name", "s_menu_title", "s_menu_h1", "t_menu_desc"]);

				tplData["i_menu_pid"] = parseInt(tplData["i_menu_pid"], 10) || 0;
				tplData["i_menu_after_id"] = parseInt(tplData["i_menu_after_id"], 10) || 0;
				tplData["i_menu_controller_id"] = parseInt(tplData["i_menu_controller_id"], 10) || 0;

				if (!tplData["s_menu_path"])
					errors["s_menu_path"] = "Укажите URL меню";

				if (!tplData["s_menu_name"])
					errors["s_menu_name"] = "Укажите Название меню";

				if (!tplData["s_menu_title"])
					errors["s_menu_title"] = "Укажите Заголовок страниц";

				if (!tplData["s_menu_h1"])
					errors["s_menu_h1"] = "Укажите H1 страниц";

				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('menu').add(tplData["i_menu_pid"], tplData["i_menu_after_id"], tplData["s_menu_path"], tplData["s_menu_name"], tplData["s_menu_title"], tplData["s_menu_h1"], tplData["t_menu_desc"], tplData["i_menu_controller_id"])
					.then(function (menuId)
					{
						tplData['menuId'] = menuId;
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.AlreadyInUseError, Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				if (err.name == 'AlreadyInUseError')
				{
					tplData.formError.message = 'Такой пункт меню уже существует';
					tplData.formError.fields['s_menu_path'] = "Укажите URL меню";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;

					err['data'] = tplData;
					//console.log(err);
				}

				this.view.setTplData(tplFile, err['data']);
				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * редактируем пункт меню
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	update(tplData)
	{
		let tplFile = 'admin/menu/index.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};

				tplData = this.stripTags(tplData, ["s_menu_path", "s_menu_name", "s_menu_title", "s_menu_h1", "t_menu_desc"]);

				tplData["i_menu_pid"] = parseInt(tplData["i_menu_pid"], 10) || 0;
				tplData["i_menu_after_id"] = parseInt(tplData["i_menu_after_id"], 10) || 0;
				tplData["i_menu_controller_id"] = parseInt(tplData["i_menu_controller_id"], 10) || 0;

				if (!tplData["s_menu_path"])
					errors["s_menu_path"] = "Укажите URL меню";

				if (!tplData["s_menu_name"])
					errors["s_menu_name"] = "Укажите Название меню";

				if (!tplData["s_menu_title"])
					errors["s_menu_title"] = "Укажите Заголовок страниц";

				if (!tplData["s_menu_h1"])
					errors["s_menu_h1"] = "Укажите H1 страниц";

				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('menu').updById(tplData["i_menu_id"], tplData["i_menu_pid"], tplData["i_menu_after_id"], tplData["s_menu_path"], tplData["s_menu_name"], tplData["s_menu_title"], tplData["s_menu_h1"], tplData["t_menu_desc"], tplData["i_menu_controller_id"]);
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err['data']);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Menu;

/*
"use strict";
const _ = require('lodash');
const Async = require('async');
const Errors = require('app/lib/errors');
const ValidatorJs = require('validatorjs');
ValidatorJs.useLang('ru');

//var User = require('app/models/user/index.js');
const Template = require('app/lib/template');
const Models = require('app/models');

function defaultData()
{
	var tplData = {
		menuId: "", menuPid:"0", menuAfterId:"0", menuPath:'', menuName: '', menuTitle: '', menuH1: '', menuDesc: '',
		menuControllerId: null,
		menuControllerPath: '',
		menuList: [],
		controllerList: [],
		h1: 'Редактирование меню сайта'
	};
	
	tplData.formError = {
		message: '',
		error: false,
		fields: {
			menuPid: null,
			menuAfterId: null,
			menuPath: null,
			menuName: null,
			menuTitle: null, 
			menuH1: null,
			menuDesc: null
		}
	};
	return tplData;
}

/!*console.log(req.originalUrl); // '/admin/new'
 console.log(req.baseUrl); // '/admin'
 console.log(req.path); // '/new'*!/

/!**
 * путь к файлу шаблона
 * @type {string}
 *!/
var tplFile = 'admin/menu/index.ejs';

/!**
 * показываем стартовую страницу
 *
 * @param req
 * @param res
 * @param next
 *!/
exports.main = function(req, res, next)
{
	Async.parallel(
		getDataTasks(),
	function(err, results)
	{
		//Models.end();
		if(err) return next(err);
		
		var tplData = defaultData();
		tplData.title = res.app.settings.title + ' | Menu start page';
		
		tplData.menuList = results[0] || [];
		tplData.controllerList = results[1] || [];
		
		//экспрот данных в JS на клиента
		res.expose(tplData.controllerList, 'controllerList');
		res.expose(tplData.menuList, 'menuList');
		
		var View = new Template(req, res, next, Models);
		View.render(tplFile, tplData);
	});
};
/!**
 * добавляем меню
 *
 * @param req
 * @param res
 * @param next
 *!/
exports.add = function(req, res, next)
{
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Menu start page';
	tplData = _.assign(tplData, req.body);
	
	Async.waterfall(
		[
			function(asyncCb) //валидация формы
			{
				menuFormValidation(tplData, function(err, tplData)
				{
					if(err)
					{
						getAdditionData(tplData, function(err2, tplData)
						{
							if(err2) return asyncCb(err2, tplData);
							
							return asyncCb(err, tplData);
						});
					}
					else
						return asyncCb(null, tplData);
				});
			},
			function(tplData, asyncCb) //добавление в БД
			{
				Models.get("Menu").add(tplData.menuPid, tplData.menuAfterId, tplData.menuPath, tplData.menuName, tplData.menuTitle, tplData.menuH1, tplData.menuDesc, tplData.menuControllerId, function(err, mId)
				{
					if(err) return getAdditionData(tplData, function(err2, tplData){
						
						if(err2) return asyncCb(err2, null);
						else return asyncCb(err, null);
					});
					
					return asyncCb(null, mId);
				});
			}
		], function (err, mId)
		{
			//Models.end();
			//tplData.formError = false;
			/!*
			 нужно проверять тип шибки. в зависимости от типа ошибки,
			 принимать решение,вызывать ли next(err) или обработать ситуацию
			 *!/
			
			if(err)
			{
				switch (err.name)
				{
					default:
						return  next(err);
						break;
					
					case 'ValidationError':
						tplData.formError.error = true;
						tplData.formError.message = err.message;
						break;
					
					case 'DbErrDuplicateEntry':
						tplData.formError.error = true;
						tplData.formError.message = "Меню с таким url или именем уже есть!";
						break;
				}
			}
			else if (mId)
				return res.redirect(req.baseUrl+'/'+mId+'/edit');
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			res.expose(tplData.menuList, 'menuList');
			res.expose(tplData.formError, 'formError');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		});
};

/!**
 * показываем страницу для меню по его id
 *
 * @param req
 * @param res
 * @param next
 *!/
exports.edit = function(req, res, next)
{
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Menu start page';
	
	var rId = parseInt(req.params.id, 10);
	if(!rId || rId <= 0) return next(Errors.HttpStatusError(404, "Пункт меню не найден"));
	
	var parallelTasks = [
		function(cb){
			setTimeout(function(){
				
				Models.get("Menu").getById(rId, function(err, mData)
				{
					if(err) return cb(err);
					if(!mData) return cb(new Errors.HttpStatusError(404, "Пункт меню не найден"));
					
					tplData.menuId = mData["m_id"];
					tplData.menuPid = mData["m_pid"];
					tplData.menuPath = mData["m_path"];
					tplData.menuName = mData["m_name"];
					tplData.menuTitle = mData["m_title"];
					tplData.menuH1 = mData["m_h1"];
					tplData.menuDesc = mData["m_desc"];
					tplData.menuControllerId = mData["c_id"];
					tplData.menuControllerPath = mData["c_path"];
					
					return cb(null, tplData);
				});
				
				
			}, 1);
		},
		function(cb){
			setTimeout(function(){
				Models.get("Menu").getAll(function(err, menuList)
				{
					if(err) return cb(err, menuList);
					
					return cb(null, menuList);
				});
			}, 1);
		},
		function(cb){
			setTimeout(function(){
				Models.get("controller").getAll(function(err, controllerList)
				{
					if(err) return cb(err, controllerList);
					
					return cb(null, controllerList);
				});
			}, 1);
		}
	];
	
	Async.parallel(parallelTasks,
		function(err, results)
		{
			//console.log(results);
			
			//Models.end();
			if(err) return next(err);
			
			tplData.menuList = results[1] || [];
			tplData.controllerList = results[2] || [];
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			res.expose(tplData.menuList, 'menuList');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		}
	);
};
/!**
 * обновляем данные для Роутера по его id
 *
 * @param req
 * @param res
 * @param next
 *!/
exports.update = function(req, res, next)
{
	var tplData = defaultData();
	tplData.title = res.app.settings.title + ' | Menu start page';
	tplData = _.assign(tplData, req.body);
	
	tplData.menuId = parseInt(tplData.menuId, 10);
	if(!tplData.menuId || tplData.menuId <= 0) return next(Errors.HttpStatusError(404, "Пункт меню не найден"));
	
	Async.waterfall(
		[
			function(asyncCb) //валидация формы
			{
				menuFormValidation(tplData, function(err, tplData)
				{
					if(err)
					{
						getAdditionData(tplData, function(err2, tplData)
						{
							if(err2) return asyncCb(err2, tplData);
							
							return asyncCb(err, tplData);
						});
					}
					else
					return asyncCb(null, tplData);
				});
			},
			function(tplData, asyncCb) //
			{
				Models.get("Menu").getById(tplData.menuId, function(err, mData)
				{
					if(err) return asyncCb(err, null);
					return asyncCb(null, tplData);
				});
			},
			function(tplData, asyncCb)
			{
				Models.get("Menu").updById(tplData.menuId, tplData.menuPid, tplData.menuAfterId, tplData.menuPath, tplData.menuName, tplData.menuTitle, tplData.menuH1, tplData.menuDesc, tplData.menuControllerId, function(err)
				{
					if(err) return getAdditionData(tplData, function(err2, tplData)
					{						
						if(err2) return asyncCb(err2, tplData);
						
						return asyncCb(err, tplData);
					})
					
					return asyncCb(null, tplData);
				});
			}
		],
		function (err, tplData)
		{
			//Models.end();
			//console.log(err);
			//console.log(tplData);
			/!*
			 нужно проверять тип шибки. в зависимости от типа ошибки,
			 принимать решение,вызывать ли next(err) или обработать ситуацию
			 *!/
			if(err)
			{
				switch (err.name)
				{
					default:
						return  next(err);
						break;
					
					case 'ValidationError':
						tplData.formError.error = true;
						tplData.formError.message = err.message;
						
						break;
					
					case 'DbErrDuplicateEntry':
						tplData.formError.error = true;
						tplData.formError.message = "Меню с таким путем или названием уже есть!";
						break;
				}
			}
			else if (tplData)
				return res.redirect(req.baseUrl+'/'+tplData.menuId+'/edit');
			
			//экспрот данных в JS на клиента
			res.expose(tplData.controllerList, 'controllerList');
			res.expose(tplData.menuList, 'menuList');
			res.expose(tplData.formError, 'formError');
			
			var View = new Template(req, res, next, Models);
			View.render(tplFile, tplData);
		}
	);
};

//////////////////
/!**
 * валидация формы
 *!/
function menuFormValidation(tplData, cb)
{
	tplData.menuPid = tplData.menuPid.toLowerCase().trim();
	tplData.menuControllerId = tplData.menuControllerId.toLowerCase().trim();
	tplData.menuAfterId = tplData.menuAfterId.toLowerCase().trim();
	
	tplData.menuPath = tplData.menuPath.toLowerCase().trim().replace("\\", "/");
	if (tplData.menuPath[tplData.menuPath.length-1] == '/')
	{
		tplData.menuPath = tplData.menuPath.substr(0, tplData.menuPath.length-1);
		console.log('tplData.menuPath');
		console.log(tplData.menuPath);
	}
	
	tplData.menuName = tplData.menuName.trim();
	tplData.menuDesc = tplData.menuDesc.trim();
	
	var formFields = {
		menuPid: tplData.menuPid,
		menuControllerId: tplData.menuControllerId,
		menuPath: tplData.menuPath,
		menuName: tplData.menuName,
		menuTitle: tplData.menuTitle,
		menuH1: tplData.menuH1,
		menuDesc: tplData.menuDesc
	};
	
	var validRules = {
		menuPid: 'required|numeric',
		
		menuControllerId: ['required','regex:/^[1-9][0-9]*!/'],
		
		menuPath: ['regex:/^\/([0-9a-zA-Z_-]+\/?)+$/'],
		menuName: 'required|min:3|max:100',
		menuTitle: 'required|min:3|max:255',
		menuH1: 'required|min:3|max:100',
		menuDesc: 'max:255'
	};
	
	var validator = new ValidatorJs(formFields, validRules, {
		"required.menuPid": "Родитель не указан",
		"numeric.menuPid": "Родитель не указан (число >= 0)",
		
		"required.menuControllerId": "Роутер не указан",
		"regex.menuControllerId": "Роутер не указан (число > 0)",
		
		"regex.menuPath": "URL указан не верно",
		
		"required.menuName": "Название указано не верно",
		"min.menuName": "Название указано не верно",
		"max.menuName": "Название указано не верно",
		
		"required.menuTitle": "Заголовок страницы указан не верно",
		"min.menuTitle": "Заголовок страницы указан не верно",
		"max.menuTitle": "Заголовок страницы указан не верно",
		
		"required.menuH1": "H1 указан не верно",
		"min.menuH1": "H1 указан не верно",
		"max.menuH1": "H1 указан не верно",
		
		"max.menuDesc": "Описание слишком длинное"
	});
	
	
	if(validator.fails())
	{
		var inputErrors = new Errors.ValidationError('Ошибка при заполнении фомры');
		
		if(validator.errors.has('menuPid'))       inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuPid'),'', 'menuPid'));
		if(validator.errors.has('menuControllerId'))       inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuControllerId'),'', 'menuControllerId'));
		if(validator.errors.has('menuPath'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuPath'),'', 'menuPath'));
		if(validator.errors.has('menuName'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuName'),'', 'menuName'));
		if(validator.errors.has('menuTitle'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuTitle'),'', 'menuTitle'));
		if(validator.errors.has('menuH1'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('menuH1'),'', 'menuH1'));
		
		for(var i in inputErrors.errors)
		{
			tplData.formError.fields[inputErrors.errors[i].field] = inputErrors.errors[i].message;
		}
		
		return cb(inputErrors, tplData);
	}
	
	return cb(null, tplData);
}

/!**
 * данные, которые хотим подгрузить (вызываетя в Async-методах)
 * @returns {*[]} - массив "задач" для Async-методов
 *!/
function getDataTasks()
{
	return [
		function(cb)
		{
			Models.get("Menu").getAll(function(err, menuList)
			{
				if(err) return cb(err, menuList);
				
				return cb(null, menuList);
			});
		},
		function(cb)
		{
			Models.get("controller").getAll(function(err, controllerList)
			{
				if(err) return cb(err, controllerList);
				
				return cb(null, controllerList);
			});
		}
	];
};

function getAdditionData(tplData, cb)
{
	Async.series(
		getDataTasks(),
		function(err, results)
		{
			////Models.end();
			tplData.menuList = results[0] || [];
			tplData.controllerList = results[1] || [];
			
			return cb(err, tplData);
		}
	);
}*/
