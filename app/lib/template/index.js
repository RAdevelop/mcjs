/**
 * Created by RA on 14.11.2015.
 * рисуем шаблоны (res.render....)
 */
"use strict";
const Promise = require('bluebird');
const Crypto = require('crypto');
const _ = require("lodash");

const IORedis = require('app/lib/ioredis');
const Config = require('app/config');

let opt = {connectionName : 'Template'};
opt = Object.assign({}, Config.redis, opt);
const Redis = IORedis(opt);

function Template(req, res, Controller = null)
{
	this.setController(Controller);

	let back = '/';
	let reStr = '^https?://'+req.header('host');
	let re = new RegExp(reStr);

	if (re.test(req.header('referer')))
	back = req.header('referer').replace(re, '');

	if (back.indexOf('/login') == 0 || back.indexOf('/registration') == 0 || back.indexOf('/logout') == 0)
		back= '/';

	this.data = {
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
	this.res.locals._isXHR          = req.xhr;
	this.res.locals._reqOriginalUrl = req.originalUrl;
	this.res.locals._reqBaseUrl     = (this.controller() ? this.controller().getBaseUrl() : req.baseUrl);
	//this.res.locals._reqPath        = req.path;
	this.res.locals._reqPath        = (this.controller() ? this.controller().getPath() : req.path);
	this.res.locals._action         = (this.controller() ? this.controller().getActionName() : '');
	this.res.locals._access        = (this.controller() ? this.controller().getLocalAccess() : {});
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

Template.prototype.getPageTitle = function()
{
	return this.data._pageTitle;
};

Template.prototype.setPageH1 = function(h1, addTo = true)
{
	this.data._pageH1 = (addTo ? this.data._pageH1 +' '+h1 : h1);
	return this;
};

Template.prototype.getPageH1 = function()
{
	return this.data._pageH1;
};

Template.prototype.setPageDescription = function(description)
{
	this.data._pageDescription = description;
	return this;
};

Template.prototype.getPageDescription = function()
{
	return this.data._pageDescription;
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
	Object.assign(this.data, data);

	return this;
};

Template.prototype.getAjaxData = function()
{
	return this.ajaxData;
};


Template.prototype.setAjaxData = function(data)
{
	if(_.isPlainObject(data))
		Object.assign(this.ajaxData, data);

	return this;
};

Template.prototype.setDataNull = function()
{
	this.data = null;
	this.ajaxData = null;
	
	return this;
};


Template.prototype.cacheHtmlKey = function()
{
	let keyData = [].concat(this.getCacheKeyData());
	keyData.push(this.req.originalUrl);

	return 'tpl:cache:'+Crypto.createHash('md5').update(keyData.join('|')).digest("hex");
}

Template.prototype.setCacheKeyData = function(cacheKeyData = [])
{
	this._cacheKeyData = cacheKeyData;
	return this;
}

Template.prototype.getCacheKeyData = function()
{
	return this._cacheKeyData||[];
}


Template.prototype.setCacheSeconds = function(сacheSeconds = 10)
{
	this._сacheSeconds = сacheSeconds;
	return this;
}
Template.prototype.getCacheSeconds = function()
{
	return parseInt(this._сacheSeconds, 10)||10;
}

Template.prototype.useCache = function(useCache = true)
{
	this._useCache = useCache;
	return this;
}
Template.prototype.isUseCache = function()
{
	return !!this._useCache;
}

Template.prototype.getCacheHtml = function()
{
	return Redis.get(this.cacheHtmlKey());
}

/**
 *
 * рисуем и отдаем шаблон
 *
 * @param json - флаг, true - вернуть в формате json, false - отрисовать страницу
 * @throws ?
 */
Template.prototype.render = function(json = false, cacheData = null)
{
	if (this.res.headersSent)
		return Promise.resolve(true);

	json = (json || this.req.xhr);

	if (cacheData)
	{
		//console.log('this.res.send(cacheData) from cacheData');
		this.res.send(cacheData);
		return Promise.resolve(true);
	}

	let renderData = this.getPageData(json);

	if (!_.isObject(renderData))
		throw new Error("Template: renderData is not object");

	if (json)//то renderData - должен быть Объектом {}
	{
		this.setAjaxData(renderData["data"]);

		let ajaxData = this.getAjaxData();

		return new Promise((resolve, reject)=>
		{
			//if (this.res.headersSent)
			//	return resolve(true);

			if (this.ajaxWithHtml())
			{
				let tplFile = renderData["tpl"];

				this.res.render(tplFile, ajaxData, (err, html)=>
				{
					this.setController(null);

					if (err)
						return reject(err);

					ajaxData["html"] = html;

					this.res.json(ajaxData);
					return resolve(true);
				});
			}
			else
			{
				//if (!this.req.xhr)
				this.res.set('Content-Type', 'application/json');

				this.setController(null);
				ajaxData["html"] = '';

				this.res.json(ajaxData);
				return resolve(true);
			}
		});
	}

	/*console.log('==========renderData==============');
	console.log(renderData);
	console.log('==========END renderData==============');*/

	return this.partialRender(renderData["partial"])
		.then((partialsHtml)=>
		{
			/*console.log('--------partialsHtml----------');
			console.log(partialsHtml)
			console.log('--------END partialsHtml----------\n');*/

			partialsHtml.forEach((item)=>
			{
				this.setData(item);
			});

			let tplFile;
			if (renderData["tpl"])
			{
				tplFile = Object.keys(renderData["tpl"]).shift();
				this.setData(renderData["tpl"][tplFile]);
			}
			else
				tplFile = 'empty.ejs';

			return new Promise((resolve, reject)=>
			{
				this.res.render(tplFile, this.getData(), (err, html)=>
				{
					if(err)
						return reject(err);
					
					this.setController(null);

					html = html.trim();

					//console.log('======= html =======');
					//console.log(html);
					//console.log('this.res.statusCode = ', this.res.statusCode);
					//console.log('this.getCacheSeconds() = ', this.getCacheSeconds());

					if (this.isUseCache() && !!this.getCacheSeconds() && this.res.statusCode >= 200 && this.res.statusCode < 300)
					{
						//console.log('set cache: this.isUseCache() = ', this.isUseCache());

						Redis.set(this.cacheHtmlKey(), html, 'EX', this.getCacheSeconds(), (err)=>
						{ //(err, res)
							if (err)
								return reject(err);

							this.res.send(html);
							return resolve(true);
						});
					}
					else
					{
						//console.log('NOT set cache: this.isUseCache() = ', this.isUseCache());
						this.res.send(html);
						return resolve(true);
					}
				});
			});
		})
		.catch((err)=>
		{
			this.setController(null);
			throw err;
		});
};

Template.prototype.partialRender = function(partials)
{
	/*console.log('==========partials==============');
	console.log(partials);
	console.log('==========END partials==============');*/
	if (partials.length == 0)
		return Promise.resolve([]);

	let blocks = partials.map((data)=>
	{
		let tpl = Object.keys(data).shift();
		return this.partial(tpl, data[tpl]);
	});

	return Promise.all(blocks);
};

Template.prototype.partial = function(tplFile, tplData)
{
	return new Promise((resolve, reject)=>
	{
		this.res.render(tplFile, tplData, (err, html)=>
		{
			if(err)
				return reject(err);

			return resolve({[tplFile.split('/').join('_')]:html});
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
		partialData.forEach((partData, partFile)=>
		{
			pageData["partial"].push({[partFile]: partData});
		});
	}

	return pageData;
};

Template.prototype.setTplData = function(tplFile, tplData = {}, ajaxWithHtml = false)
{
	if (typeof tplFile === 'object')
	{
		tplData = tplFile;
		tplFile = 'empty.ejs';
	}
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
