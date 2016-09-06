/**
 * Created by RA on 14.11.2015.
 * рисуем шаблоны (res.render....)
 */
"use strict";
const Promise = require('bluebird');
const _ = require("lodash");

function Template(req, res, Controller = null)
{
	this.setController(Controller);

	let back = '/';
	let reStr = '^https?://'+req.header('host');
	let re = new RegExp(reStr);

	if (re.test(req.header('referer')))
	back = req.header('referer').replace(re, '');

	if (back.indexOf('/login') == 0 || back.indexOf('/registration') == 0)
		back= '/';

	this.data = {
		//exported_to_js: null,
		formError: {
			message: '',
			text: '',
			error: false,
			errorName: '',
			fields: {}
		},
		_pageTitle: (res.locals.menuItem && res.locals.menuItem.m_title ? res.locals.menuItem.m_title : ''),
		_pageH1: (res.locals.menuItem && res.locals.menuItem.m_h1 ? res.locals.menuItem.m_h1 : ''),
		_pageDescription:(res.locals.menuItem && res.locals.menuItem.m_desc ? res.locals.menuItem.m_desc : ''),
		_pageOgImage: '',
		back: back //ссылка "назад" для редиректов "Обрабтно",
	};

	this.ajaxData = {};
	this.req = req;
	this.res = res;
	//this.next = next;

	this.res.locals._reqQuery       = req.query;
	this.res.locals._isXHR           = req.xhr;
	this.res.locals._reqOriginalUrl = req.originalUrl;
	this.res.locals._reqBaseUrl     = (this.controller() ? this.controller().getBaseUrl() : req.baseUrl);
	//this.res.locals._reqPath        = req.path;
	this.res.locals._reqPath        = (this.controller() ? this.controller().getPath() : req.path);
	this.res.locals._action         = (this.controller() ? this.controller().getActionName() : '');

}

Template.getTemplate = function (Controller)
{
	return new Template(Controller.getReq(), Controller.getRes(), Controller);
};

Template.prototype.setPageTitle = function(title, concatMenuTitle = true)
{
	this.data._pageTitle = (concatMenuTitle ? this.data._pageTitle + ' ' + title : title);
	return this;
};
Template.prototype.setPageH1 = function(h1)
{
	this.data._pageH1 = h1;
	return this;
};
Template.prototype.setPageDescription = function(description)
{
	this.data._pageDescription = description;
	return this;
};

Template.prototype.setPageOgImage = function(src)
{
	this.data._pageOgImage = src;
	return this;
};

Template.prototype.controller = function()
{
	return this._controller;
};

Template.prototype.setController = function(controller)
{
	this._controller = controller;
	return this;
};

Template.prototype.getData = function()
{
	return this.data;
};

Template.prototype.setData = function(data)
{
	if(_.isPlainObject(data))
	this.data = Object.assign(this.data, data);

	return this;
};

Template.prototype.getAjaxData = function()
{
	return this.ajaxData;
};


Template.prototype.setAjaxData = function(data)
{
	if(_.isPlainObject(data))
		this.ajaxData = Object.assign(data,this.ajaxData);
	return this;
};



/**
 *
 * рисуем и отдаем шаблон
 *
 * @param json - флаг, true - вернуть в формате json, false - отрисовать страницу
 * @throws ?
 */
//Template.prototype.render = function(tpl, tplData, json)
Template.prototype.render = function(json = false)
{
	json = (json || this.req.xhr);

	const self = this;
	let renderData = self.getPageData(json);

	if (!_.isObject(renderData))
		throw new Error("Template: renderData is not object");
		//return self.next(new Error("Template: renderData is not object"));

	if (json)//то renderData - должен быть Объектом {}
	{
		self.setAjaxData(renderData["data"]);

		let ajaxData = self.getAjaxData();

		return new Promise(function (resolve, reject)
		{
			if (self.res.headersSent)
				return resolve(true);

			if (self.ajaxWithHtml())
			{
				let tplFile = renderData["tpl"];

				return self.res.render(tplFile, ajaxData, function(err, html)
				{
					self.setController(null);

					reject(err);

					ajaxData["html"] = html;

					return resolve(self.res.json(ajaxData));

					//return self.res.json(ajaxData);
				});
			}
			else
			{
				//if (!self.req.xhr)
				self.res.set('Content-Type', 'application/json');

				self.setController(null);
				ajaxData["html"] = '';

				return resolve(self.res.json(ajaxData));

				//self.res.json(ajaxData);
				//return resolve(true);
			}
		});
	}

	/*console.log('==========renderData==============');
	console.log(renderData);
	console.log('==========END renderData==============');*/

	return self.partialRender(renderData["partial"])
		.then(function (partialsHtml)
		{
			/*console.log('--------partialsHtml----------');
			console.log(partialsHtml)
			console.log('--------END partialsHtml----------');*/

			partialsHtml.forEach(function(item)
			{
				self.setData(item);
			});

			let tplFile = Object.keys(renderData["tpl"]).shift();

			self.setData(renderData["tpl"][tplFile]);

			return new Promise(function (resolve, reject)
			{
				self.res.render(tplFile, self.getData(), function(err, html)
				{
					if(err) return reject(err);

					self.setController(null);
					return resolve(self.res.send(html));
					//return self.res.send(html);
				});
			});
		})
		.catch(function (err)
		{
			self.setController(null);
			throw err;
		});
};

Template.prototype.partialRender = function(partials)
{
	const self = this;
	/*console.log('==========partials==============');
	console.log(partials);
	console.log('==========END partials==============');*/
	if (partials.length == 0) return Promise.resolve([]);

	let blocks = partials.map(function(data)
	{
		let tpl = Object.keys(data).shift();
		return self.partial(tpl, data[tpl]);
	});

	return Promise.all(blocks)
		.catch(function (err)
		{
			/*console.log('partials.map(function(data)');
			console.log(err);*/
			throw err;
		});
};


Template.prototype.partial = function(tplFile, tplData)
{
	const self = this;
	return new Promise(function(resolve, reject)
	{
		self.res.render(tplFile, tplData, function(err, html)
		{

			if(err) return reject(err);

			return resolve({[tplFile.split('/').join('_')]:html});
		}).catch(function (err)
		{
			/*console.log('self.res.render');
			console.log(err);*/
			throw err;
		});
	});
};

Template.prototype.getPageData = function(json = false)
{
/*
	renderData - массив объектов  ключи - относительные пути к шаблонам, значения - данные для этих шаблонов
	 renderData = {
	"tpl": {"index": pageData}, //основной шаблон страницы
	"partial": [
		{'left_col': {title: 'left_col'} },             //дополнительные шаблоны для страницы
		{'right_col': {title: 'right_col'} },
		{'left_news': {title: 'left_news'} }
	]
};
	left_col - путь к шаблону. преобрузуется в "left/col" относительно папки, где хранятся все шаблоны
 */
	let pageData = {};
	pageData["tpl"] = this.getTplData();

	if (json)
	{
		let file = Object.keys(pageData["tpl"]).shift();
		return {"tpl": file, "data": pageData["tpl"][file]};
	}

	pageData["partial"] = [];
	let partialData = this.getPartialData();

	/*console.log('==========partialData==============');
	console.log(partialData);
	console.log('==========END partialData==============');*/

	if (partialData && partialData.size)
	{
		partialData.forEach(function (partData, partFile)
		{
			pageData["partial"].push({[partFile]: partData});
		});
	}

	return pageData;
};

Template.prototype.setTplData = function(tplFile, tplData = {}, ajaxWithHtml = false)
{
	this._tplData = {[tplFile]: tplData};
	this._ajaxWithHtml = ajaxWithHtml;

	return this;
};

Template.prototype.ajaxWithHtml = function()
{
	return this._ajaxWithHtml;
};

Template.prototype.getTplData = function()
{
	return this._tplData;
};

Template.prototype.addPartialData = function(tplPartialFile, partialData = {})
{
	if (!this._partialData)
		this._partialData = new Map();

	if (this._partialData.has(tplPartialFile))
	{
		this._partialData.set(tplPartialFile, Object.assign(this._partialData.get(tplPartialFile), partialData));
	}
	else
		this._partialData.set(tplPartialFile, partialData);

	return this;
};

Template.prototype.getPartialData = function()
{
	return this._partialData;
};

module.exports = Template;
