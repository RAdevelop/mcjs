"use strict";

//const Helpers = require("app/helpers");
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const Cheerio = require("app/lib/cheerio");
const Template = require('app/lib/template');
const _ = require('lodash');

/*
 console.log("req.method %s", req.method);
 console.log("req.baseUrl %s", req.baseUrl);
 console.log("req.originalUrl %s", req.originalUrl);
 console.log("req.path %s", req.path);
*/
let defAction = 'index';
class Base
{
	constructor(req, res, Classes)
	{
		this.setReq(req);
		this.setRes(res);

		this._setClasses(Classes);

		//this.setControls(Controls);

		this.setArgs([]);
		this.routeArgs = {};
	}
	
	_setBaseUrl(req, res)
	{
		//console.log('res.locals.menuItem.m_path = ', res.locals.menuItem.m_path);
		req.baseUrl = res.locals.menuItem.m_path + '/' + (this.getActionName() == 'index' ? '' : this.getActionName());
		//console.log('req.baseUrl = ', req.baseUrl);
		return this;
	}

	getBaseUrl()
	{
		let path = this.getReq().baseUrl;
		if (path.length > 1)
			path = (path[path.length-1] == '/' ? path.substr(0, path.length-1) : path);
		return path;
	}

	getPath()
	{
		//return this.getReq().path.replace(this.getBaseUrl(), '')
		//let path = this.getReq().path.replace(this.getBaseUrl(), '')
		//path = (path[path.length] == '/' ? path.substr(1) : path);
		//if (path.length > 1)
		//path = (path[path.length-1] == '/' ? path.substr(0, path.length-1) : path);
		//return path;
		return this.getArgs().join('/');
	}

	getReqQuery()
	{
		return this.getReq().query;
	}

	set view(view)
	{
		this._view = view;
	}

	get view()
	{
		return this._view;
	}

	get cheerio()
	{
		return Cheerio;
	}

	/**
	 * удаляем html теги для указанных полей (fields)
	 * @param formData
	 * @param fields
	 * @returns {*}
	 */
	stripTags(formData, fields = [])
	{
		const cheerio = this.cheerio;

		Object.keys(formData).forEach(function (key)
		{
			if (fields.indexOf(key) == -1)
				return;

			formData[key] = (formData[key] || '');
			formData[key] = cheerio(formData[key]).text().trim();

		});

		return formData;
	}

	getClass(className)
	{
		return this._classes.getClass(className);
	}

	_setClasses(classes)
	{
		this._classes = classes;
		return this;
	}

	_getClasses()
	{
		return this._classes;
	}
	
	model(model)
	{
		return this._classes.model(model);
	}
	
	/**
	 * определяем action
	 */
	setAction()
	{
		//HTTP методы GET POST...
		let method = this.getReq().method.toLowerCase();
		let f = method.charAt(0).toUpperCase();
		method = f + method.substr(1, method.length-1);
		method = 'Action'+method;
		
		let action = this.getReq().path.substring(this.getRes().locals.menuItem.m_path.length) ;
		let args = action.split('/');

		args.forEach(function(item, i)
		{
			if (item == '') args.splice(i, 1);
		});

		//console.log('args = ', args);

		/*if (args.length == 0)
		{
			this._action = defAction+method;
			this.setArgs(args);
		}
		else*/ //if (args.length > 0 && this.isAction(args[0]+method))
		if (args.length > 0)
			this._action = args[0]+method;


		if (this._isMethod(this._action))
		{
			this._setActionName(method);
			args.splice(0, 1);
			this.setArgs(args);
		}
		else
		{
			this._action = defAction+method;
			this._setActionName(method);
			this.setArgs(args);
		}

		this.setIsAction(this._isMethod(this._action));

		//console.log('_isAction =', this._action);
		//console.log('this.getArgs() =', this.getArgs());
		
		return this;
	}

	getAction()
	{
		return this._action;
	}

	_setActionName(method)
	{
		this._actionName = this._action.replace(method, '');
		//this._actionName = (this._actionName == 'index' ? '' : this._actionName);
		return this;
	}
	getActionName()
	{
		return this._actionName;
	}
	
	setArgs(args)
	{
		args.forEach(function(item, i)
		{
			if (item == '') args.splice(i, 1);
		});
		this._args = args;
		return this;
	}
	
	getArgs()
	{
		return this._args;
	}
	
	setReq(req)
	{
		this._req = req;
		return this;
	}
	getReq()
	{
		return this._req;
	}
	
	setRes(res)
	{
		this._res = res;
		return this;
	}
	getRes()
	{
		return this._res;
	}


	/**
	 * пути адресов страниц описанные в дочерних классах
	 * вид
	 * {
	 *  actionName1: {
	 *  'regExpOFRoute1' : [var1, var2, ..., varN],
	 *  'regExpOFRoute2': [var1, var2, ..., varN],
	 *  ...
	 *  'regExpOFRouteN': [var1, var2, ..., varN]
	 *  },
	 *
	 *  ......
	 *
	 *  actionName2: {
	 *  'regExpOFRoute1' : [var1, var2, ..., varN],
	 *  'regExpOFRoute2': [var1, var2, ..., varN],
	 *  ...
	 *  'regExpOFRouteN': [var1, var2, ..., varN]
	 *  },
	 * }
	 * @returns {{}}
	 */
	routePaths()
	{
		return {
			"index":{
				'^\/?$' : null
			}
		};
	}

	_parseRoutePaths()
	{
		if (this.getReq().method.toLowerCase() != 'get')
			return true;

		let actionName = this.getActionName();
		let routePaths = this.routePaths();
		let reqPath = this.getPath();

		//console.log('\n');
		console.log('actionName = ', actionName);
		console.log('routePaths:');
		console.log(routePaths);
		console.log('reqPath');
		console.log(reqPath);
		/*
		let regExp = new RegExp(this.routePaths().index[0], 'ig');

		console.log(this.getPath().search(regExp));
		console.log(this.routePaths());

		*/

		if (!routePaths[actionName])
			return false;

		let routers = Object.keys(routePaths[actionName]);
		let args = this.getArgs();

		let regExp, i, tmpArgs = {};
		for(i in routers)
		{
			regExp = new RegExp(routers[i], 'ig');

			console.log(regExp);

			/*
			console.log(routers[i]);
			console.log( reqPath.search(regExp) != -1);*/

			if (reqPath.search(regExp) != -1)
			{
				if (routePaths[actionName][routers[i]] && routePaths[actionName][routers[i]].length)
				{
					routePaths[actionName][routers[i]].forEach(function (varName, i)
					{
						if (varName)
						{
							tmpArgs[varName] = args[i];
						}
					});

					//this.routeArgs = Helpers.varsValidate(tmpArgs);
					this.routeArgs = tmpArgs;
				}
				console.log("this.routeArgs");
				console.log(this.routeArgs);
				console.log('\n');
				return true;
			}
		}

		console.log('\n');
		return false;
	}

	set routeArgs(args)
	{
		this._routeArgs = args;
		return this;
	}
	get routeArgs()
	{
		return this._routeArgs;
	}

	callAction(cb)
	{
		this.setAction();

		this._setBaseUrl(this.getReq(), this.getRes());


		//console.log('this.isAction() = ', this.isAction());
		//console.log('-----------------------');
		//console.log('');

		//if (!this._parseRoutePaths())
		if (!this.isAction() || !this._parseRoutePaths())
			return cb(new Errors.HttpStatusError(404, "Not Found"));

		this._getClasses().setSession(this.getReq().session);

		//this.view = new Template(this.getReq(), this.getRes(), this);
		this.view = Template.getTemplate(this);

		this[this.getAction()](cb);
		return this;
		//return cb(new Errors.HttpStatusError(404, "Not Found"));
	}
	
	formError()
	{
		return {
				formError: {
				message: '',
				text: '',
				error: false,
				errorName: '',
				fields: {}
			}
		};
	}

	/**
	 * если есть ошибки при сабмите формы..
	 *
	 * @param tplData
	 * @param errors
	 * @param message
	 * @param text
	 * @returns {{formError: {message: string, error: boolean, fields: {}}}}
	 * @throws FormError
	 */
	parseFormErrors(tplData, errors, message = 'Ошибки при заполнении формы', text = '')
	{
		let errKeys = Object.keys(errors);
		let data = {
			formError: {
				message: '',
				text: '',
				error: false,
				errorName: '',
				fields: {}
			}
		};

		Object.assign(data, tplData.formError);

		if (errKeys.length)
		{
			errKeys.forEach(function(f)
			{
				data.formError.fields[f] = errors[f];
			});

			if (text)
			data.formError.text = text;

			data.formError.message = message;
			data.formError.error = true;
			data.formError.errorName = 'FormError';

			Object.assign(tplData, data);

			throw new Errors.FormError(message, tplData);
		}

		return tplData;
	}
	
	/**
	 * проверяем, является ли указанный метод "действием в контроллере"
	 *
	 * @returns boolean
	 */
	isAction()
	{
		return this._isAction;
	}

	setIsAction(isAction)
	{
		this._isAction = isAction;
		return this;
	}
	
	_isMethod(method)
	{
		return !!(this[method] && typeof(this[method]) === 'function');
	}
	
	
	/**
	 * проверяем, является ли указанный метод "private"
	 *
	 * @param method
	 * @returns boolean
	 */
	static isPrivateMethod(method)
	{
		return (method.indexOf('_') == 0);
	}
	
	isAuthorized()
	{
		return this.getUserId();
	}
	
	isTheSameUser(u_id)
	{
		return (this.getUserId() == u_id);
	}
	
	getUser(u_id)
	{
		/*
		{ a_id: '1',
			u_id: '1',
			ai_id: '21',
			ai_dir: '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a',
			previews:
			{ '1280_853': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/1280_853.jpg',
				'1024_768': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/1024_768.jpg',
				'512_384': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/512_384.jpg',
				'256_192': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/256_192.jpg',
				'180_180': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/180_180.jpg',
				'100_100': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/100_100.jpg',
				'50_50': '/user/photo/0/1/21/4c56ff4ce4aaf9573aa5dff913df997a/50_50.jpg' },
			u_location_id: '298',
				u_latitude: '55.67572974',
			u_longitude: '37.89160590',
			l_pid: '258',
			l_name: 'Люберцы',
			l_latitude: '55.67649400',
			l_longitude: '37.89811600',
			l_kind: 'locality',
			l_full_name: 'Россия, Московская область, Люберцы',
			l_level: '3',
			l_lk: '383',
			l_rk: '384',
			u_name: 'Алексей',
			u_surname: 'Романов',
			u_sex: '1',
			u_sex_name: 'мужской',
			u_birthday: '359409600',
			bd_birthday: '23-05-1981',
			u_mail: 'roalexey@yandex.ru',
			u_date_visit: '1473530081',
			u_login: 'MotoCommunity',
			u_reg: '1' }
		*/
		if (u_id == this.getUserId())
		{
			let user = {};
			user = (this.getReq()._user ? this.getReq()._user : {u_id: null});
			//return user;
			return Promise.resolve(user);
		}

		return this.getClass("user").getUser(u_id);
	}

	getUserId()
	{
		//return this.getUser()["u_id"];
		return (this.getReq()._user && this.getReq()._user["u_id"] ? this.getReq()._user["u_id"] : null);
	}

	getHost()
	{
		return this.getReq().hostname;
	}

	getPort()
	{
		return this.getReq().app.settings.port;
	}

	getHostPort()
	{
		return (this.getPort() == 80 ? this.getHost() : this.getHost()+':'+this.getPort());
	}

	getReqBody()
	{
		return Object.assign((this.getReq().body ? this.getReq().body : {}), this.formError());
	}

	getParsedBody()
	{
		return Object.assign((this.getReq()._reqbody ? this.getReq()._reqbody : {}), this.formError());
	}
}

module.exports = Base;