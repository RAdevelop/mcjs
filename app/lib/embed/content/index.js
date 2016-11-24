"use strict";

const Promise = require("bluebird");
const Helpers = require("app/helpers");
const Errors = require("app/lib/errors");

const Http = require("http");
const Https = require("https");
const Url = require('url');
const Cheerio = require('app/lib/cheerio');
//const ConcatStream = require('concat-stream');//а это пока не надо
const Iconv = require('iconv-lite');//надо использовать

class EmbedContent
{
	constructor(uri)
	{
		this.setUri(uri)
			.setCharsetEncoding('utf8')
			.setHtml();
	}

	/**
	 * названия сайтов, с которых мы умеем получаем данные
	 * @returns [{}]
	 */
	get hostList()
	{
		return [
			/*{"host": "rutube.ru",       "encoding":"utf8"},
			{"host": "myvi.ru",         "encoding":"utf8"},
			{"host": "youtube.com",     "encoding":"utf8"},
			{"host": "vimeo.com",       "encoding":"utf8"},*/
			{"host": "vkontakte.ru",    "encoding":"win1251"},
			{"host": "vk.com",          "encoding":"win1251"}
		];
	}

	/**
	 * адрес страницы, к которой шлем запрос sendRequest()
	 * @param uri
	 * @returns {VideoEmbed}
	 */
	setUri(uri)
	{
		let re = new RegExp('^https?\:\/\/', 'gi');

		if (!re.test(uri))
			uri = 'https://'+uri;

		this._uri  = uri;
		return this;
	}

	getUri()
	{
		return this._uri;
	}

	setHostName(hostname)
	{
		this._hostname  = hostname;
		return this;
	}

	getHostName()
	{
		if (!this._hostname)
			this.setHostName('');

		return this._hostname;
	}

	/**
	 * кодировка страницы в запросе sendRequest()
	 * @param charset
	 * @returns {VideoEmbed}
	 */
	setCharsetEncoding(charset)
	{
		this._charset  = charset;
		return this;
	}

	getCharsetEncoding()
	{
		return this._charset;
	}

	/**
	 * название сайта, к которому обратились
	 * @returns {*}
	 */
	setVideoHosting(hostName)
	{
		const self = this;
		let re = new RegExp( hostName, 'gi');

		this.hostList.some(function (host)
		{
			if(re.test(host["host"]))
			{
				let hName = host["host"].toLowerCase().split('.');
				self._videoHosting = hName[hName.length-2];
				self.setCharsetEncoding(host["encoding"]);
				return true;
			}
			return false;
		});

		return this;
	}

	getVideoHosting()
	{
		return this._videoHosting;
	}

	/**
	 * результат обращения к странице в sendRequest()
	 * @returns {string|*}
	 */
	setHtml(html = '')
	{
		this._html  = html;
		return this;
	}

	getHtml()
	{
		return this._html;
	}

	/**
	 * объект с данными полученного контента..
	 *
	 * @param data
	 * @returns {VideoEmbed}
	 */
	setData(data = {})
	{
		data = Object.assign({
			embed_url_video: '',
			embed_url: '',
			embed_title: '',
			embed_text: '',
			embed_width: '',
			embed_height: '',
			embed_image: ''
		}, data);

		this._data = data;

		return this;
	}

	getData()
	{
		if (!this._data)
			this.setData();

		return this._data;
	}

	/**
	 * шлем запрос на указанный uri
	 */
	sendRequest()
	{
		const self = this;
		let options = {
			hostname: '',
			port: null,
			path: '',
			method: 'GET',
			headers: {
				'Connection': 'keep-alive'
				,'Content-Type': 'text/plain'
				//,'Content-Length': Buffer.byteLength(postData)
			}
		};
		let uriData = {};

		if (Helpers.isLink(self.getUri()))//if(self.getUri())
			uriData = Url.parse(self.getUri());
		else
			return Promise.reject(new Errors.URIError());

		if (!uriData.hostname)
			uriData.hostname = this.getHostName();

		const H = (uriData["protocol"] == 'http:' ? Http : Https);

		Object.assign(options, uriData);

		self.setVideoHosting(uriData.hostname);

		return new Promise(function(resolve, reject)
		{
			/*let writableStream = ConcatStream({encoding: 'string'},function (body)
			 {
			 self.setHtml(body);
			 return resolve(body !== '');
			 });*/

			let req = H.request(options, function(res)
			{
				res.on('error', function(err)
				{
					return reject(err);
				});

				res.on('close', function()
				{
					res.destroy();
					return reject(new Errors.HttpError(502));
					//return reject(new Error("соединение разорвано"));
				});

				//res.pipe(writableStream);

				self.setHostName(options["hostname"]);

				res.pipe(Iconv.decodeStream(self.getCharsetEncoding())).collect(function(err, body)
				{
					self.setHtml(body);
					return resolve(body !== '');
				});

				//имеено после res.pip ... иначе запрос остается "незавершенным"!!!!
				if (res.statusCode >= 300 && res.statusCode < 400)
				{
					self.setUri(res.headers.location);
					return resolve(self.sendRequest());
				}
			});

			req.on('error', function(err)
			{
				return reject(err);
			});

			// write data to request body
			//req.write(postData);
			req.end();
		});
	}

	/**
	 * обрабатываем html теги <meta ...>
	 * @returns {{}}
	 * @private
	 */
	_parseMetaTag()
	{
		let meta = Cheerio(this.getHtml()).root().find('meta');
		let data = {};
		Object.keys(meta).forEach(function (key)
		{
			let item = meta[key];

			if (item.hasOwnProperty('attribs') && item["attribs"].hasOwnProperty('name'))
			{
				let content = item["attribs"]["content"] || '';

				if (content)
				{
					switch (item["attribs"]["property"])
					{
						case 'description':
							data["embed_text"] = content;
							break;
					}
				}
			}

			if (item.hasOwnProperty('attribs') && item["attribs"].hasOwnProperty('property'))
			{
				let content = item["attribs"]["content"] || '';
				if (content)
				{
					switch (item["attribs"]["property"])
					{
						case 'og:title':
							data["embed_title"] = content;
							break;

						case 'og:image':
							data["embed_image"] = content;
							break;

						case 'og:description':

							data["embed_text"] = content;
							break;

						case 'og:url': //url всегда (не важно какой контент)
							if (!data["embed_url"])
								data["embed_url"] = content;
							break;

						case 'og:video:url': //url для видео
						case 'og:video':
							if (!data["embed_url_video"])
								data["embed_url_video"] = content;
							break;

						case 'og:video:iframe'://url для видео

							data["embed_url_video"] = content;

							break;

						case 'og:video:width':
							data["embed_width"] = content;
							break;

						case 'og:video:height':
							data["embed_height"] = content;
							break;
					}
				}
			}
		});

		return data;
	}

	/*youtube()
	{
		this.setData(this._parseMetaTag());

		return this;
	}

	vimeo()
	{
		this.setData(this._parseMetaTag());

		return this;
	}*/

	/**
	 * для ВК дополнительная обработка данных
	 *
	 * @returns {*}
	 * @private
	 */
	_vkontakte()
	{
		return this._vk();
	}
	_vk()
	{
		let data = this._parseMetaTag();

		if (!data["embed_url_video"])
			return this;

		let url = Url.parse(data["embed_url_video"], true);

		let oid     = (url.hasOwnProperty("query") && url["query"]["oid"] ? url["query"]["oid"] : null);
		let id      = (url.hasOwnProperty("query") && url["query"]["vid"] ? url["query"]["vid"] : null);
		let hash    = (url.hasOwnProperty("query") && url["query"]["embed_hash"] ? url["query"]["embed_hash"] : null);

		if (oid && id && hash)
			data["embed_url_video"] = `//${url["hostname"]}/video_ext.php?oid=${oid}&id=${id}&hash=${hash}`;
		else
			data["embed_url_video"] = '';

		this.setData(data);
		return this;
	}

	/**
	 * пытаемся получить данные видео для последующей вставке в <iframe...>
	 * @returns {Promise.<TResult>|*}
	 */
	getContent()
	{
		return this.sendRequest()
			.bind(this)
			.then(function (hasBody)
			{
				if (!hasBody)
					return Promise.resolve(this.getData());

				if(typeof this['_'+this.getVideoHosting()] == 'function')
				{
					this['_'+this.getVideoHosting()]();
				}
				else
				{
					this.setData(this._parseMetaTag());
				}

				return Promise.resolve(this.getData());
			})
			.catch(function (err)
			{
				//console.log(err);
				return Promise.resolve(this.getData());
			});
	}

	/**
	 * статичный метод. вызываем в контроллерах
	 *
	 * @param cb
	 * @param tplData
	 * @param tplFile
	 * @param Controller
	 * @returns {Promise.<TResult>}
	 */
	static content(tplData, tplFile, Controller)
	{
		 //test https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/
		 const Content = new EmbedContent(tplData["s_uri"]);

		 return Content.getContent()
		 .then(function (contentData)
		 {
			 Object.assign(tplData, contentData);
			 Controller.view.setTplData(tplFile, tplData);

		    return Promise.resolve(true);
		 });
	 }
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = EmbedContent;