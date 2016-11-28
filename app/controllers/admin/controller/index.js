"use strict";
"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

//const Async = require('async');
const Base = require('app/lib/controller');

class Controller extends Base
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
			"edit": {
				'^\/?$': null,
				'^\/?[0-9]+\/?$': ['ui_controller_id']
			}
		}
	}

	indexActionGet()
	{
		let tplData = {
			ui_controller_id: "", ui_controller_pid:"0", s_controller_path:'', s_controller_name: '', t_controller_desc: '',
			controllerList: [], methodsList: [],
			ui_controller_after_id: 0,
			s_cm_method: ""
		};

		return this.getClass("controller").getAll()
			.bind(this)
			.then(function(controllerList)
			{
				let tplFile = 'admin/controller/index.ejs';

				tplData['controllerList'] = controllerList || [];

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.controllerList, 'controllerList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * показываем страницу для Роутера по его id
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	editActionGet()
	{
		let tplFile = 'admin/controller/index.ejs';
		let {ui_controller_id=null} = this.routeArgs;

		if(!ui_controller_id)
			throw new Errors.HttpError(404);

		let tplData = {
			ui_controller_id: ui_controller_id, ui_controller_pid:"0", s_controller_path:'', s_controller_name: '', t_controller_desc: '',
			controllerList: [], methodsList: [],
			ui_controller_after_id: 0,
			s_cm_method: ""
		};

		return this.getClass("controller").getById(ui_controller_id)
			.bind(this)
			.then(function (cData)
			{
				if (!cData)
					throw new Errors.HttpError(404);

				tplData.ui_controller_id = cData["c_id"];
				tplData.ui_controller_pid = cData["c_pid"];
				tplData.s_controller_path = cData["c_path"];
				tplData.s_controller_name = cData["c_name"];
				tplData.t_controller_desc = cData["c_desc"];

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return Promise.props({
					methodsList: this.getClass("controller").getAllMethods(ui_controller_id),
					controllerList: this.getClass("controller").getAll()
				})
					.then(function(props)
					{
						tplData.methodsList = props.methodsList || [];
						tplData.controllerList = props.controllerList || [];

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData.controllerList, 'controllerList');
				this.getRes().expose(tplData.methodsList, 'methodsList');

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * обновляем данные для контроллера по его id
	 *
	 */
	editActionPost()
	{
		let tplData = this.getParsedBody();
		let btn_save = tplData["btn_controller_save"] || null;
		

		switch (btn_save)
		{
			default:

				if (!tplData["ui_controller_id"])
					throw new Errors.HttpError(404);

				return this.getClass('controller').getById(tplData["ui_controller_id"])
					.bind(this)
					.then(function (controller)
					{
						if (!controller)
							throw new Errors.HttpError(404);

						switch (btn_save)
						{
							default:
								throw new Errors.HttpError(400);
								break;

							case 'update':
								return this.update(tplData);
								break;

							case 'add_method':
								return this.addMethod(tplData);
								break;
						}
					});
				break;

			//добавляем новый контроллер в БД
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

				tplData = this.stripTags(tplData, ["s_controller_path", "s_controller_name", "t_controller_desc"]);

				tplData["ui_controller_pid"]        = parseInt(tplData["ui_controller_pid"], 10)        || 0;
				tplData["ui_controller_after_id"]   = parseInt(tplData["ui_controller_after_id"], 10)   || 0;

				tplData["s_controller_path"] = tplData["s_controller_path"].trim().split("/");

				if (tplData["s_controller_path"][tplData["s_controller_path"].length-1] == "")
					tplData["s_controller_path"].pop();

				tplData["s_controller_path"] = tplData["s_controller_path"].join("/").toLowerCase();

				if (!tplData["s_controller_path"] || !(tplData["s_controller_path"].search(/^\/([0-9a-zA-Z_-]+\/?){3,}$/ig) != -1))
					errors["s_controller_path"] = "Укажите путь";

				if (!tplData["s_controller_name"])
					errors["s_controller_name"] = "Укажите название";

				this.parseFormErrors(tplData, errors);

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('controller').add(tplData["ui_controller_pid"], tplData["ui_controller_after_id"], tplData["s_controller_path"], tplData["s_controller_name"], tplData["t_controller_desc"])
					.then(function (c_id)
					{
						tplData['ui_controller_id'] = c_id;
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
					tplData.formError.message = 'Такой контроллер уже существует';
					tplData.formError.fields['s_controller_path'] = "Укажите путь";
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
	 * редактируем основные данные контроллера
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	update(tplData)
	{
		let tplFile = 'admin/controller/index.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};

				tplData = this.stripTags(tplData, ["s_controller_path", "s_controller_name", "t_controller_desc"]);

				tplData["ui_controller_pid"]        = parseInt(tplData["ui_controller_pid"], 10)        || 0;
				tplData["ui_controller_after_id"]   = parseInt(tplData["ui_controller_after_id"], 10)   || 0;

				tplData["s_controller_path"] = tplData["s_controller_path"].trim().split("/");

				if (tplData["s_controller_path"][tplData["s_controller_path"].length-1] == "")
					tplData["s_controller_path"].pop();

				tplData["s_controller_path"] = tplData["s_controller_path"].join("/").toLowerCase();

				if (!tplData["s_controller_path"] || !(tplData["s_controller_path"].search(/^\/([0-9a-zA-Z_-]+\/?){3,}$/ig) != -1))
					errors["s_controller_path"] = "Укажите путь";

				if (!tplData["s_controller_name"])
					errors["s_controller_name"] = "Укажите название";

				this.parseFormErrors(tplData, errors);

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('controller').updById(tplData["ui_controller_id"], tplData["ui_controller_pid"], tplData["ui_controller_after_id"], tplData["s_controller_path"], tplData["s_controller_name"], tplData["t_controller_desc"]);
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

	/**
	 * создаем метод, и связываем его с редактируемым контроллером
	 * 
	 * @param tplData
	 */
	addMethod(tplData)
	{
		let tplFile = 'admin/controller/index.ejs';
		
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				let errors = {};
				
				tplData = this.stripTags(tplData, ["s_cm_method"]);

				if (!tplData["s_cm_method"] || !(tplData["s_cm_method"].search(/^(get|post)_[a-zA-Z_]{3,33}$/ig) != -1))
					errors["s_cm_method"] = "Укажите метод";

				this.parseFormErrors(tplData, errors);
				
				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('controller').addMethod(tplData["ui_controller_id"], tplData["s_cm_method"])
					.then(function (cm_id)
					{
						tplData["ui_cm_id"] = cm_id;
						return Promise.resolve(tplData);
					});
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
module.exports = Controller;

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
			Models.get("Router").add(tplData.ui_controller_pid, tplData.ui_controller_after_id, tplData.s_controller_path, tplData.s_controller_name, tplData.t_controller_desc, function(err, rId)
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
	tplData.ui_controller_pid = tplData.ui_controller_pid.toLowerCase().trim();
	
	tplData.ui_controller_after_id = tplData.ui_controller_after_id.toLowerCase().trim();
	tplData.ui_controller_after_id = parseInt(tplData.ui_controller_after_id, 10);
	tplData.ui_controller_after_id = (tplData.ui_controller_after_id < 0 ? 0 : tplData.ui_controller_after_id);
	
	tplData.s_controller_path = tplData.s_controller_path.toLowerCase().trim().replace("\\", "/");
	
	tplData.s_controller_path = tplData.s_controller_path.split("/");
	
	if (tplData.s_controller_path[tplData.s_controller_path.length-1] == "")
	tplData.s_controller_path.pop();
	
	tplData.s_controller_path = tplData.s_controller_path.join("/");
	
	tplData.s_controller_name = tplData.s_controller_name.trim();
	tplData.t_controller_desc = tplData.t_controller_desc.trim();
	
	var formFields = {
		ui_controller_pid: tplData.ui_controller_pid,
		ui_controller_after_id: tplData.ui_controller_after_id,
		s_controller_path: tplData.s_controller_path,
		s_controller_name: tplData.s_controller_name
	};
	
	var validRules = {
		ui_controller_pid: 'required|numeric',
		s_controller_path: ['required','regex:/^\/([0-9a-zA-Z_-]+\/?)+$/'],
		s_controller_name: 'required|min:3|max:100'
	};
	
	var validator = new ValidatorJs(formFields, validRules, {
		"required.ui_controller_pid": "Родитель не указан",
		"numeric.ui_controller_pid": "Родитель не указан",
				
		"required.s_controller_path": "Путь указан не верно",
		"regex.s_controller_path": "Путь указан не верно",
		
		"required.s_controller_name": "Название не верно указано",
		"min.s_controller_name": "Название указано не верно",
		"max.s_controller_name": "Название указано не верно",
	});

	
	if(validator.fails())
	{
		var inputErrors = new Errors.ValidationError('Ошибка при заполнении фомры');
		
		if(validator.errors.has('ui_controller_pid'))     inputErrors.addError(new Errors.ValidationError(validator.errors.first('ui_controller_pid'),'', 'ui_controller_pid'));
		if(validator.errors.has('s_controller_path'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('s_controller_path'),'', 's_controller_path'));
		if(validator.errors.has('s_controller_name'))    inputErrors.addError(new Errors.ValidationError(validator.errors.first('s_controller_name'),'', 's_controller_name'));
		
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
