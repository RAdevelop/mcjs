"use strict";
/**
 * Created by Asus on 07.04.2016.
 */

const Helpers = require("app/helpers");
const Cheerio = require("app/lib/cheerio");

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

	get helpers()
	{
		return Helpers;
	}
	
	get cheerio()
	{
		return Cheerio;
	}
	/*_setModels(models)
	{
		this._models = models;
		return this;
	}*/
}

/**
 * примешиваем методы хелпера
 */
/*
for(var key in Helpers)
	Base.prototype[key] = Helpers[key];
*/

module.exports = Base;