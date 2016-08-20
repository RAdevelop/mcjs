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

	get session()
	{
		return this._classes.getSession();
	}

	/*_setModels(models)
	{
		this._models = models;
		return this;
	}*/
}

module.exports = Base;