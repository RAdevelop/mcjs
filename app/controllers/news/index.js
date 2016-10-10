"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
const FileUpload = require('app/lib/file/upload');

const VideoEmbed = require("app/lib/video/embed");

//const Moment = require('moment'); //работа со временем
const Base = require('app/lib/controller');


let limit_per_page = 1;

class News extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?[0-9]+\/\\S+\/?$': ['i_news_id','s_news_alias']
				,"^\/?page\/[1-9]+[0-9]*\/?$" : [ ,"i_page"] //список с постраничкой
				,'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_news_id']
			}
		}
	}

	/**
	 * главная страница
	 *
	 * @returns {*}
	 */
	indexActionGet()
	{
		let tplData = {
			news: null,
			newsList: null
		};

		let {i_news_id=null, s_news_alias=null} = this.routeArgs;

		if (i_news_id)
			return this.news(tplData, i_news_id, s_news_alias);

		return this.newsList(tplData);
	}

	/**
	 * выбранная новость
	 *
	 * @param tplData
	 * @param i_news_id
	 * @param s_alias
	 * @throws Errors.HttpStatusError
	 */
	news(tplData, i_news_id, s_alias)
	{
		return this.getClass('news').get(i_news_id)
			.bind(this)
			.then(function (news)
			{
				if (!news || news["n_alias"] != s_alias)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(news);
			})
			.then(function (news)
			{
				return this.getClass('news').getImageList(news.n_id)
					.spread(function (images, allPreviews)
					{
						return Promise.resolve([news, images, allPreviews]);
					});
			})
			.spread(function (news, images, allPreviews)
			{
				news["newsImages"] = images;
				news["newsImagesPreviews"] = allPreviews;

				let tplFile = "news";

				tplData["news"] = news;
				tplData["newsImages"] = news["newsImages"];

				this.view.setPageTitle(news["n_title"]);
				this.view.setPageDescription(news["n_notice"]);

				if (news["newsImages"] && news["newsImages"][0] && news["newsImages"][0]["previews"]["512_384"])
					this.view.setPageOgImage(news["newsImages"][0]["previews"]["512_384"]);

				//this.view.setPageH1(news.n_title);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["news"], 'newsData');


				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * список событий
	 *
	 * @param tplData
	 * @param routeArgs
	 */
	newsList(tplData)
	{
		let {i_page=1} = this.routeArgs;

		return Promise.resolve(this.getClass("news").getNews(new Pages(i_page, limit_per_page)))
			.bind(this)
			.spread(function (newsList, Pages)
			{
				tplData["newsList"] = newsList;

				let exposeNews = 'newsList';
				Pages.setLinksUri(this.getBaseUrl())
					.setAjaxPagesType(true)
					.setAjaxDataSrc([exposeNews])
					.setAjaxDataTarget(exposeNews)
					.setJquerySelectorData('.newsListContainer .newsListItem');

				tplData["pages"] = Pages.pages();

				let tplFile = '';
				let isAjax = this.getReq().xhr;
				if (isAjax)
				{
					tplFile = 'news/list.ejs';
				}
				else
				{
					tplFile = 'news';
				}

				this.getRes().expose(newsList, exposeNews);
				this.getRes().expose(tplData["pages"], 'pages');

				this.view.setTplData(tplFile, tplData, isAjax);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(isAjax);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * форма добавления новости
	 *
	 */
	addActionGet()
	{
		let tplData = {
			news: {
				n_id: '',
				n_create_ts: '',
				n_update_ts: '',
				dd_show_ts: '',
				n_title: '',
				n_notice: '',
				n_text: '',
				u_id: ''
			}
		};

		let tplFile = "news";

		this.view.setTplData(tplFile, tplData);

		return Promise.resolve(null);
	}

	/**
	 * добавляем новый трек
	 *
	 * @returns {Promise.<TResult>}
	 */
	addActionPost()
	{
		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();

		//console.log(tplData);

		let errors = {};

		tplData = this.stripTags(tplData, ["dd_show_ts", "s_n_title","t_n_notice"]);

		tplData["t_n_text"] = this.cheerio(tplData["t_n_text"]).root().cleanTagEvents().html();

		if (!tplData["dd_show_ts"])
			errors["dd_show_ts"] = "Укажите дату новости";

		if (!tplData["s_n_title"])
			errors["s_n_title"] = "Укажите название новости";

		if (!tplData["t_n_notice"])
			errors["t_n_notice"] = "Укажите анонс новости";

		if (!tplData["t_n_text"])
			errors["t_n_text"] = "Укажите описание новости";
		

		let tplFile = "news/edit.ejs";

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('news').add(this.getUserId(), tplData["s_n_title"], tplData["t_n_notice"], tplData["t_n_text"], tplData["dd_show_ts"])
					.bind(this)
					.then(function (i_news_id)
					{
						tplData["i_news_id"] = i_news_id;

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err)//такие ошибки не уводят со страницы.
			{
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * форма редактирования новости
	 *
	 */
	editActionGet()
	{
		let {i_news_id} = this.routeArgs;

		if (!i_news_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('news').get(i_news_id)
			.bind(this)
			.then(function (news)
			{
				if (!news)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(news);
			})
			.then(function (news)
			{
				return this.getClass('news').getImageList(news.n_id)
					.spread(function (images, allPreviews)
					{
						return Promise.resolve([news, images, allPreviews]);
					});
			})
			.spread(function (news, images, allPreviews)
			{
				Object.assign(news, FileUpload.createToken('news', {"n_id": news.n_id}) );

				this.getRes().expose(FileUpload.exposeUploadOptions('news'), 'newsUploadOpts');

				let tplFile = "news";
				let tplData = { news: news, newsImages: images};
				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(news.n_title);
				this.view.setPageH1(news.n_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["news"], 'eventData');
				this.getRes().expose(tplData["newsImages"], 'newsImages');
				this.getRes().expose(allPreviews, 'newsImagesPreviews');

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * редактируем новость по его id
	 *
	 * @returns {Promise.<TResult>}
	 */
	editActionPost()
	{
		let tplFile = "news/edit.ejs";
		let tplData = this.getParsedBody();

		if (tplData["b_load_video_embed"])
		{
			return VideoEmbed.video(tplData, tplFile, this);
		}

		if (!tplData["i_news_id"] || !tplData["btn_save_news"])
			throw new Errors.HttpStatusError(404, "Not found");

		//console.log(tplData);
		switch(tplData["btn_save_news"])
		{
			case 'main':
				return this.editNews(tplData, tplFile);
				break;
			case 'sort_img':
				return this.sortImg(tplData, tplFile);
				break;

			case 'del_img':
				return this.delImg(tplData, tplFile);
				break;

			case 'del_news':
				return this.delNews(tplData, tplFile);
				break;
		}
	}

	editNews(tplData, tplFile)
	{
		return this.getClass('news').get(tplData["i_news_id"])
			.bind(this)
			.then(function (news)
			{
				if (!news)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(true);
			})
			.then(function ()
			{
				let errors = {};

				tplData = this.stripTags(tplData, ["dd_show_ts", "s_n_title","t_n_notice"]);

				tplData["t_n_text"] = this.cheerio(tplData["t_n_text"]).root().cleanTagEvents().html();

				if (!tplData["dd_show_ts"])
					errors["dd_show_ts"] = "Укажите дату новости";

				if (!tplData["s_n_title"])
					errors["s_n_title"] = "Укажите название новости";

				if (!tplData["t_n_notice"])
					errors["t_n_notice"] = "Укажите анонс новости";

				if (!tplData["t_n_text"])
					errors["t_n_text"] = "Укажите описание новости";
				
				return Promise.resolve([errors, tplData]);
			})
			.spread(function(errors, tplData)
			{
				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('news').edit(
					tplData["i_news_id"], this.getUserId(),
					tplData["s_n_title"], tplData["t_n_notice"], tplData["t_n_text"], tplData["dd_show_ts"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param tplData
	 */
	sortImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				if (!tplData["i_news_id"] || !tplData.hasOwnProperty("ni_pos") || !tplData["ni_pos"].length)
					return Promise.resolve(tplData);

				return this.getClass('news').sortImgUpd(tplData["i_news_id"], tplData["ni_pos"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * добавляем фотографи к событию
	 *
	 * @returns {*}
	 */
	uploadActionPost()
	{
		let self = this;
		let tplFile = 'news/news_images.ejs';
		let tplData = self.getParsedBody();

		this.getRes().on('cancelUploadedFile', function(file)
		{
			if (file["u_id"] && file["n_id"] && file["ni_id"])
				return self.getClass('news').delImage(file["u_id"], file["n_id"], file["ni_id"], file);
		});

		return self.getClass('news')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then(function (file)
			{
				//console.log(file);
				tplData = {
					n_id: file.n_id,
					ni_id: file.ni_id,
					ni_pos: file.ni_pos,
					ni_name: file.ni_name,
					ni_latitude: file.latitude,
					ni_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				self.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				self.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			});
	}

	/**
	 * удаление фотографии пользователем
	 *
	 * @param tplData
	 * @returns {*}
	 */
	delImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				if (!tplData["i_ni_id"])
					throw new Errors.HttpStatusError(400, 'Bad request');

				return this.getClass('news').delImage(this.getUserId(), tplData["i_news_id"], tplData["i_ni_id"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * удаление указанного новости
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise.<T>}
	 */
	delNews(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('news').delNews(this.getUserId(), tplData["i_news_id"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = News;