/**
 * Created by RA on 14.11.2015.
 * рисуем шаблоны (res.render....)
 */
"use strict";
const Promise = require('bluebird');
const _ = require("lodash");

function Template(req, res, next)
{
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
			fields: {}
		},
		title: (res.locals.menuItem && res.locals.menuItem.m_title ? res.locals.menuItem.m_title : ''),
		h1: (res.locals.menuItem && res.locals.menuItem.m_h1 ? res.locals.menuItem.m_h1 : ''),
		description:(res.locals.menuItem && res.locals.menuItem.m_desc ? res.locals.menuItem.m_desc : ''),
		back: back //ссылка "назад" для редиректов "Обрабтно",
	};

	this.ajaxData = {};
	this.req = req;
	this.res = res;
	this.next = next;

	this.res.locals.isXHR           = this.req.xhr;
	this.res.locals._reqOriginalUrl = req.originalUrl;
	this.res.locals._reqBaseUrl     = req.baseUrl;
	this.res.locals._reqPath        = req.path;
}

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
		return self.next(new Error("renderData is not object"));

	if (json)//то renderData - должен быть Объектом {}
	{
		self.res.set('Content-Type', 'application/json');
		self.setAjaxData(renderData);
		self.res.json(self.getAjaxData());
		return;
	}

	/*console.log('==========renderData==============');
	console.log(renderData);
	console.log('==========END renderData==============');*/

	self.partialRender(renderData["partial"])
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

			self.res.render(tplFile, self.getData(), function(err, html)
			{
				if(err) return Promise.reject(err);

				return self.res.send(html);
			});
		})
		.catch(function (err)
		{
			return self.next(err);
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

			resolve({[tplFile.split('/').join('_')]:html});
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
		return pageData["tpl"][Object.keys(pageData["tpl"]).shift()];

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

Template.prototype.setTplData = function(tplFile, tplData = {})
{
	this._tplData = {[tplFile]: tplData};

	return this;
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
