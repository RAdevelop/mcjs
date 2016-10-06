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

class VideoEmbed
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
			{"host": "youtube",     "encoding":"utf8"},
			{"host": "vimeo",       "encoding":"utf8"},
			{"host": "vkontakte",   "encoding":"win1251"},
			{"host": "vk",          "encoding":"win1251"}
		];
	}

	/**
	 * адрес страницы, к которой шлем запрос sendRequest()
	 * @param uri
	 * @returns {VideoEmbed}
	 */
	setUri(uri)
	{
		//if (Helpers.isLink(uri))
			this._uri  = uri;
		//else
		//	this._uri  = '';
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
		hostName = hostName.toLowerCase().split('.');

		const self = this;
		this.hostList.some(function (host)
		{
			if(hostName.indexOf(host["host"]) != -1)
			{
				self._videoHosting = host["host"];
				self.setCharsetEncoding(host["encoding"]);
				return true;
			}
			return false;
		});

		//console.log("this._videoHosting = ", this._videoHosting);

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
	 * объект с данными полученного видео..
	 *
	 * @param data
	 * @returns {VideoEmbed}
	 */
	setVideoData(data = {})
	{
		data = Object.assign({
			video_embed_url: '',
			video_embed_title: '',
			video_embed_text: '',
			video_embed_width: '',
			video_embed_height: '',
			video_embed_image: ''
		}, data);

		this._data = data;

		return this;
	}

	getVideoData()
	{
		if (!this._data)
			this.setVideoData();

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
					return reject(new Error("соединение разорвано"));//TODO
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

			if (item.hasOwnProperty('attribs') && item["attribs"].hasOwnProperty('property'))
			{
				let content = item["attribs"]["content"] || '';

				switch (item["attribs"]["property"])
				{
					case 'og:title':
						data["video_embed_title"] = content;
						break;

					case 'og:image':
						data["video_embed_image"] = content;
						break;

					case 'og:description':
						data["video_embed_text"] = content;
						break;

					case 'og:video:url':
					case 'og:video':
						if (!data["video_embed_url"])
							data["video_embed_url"] = content;
						break;

					case 'og:video:iframe':

						data["video_embed_url"] = content;

						break;

					case 'og:video:width':
						data["video_embed_width"] = content;
						break;
					case 'og:video:height':
						data["video_embed_height"] = content;
						break;
				}
			}
		});
		return data;
	}

	/*youtube()
	{
		this.setVideoData(this._parseMetaTag());

		return this;
	}

	vimeo()
	{
		this.setVideoData(this._parseMetaTag());

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
		if (!data["video_embed_url"])
			return this;

		let url = Url.parse(data["video_embed_url"], true);

		let oid     = (url.hasOwnProperty("query") && url["query"]["oid"] ? url["query"]["oid"] : null);
		let id      = (url.hasOwnProperty("query") && url["query"]["vid"] ? url["query"]["vid"] : null);
		let hash    = (url.hasOwnProperty("query") && url["query"]["embed_hash"] ? url["query"]["embed_hash"] : null);

		if (oid && id && hash)
			data["video_embed_url"] = `//${url["hostname"]}/video_ext.php?oid=${oid}&id=${id}&hash=${hash}`;
		else
			data["video_embed_url"] = '';

		this.setVideoData(data);
		return this;
	}

	/**
	 * пытаемся получить данные видео для последующей вставке в <iframe...>
	 * @returns {Promise.<TResult>|*}
	 */
	getVideo()
	{
		return this.sendRequest()
			.bind(this)
			.then(function (hasBody)
			{
				if (!hasBody)
					return Promise.resolve(this.getVideoData());

				if(typeof this['_'+this.getVideoHosting()] == 'function')
				{
					this[this.getVideoHosting()]();
				}
				else
				{
					this.setVideoData(this._parseMetaTag());
				}

				return Promise.resolve(this.getVideoData());
			})
			.catch(function (err)
			{
				//console.log(err);
				return Promise.resolve(this.getVideoData());
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = VideoEmbed;

/*
let uri = '';
uri = 'https://youtu.be/nQLkaqFoGk4';
uri = 'https://vimeo.com/185412081';
//uri = 'https://vk.com/video5844452_169189734'; //доступно
uri = 'https://vkontakte.ru/video-27019642_456242064'; //доступно
//uri = 'https://vk.com/video-27019642_456242064'; //доступно
//uri = 'https://vk.com/video-34886964_170885070'; //НЕдоступно

let start = new Date();

const Video = new VideoEmbed(uri);

Video.getVideo()
	.then(function (video)
	{
		console.log("video = ", video);
		//console.log(Video.getHtml());

		let end = new Date();
		console.log("response time: ", end.getTime() - start.getTime() + " ms");

		//response time:  644 ms
		//response time:  621 ms
	})
	.catch(function (err)
	{
		console.log(err);
	});



//<iframe src="//vk.com/video_ext.php?oid=5844452&id=169189734&hash=21475cd3b5a666e8&hd=2" width="853" height="480" frameborder="0" allowfullscreen></iframe>

//<iframe width="1679" height="930" src="https://www.youtube.com/embed/nQLkaqFoGk4" frameborder="0" allowfullscreen></iframe>

//<iframe src="https://player.vimeo.com/video/185412081" width="640" height="272" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
//<p><a href="https://vimeo.com/185412081">Violet Sands &mdash; No Matter What</a> from <a href="https://vimeo.com/dresscode">Dress Code</a> on <a href="https://vimeo.com">Vimeo</a>.</p>
*/