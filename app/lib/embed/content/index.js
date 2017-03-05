"use strict";

const Promise = require("bluebird");
const Helpers = require("app/helpers");
const Errors = require("app/lib/errors");
const Logger = require('app/lib/logger');

const Http = require("http");
const Https = require("https");
const Url = require('url');
const Cheerio = require('app/lib/cheerio');
//const ConcatStream = require('concat-stream');//а это пока не надо
const Iconv = require('iconv-lite');//надо использовать

class EmbedContent
{
	constructor(uri, b_iframe = false)
	{
		this.setUri(uri)
			.setIframeSrc(b_iframe)
			.setCharsetEncoding('utf8')
			.setHtml();
	}

	/**
	 * названия сайтов, с которых мы умеем получаем данные
	 * @returns [{}]
	 */
	static get hostList()
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

	static get vkHostList()
	{
		return ['vkontakte', 'vk'];
	}

	/**
	 * адрес страницы, к которой шлем запрос sendRequest()
	 * @param uri
	 * @return {EmbedContent}
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

	setIframeSrc(b_iframe)
	{
		this._iframe_src = b_iframe;
		return this;
	}
	getIframeSrc()
	{
		return this._iframe_src;
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
	 * @returns {EmbedContent}
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
	 * @returns {EmbedContent}
	 */
	setVideoHosting(hostName)
	{
		let re = new RegExp( hostName, 'gi');

		EmbedContent.hostList.some((host) => {
			if(re.test(host["host"]))
			{
				let hName = host["host"].toLowerCase().split('.');
				this._videoHosting = hName[hName.length-2];
				this.setCharsetEncoding(host["encoding"]);
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
		return new Promise((resolve, reject)=>
		{
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

			if (Helpers.isLink(this.getUri()))//if(this.getUri())
				uriData = Url.parse(this.getUri());
			else
				return reject(new Errors.URIError());

			if (!uriData.hostname)
				uriData.hostname = this.getHostName();

			const H = (uriData["protocol"] == 'http:' ? Http : Https);

			Object.assign(options, uriData);

			this.setVideoHosting(uriData.hostname);

			/*let writableStream = ConcatStream({encoding: 'string'}, (body)=>
			 {
			 this.setHtml(body);
			 return resolve(body !== '');
			 });*/

			let req = H.request(options, (res) =>
			{
				res.on('error', (err) => {
					return reject(err);
				});

				res.on('close', ()=>
				{
					res.destroy();
					return reject(new Errors.HttpError(502));
					//return reject(new Error("соединение разорвано"));
				});

				//res.pipe(writableStream);

				this.setHostName(options["hostname"]);

				res.pipe(Iconv.decodeStream(this.getCharsetEncoding())).collect((err, body)=>
				{
					if (err)
						return reject(err);

					this.setHtml(body);
					return resolve(body !== '');
				});

				//имеено после res.pip ... иначе запрос остается "незавершенным"!!!!
				if (res.statusCode >= 300 && res.statusCode < 400)
				{
					//https://vimeo.com/pierrealnorris/ewtkb2

					let redir = Url.parse(res.headers.location);

					let uri = '';
					if (!redir['hostname'])
					{
						//uri = uriData['protocol']+'//'+uriData['hostname']+'/'+res.headers.location;
						uri = uriData['protocol']+'//'+uriData['hostname']+res.headers.location;
					}
					else
						uri = res.headers.location;

					this.setUri(uri);
					return resolve(this.sendRequest());
				}
			});

			req.on('error', (err) =>
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
	static _parseMetaTag(html = '')
	{
		let meta = Cheerio(html).root().find('meta');
		let data = {};

		if (!Object.keys(meta).length)
			return data;
		
		Object.keys(meta).forEach((key) =>
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


	static _getCanonicalHref(html = '')
	{
		let link = Cheerio(html).root().find('link[rel="canonical"]');
		let canonicalHref = null;

		if (!Object.keys(link).length)
			return canonicalHref;

		let item;
		Object.keys(link).forEach((key) =>
		{
			item = link[key];
			//console.log('item = ', item);
			if (item.hasOwnProperty('attribs') && item['attribs']['rel'] == 'canonical')
			{
				if (Helpers.isLink(item['attribs']['href']) && !canonicalHref)
					canonicalHref = item['attribs']['href'];
			}
		});
		item = null;

		return canonicalHref;
	}

	/*youtube()
	{
		this.setData(EmbedContent._parseMetaTag());

		return this;
	}

	vimeo()
	{
		this.setData(EmbedContent._parseMetaTag());

		return this;
	}*/

	/**
	 * для ВК дополнительная обработка данных
	 *
	 * @returns {Promise}
	 * @private
	 */
	_vkontakte()
	{
		return this._vk();
	}

	_vk()
	{
/*
 https://vk.com/video-34886964_456239081
 <iframe src="//vk.com/video_ext.php?oid=-34886964&id=456239081&hash=2c43699c660f43ea&hd=2" width="853" height="480" frameborder="0" allowfullscreen></iframe>

*/
		EmbedContent._oid   = EmbedContent._oid||null;
		EmbedContent._vid   = EmbedContent._vid||null;
		EmbedContent._hash  = EmbedContent._hash||null;

		let url = {};
		//console.log('this.getUri() = ', this.getUri());
		if (this.getIframeSrc())
		{
			url = Url.parse(this.getUri(), true);
			EmbedContent._oid = (url["query"]["oid"] ? url["query"]["oid"] : null);
			EmbedContent._vid = (url["query"]["id"] ? url["query"]["id"] : null);
			EmbedContent._hash    = (url["query"]["hash"] ? url["query"]["hash"] : null);
			url = `https://vk.com/video${EmbedContent._oid}_${EmbedContent._vid}`;
			return url;
		}
		let data = EmbedContent._parseMetaTag(this.getHtml());

		if (!data["embed_url_video"])
		{
			Object.assign(data, this._parseVK());
		}
		else
		{
			url = Url.parse(data["embed_url_video"], true);

			if (url.hasOwnProperty("query"))
			{
				EmbedContent._oid     = (url["query"]["oid"] ? url["query"]["oid"] : EmbedContent._oid);
				EmbedContent._vid     = (url["query"]["vid"] ? url["query"]["vid"] : EmbedContent._vid);
				EmbedContent._hash    = (url["query"]["embed_hash"] ? url["query"]["embed_hash"] : EmbedContent._hash);
			}
		}

		if (EmbedContent._oid && EmbedContent._vid && EmbedContent._hash)
		{
			data["embed_url_video"] = `//vk.com/video_ext.php?oid=${EmbedContent._oid}&id=${EmbedContent._vid}&hash=${EmbedContent._hash}`;
		}
		else
		{
			data["embed_url_video"] = '';
		}

		this.setData(data);
		return this;
	}

	_parseVK()
	{
		let data = {};
		try
		{
			let params = this.getUri().match(/(-\d+)_(\d+)/);

			if (params)
			{
				EmbedContent._oid = params[1];
				EmbedContent._vid = params[2];
			}
			else
				return data;

			data['embed_url'] = this.getUri();

			let script = Cheerio(this.getHtml()).root().find('script');

			if (!Object.keys(script).length)
				return this;

			let html = '';
			let reg = new RegExp('extend\\(cur,\\s*\\{(.+)\\}\\)','im');

			Object.keys(script).forEach((key) =>
			{
				let item = script[key];

				//console.log(item);

				if (item.hasOwnProperty('children') && item['children'][0] && item['children'][0].hasOwnProperty('data'))
				{
					let found = item['children'][0]['data'].match(reg);

					if (found && found[1])
					{
						html = found[1];
					}
				}
			});

			html = `{${html}}`;

			let pageVideosList  = JSON.parse(html)['pageVideosList'][EmbedContent._oid];
			//console.log(pageVideosList['all']['list']);

			let found = false;
			pageVideosList['all']['list'].some((item)=>
			{
				if(item[0] == EmbedContent._oid && item[1] == EmbedContent._vid)
				{
					data["embed_image"] = item[2];
					data["embed_title"] = item[3];
					found = true;
					return true;
				}
				return false;
			});

			if (!found)
			{
				pageVideosList['uploaded']['list'].some((item)=>
				{
					if(item[0] == EmbedContent._oid && item[1] == EmbedContent._vid)
					{
						found = true;
						data["embed_image"] = item[2];
						data["embed_title"] = item[3];

						return true;
					}
					return false;
				});
			}

			script = html = pageVideosList = null;
		}
		catch(err)
		{
			Logger.error(err);
		}

		return data;
	}

	/**
	 * пытаемся получить данные видео для последующей вставке в <iframe...>
	 * @returns {Promise}
	 */
	getContent()
	{
		return this.sendRequest()
			.then((hasBody) =>
			{
				if (!hasBody)
					return Promise.resolve(this.getData());

				/*если this.getIframeSrc() === true то надо парсить this.getHtml()
				на предмет данных вида link rel="canonical" href=...
				<link rel="canonical" href="https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/">
					если найдено href
				1 выставить this.setIframeSrc(false);
				2 послать запрос на этот адрес href
*/

				if (EmbedContent.vkHostList.indexOf(this.getVideoHosting()) >= 0)
				{
					let uri = this._vk();
					if (typeof uri === 'string')
					{
						this.setIframeSrc(false).setUri(uri);
						return this.getContent();
					}
				}
				/*else if(typeof this['_'+this.getVideoHosting()] == 'function')
				{
					this['_'+this.getVideoHosting()]();
				}*/
				else if (this.getIframeSrc())
				{
					let canonicalHref = EmbedContent._getCanonicalHref(this.getHtml());
					//canonicalHref = 'https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/';

					if (canonicalHref)
					{
						this.setIframeSrc(false).setUri(canonicalHref);
						return this.getContent();
					}
				}
				else
					this.setData(EmbedContent._parseMetaTag(this.getHtml()));

				//console.log('this.getData() = ', this.getData());

				return Promise.resolve(this.getData());
			})
			.catch((err) => {//err
				Logger.error(err);
				return Promise.resolve(this.getData());
			});
	}

	/**
	 * статичный метод. вызываем в контроллерах
	 *
	 * @param tplData
	 * @param tplFile
	 * @param Controller
	 * @returns {Promise}
	 */
	static content(tplData, tplFile, Controller)
	{
		 //test https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/
		 const Content = new EmbedContent(tplData["s_uri"], tplData["b_iframe"]||false);

		 return Content.getContent()
			 .then((contentData) =>
			 {
				 //console.log(contentData);

				 Object.assign(tplData, contentData);
				 Controller.view.setTplData(tplFile, tplData);

			    return Promise.resolve(true);
			 });
	 }
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = EmbedContent;