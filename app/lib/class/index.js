"use strict";
/**
 * Created by Asus on 07.04.2016.
 */


class Base
{
	//constructor(Models)
	constructor(Classes)
	{
		this._setClasses(Classes);
		//this._setModels(Models);
	}
	
	model(model)
	{
		return this._classes.model(model);
		//return this._models.model(model);
	}

	getClass(className)
	{
		return this._classes.getClass(className);
	}
	_setClasses(Classes)
	{
		this._classes = Classes;
		return this;
	}

	getReq()
	{
		return this._classes.getReq();
	}
	getRes()
	{
		return this._classes.getRes();
	}

	getSession(name = null)
	{
		//console.log(this.getReq().session[name]);
		if (!name || !this.getReq().session[name])
		return null;

		return this.getReq().session[name];
	}

	setSession(name, value)
	{
		this.getReq().session[name] = value;
		return this;
	}

	delSession(name)
	{
		if (this.getReq().session[name])
		{
			this.getReq().session[name] = null;
			delete this.getReq().session[name];
		}

		return this;
	}
	/*_setModels(models)
	{
		this._models = models;
		return this;
	}*/
}

module.exports = Base;