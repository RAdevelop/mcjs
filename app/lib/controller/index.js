"use strict";

//const logger = require('app/lib/logger')();
const Errors = require('app/lib/errors');
const Template = require('app/lib/template');
//const Async = require('async');
const _ = require('lodash');

/*
let [firstName, lastName] = ["Илья", "Кантор"];
не работает в текущей версии Ноды
console.log(firstName); // Илья
console.log(lastName);  // Кантор
 
 
 console.log("req.method %s", req.method);
 console.log("req.baseUrl %s", req.baseUrl);
 console.log("req.originalUrl %s", req.originalUrl);
 console.log("req.path %s", req.path);
*/
let defAction = 'index';
class Base
{
	constructor(req, res, next, Classes)
	{
		this.setReq(req);
		this.setRes(res);

		this._setClasses(Classes);
		this.next = next;

		//this.setControls(Controls);

		this.setArgs([]);
	}

	set view(view)
	{
		this._view = view;
	}

	get view()
	{
		return this._view;
	}

	set next(next)
	{
		this._next = next;
	}

	get next()
	{
		return this._next;
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
			args.splice(0, 1);
			this.setArgs(args);
		}
		else
		{
			this._action = defAction+method;
			this.setArgs(args);
		}

		this.setIsAction(this._isMethod(this._action));

		//console.log('_isAction =', this._action);
		//console.log('this.getArgs() =', this.getArgs());
		
		return this;
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
	
	callAction(cb)
	{
		this.setAction();
		
		//if (!this[this._action]) return cb(new Errors.HttpStatusError(404, "Not Found"));

		//console.log('this.isAction() = ', this.isAction());
		//console.log('-----------------------');
		//console.log('');

		if (!this.isAction())
			return cb(new Errors.HttpStatusError(404, "Not Found"));

		this.view = new Template(this.getReq(), this.getRes(), this.next);

		this[this._action](cb);
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
	
	getUser()
	{
		//return this.getReq()._user;
		return (this.getReq()._user ? this.getReq()._user : {u_id: null});
	}

	getUserId()
	{
		return this.getUser()["u_id"];
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