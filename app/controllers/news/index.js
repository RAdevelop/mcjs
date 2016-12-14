"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
const FileUpload = require('app/lib/file/upload');

const EmbedContent = require("app/lib/embed/content");

//const Moment = require('moment'); //работа со временем
const CtrlMain = require('app/lib/controller');

let limit_per_page = 20;

class News extends CtrlMain
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
				,'^\/?$': null
			},
			"upload": {
				'^\/?$': null
			}
		};
	}
	
	/**
	 * главная страница
	 *
	 * @returns {Promise}
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
	 * @returns {Promise}
	 * @throws Errors.HttpStatusError
	 */
	news(tplData, i_news_id, s_alias)
	{
		let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		return this.getClass('news')
			.get(i_news_id, show)
			.then((news) =>
			{
				if (!news || news["n_alias"] != s_alias)
					throw new Errors.HttpError(404);

				return Promise.resolve(news);
			})
			.then((news) =>
			{
				return this.getClass('news').getImageList(news.n_id)
					.spread((images, allPreviews) => {
						return Promise.resolve([news, images, allPreviews]);
					});
			})
			.spread((news, images, allPreviews) => {
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
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * список событий
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	newsList(tplData)
	{
		let {i_page=1} = this.routeArgs;
		let show = (this.getLocalAccess()['post_edit'] ? null : 1);

		return Promise.resolve(this.getClass("news")
			.getNews(new Pages(i_page, limit_per_page), show))
			.spread((newsList, Pages) =>
			{
				tplData["newsList"] = newsList;

				let exposeNews = 'newsList';
				Pages.setLinksUri(this.getBaseUrl())
					.setAjaxPagesType(true)
					.setAjaxDataSrc([exposeNews])
					.setAjaxDataTarget(exposeNews)
					.setJquerySelectorData('.newsListContainer .newsListItem');

				tplData["pages"] = Pages.pages();

				let isAjax = this.getReq().xhr;
				let tplFile = (isAjax ? 'news/list.ejs':'news');

				this.getRes().expose(newsList, exposeNews);
				this.getRes().expose(tplData["pages"], 'pages');

				this.view.setTplData(tplFile, tplData, isAjax);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(isAjax);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * форма добавления новости
	 * @returns {Promise}
	 */
	addActionGet()
	{
		let tplData = {
			news: {
				n_id: '',
				n_create_ts: '',
				n_update_ts: '',
				dt_show_ts: '',
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
	 * добавляем новость
	 *
	 * @returns {Promise}
	 */
	addActionPost()
	{
		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();
		let errors = {};

		tplData = CtrlMain.stripTags(tplData, ["dt_show_ts", "s_n_title","t_n_notice"]);

		tplData["t_n_text"] = CtrlMain.cheerio(tplData["t_n_text"]).root().cleanTagEvents().html();
		tplData["b_show"] = tplData["b_show"] || false;

		if (!tplData["dt_show_ts"])
			errors["dt_show_ts"] = "Укажите дату новости";

		if (!tplData["s_n_title"])
			errors["s_n_title"] = "Укажите название новости";

		if (!tplData["t_n_notice"])
			errors["t_n_notice"] = "Укажите анонс новости";

		if (!tplData["t_n_text"])
			errors["t_n_text"] = "Укажите описание новости";

		let tplFile = "news/edit.ejs";

		return Promise.resolve(errors)
			
			.then((errors) => {
				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) => {
				return this.getClass('news')
					.add(this.getUserId(), tplData["s_n_title"], tplData["t_n_notice"], tplData["t_n_text"], tplData["dt_show_ts"], tplData["b_show"])
					
					.then((i_news_id) => {
						tplData["i_news_id"] = i_news_id;
						return Promise.resolve(tplData);
					});
			})
			.then((tplData) => {
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, (err) => {
				//такие ошибки не уводят со страницы.
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * форма редактирования новости
	 * @returns {Promise}
	 */
	editActionGet()
	{
		let {i_news_id} = this.routeArgs;

		if (!i_news_id)
			throw new Errors.HttpError(404);

		let show = (this.getLocalAccess()['post_edit'] ? null : 1);

		return this.getClass('news').get(i_news_id, show)
			.then((news) => {

				if (!news)
					throw new Errors.HttpError(404);

				return this.getClass('news')
					.getImageList(news.n_id)
					.spread((images, allPreviews) => {
						return Promise.resolve([news, images, allPreviews]);
					});
			})
			.spread((news, images, allPreviews) => {

				if (this.getLocalAccess()['post_upload'])
				{
					Object.assign(news, FileUpload.createToken('news', {"n_id": news.n_id}) );
					this.getRes().expose(FileUpload.exposeUploadOptions('news'), 'newsUploadOpts');
				}

				let tplFile = "news";
				let tplData = { news: news, newsImages: images};
				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(news.n_title);
				this.view.setPageH1(news.n_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["news"], 'newsData');
				this.getRes().expose(tplData["newsImages"], 'newsImages');
				this.getRes().expose(allPreviews, 'newsImagesPreviews');

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * редактируем новость по его id
	 *
	 * @returns {Promise}
	 */
	editActionPost()
	{
		let tplFile = "news/edit.ejs";
		let tplData = this.getParsedBody();

		if (tplData["b_load_embed_content"])
			return EmbedContent.content(tplData, tplFile, this);

		if (!tplData["i_news_id"] || !tplData["btn_save_news"])
			throw new Errors.HttpError(404);

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

	/**
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	editNews(tplData, tplFile)
	{
		return this.getClass('news').get(tplData["i_news_id"])
			.then((news) => {
				if (!news)
					throw new Errors.HttpError(404);

				tplData = CtrlMain.stripTags(tplData, ["dt_show_ts", "s_n_title","t_n_notice"]);
				tplData["t_n_text"] = CtrlMain.cheerio(tplData["t_n_text"]).root().cleanTagEvents().html();
				tplData["b_show"] = tplData["b_show"] || false;

				let errors = {};
				if (!tplData["dt_show_ts"])
					errors["dt_show_ts"] = "Укажите дату новости";

				if (!tplData["s_n_title"])
					errors["s_n_title"] = "Укажите название новости";

				if (!tplData["t_n_notice"])
					errors["t_n_notice"] = "Укажите анонс новости";

				if (!tplData["t_n_text"])
					errors["t_n_text"] = "Укажите описание новости";
				
				return Promise.resolve([errors, tplData]);
			})
			.spread((errors, tplData) => {
				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) => {
				return this.getClass('news').edit(
					tplData["i_news_id"], this.getUserId(),
					tplData["s_n_title"], tplData["t_n_notice"], tplData["t_n_text"], tplData["dt_show_ts"], tplData["b_show"])
					.then(() => {

						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch(Errors.ValidationError, (err) => { //такие ошибки не уводят со страницы

				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	sortImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) => {

				if (!tplData["i_news_id"] || !tplData.hasOwnProperty("ni_pos") || !tplData["ni_pos"].length)
					return Promise.resolve(tplData);

				return this.getClass('news')
					.sortImgUpd(tplData["i_news_id"], tplData["ni_pos"])
					.then(() => {

						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * добавляем фотографи к событию
	 *
	 * @returns {Promise}
	 */
	uploadActionPost()
	{
		let tplFile = 'news/news_images.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) => {
			if (file["u_id"] && file["n_id"] && file["ni_id"])
				return this.getClass('news').delImage(file["u_id"], file["n_id"], file["ni_id"], file);
		});

		return this.getClass('news')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then((file) => {
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

				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch((err) => {
				//Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}

	/**
	 * удаление фотографии пользователем
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	delImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) => {

				if (!tplData["i_ni_id"])
					throw new Errors.HttpError(400);

				return this.getClass('news')
					.delImage(this.getUserId(), tplData["i_news_id"], tplData["i_ni_id"])
					.then(() => {
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * удаление указанного новости
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	delNews(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) => {

				return this.getClass('news')
					.delNews(this.getUserId(), tplData["i_news_id"])
					.then(() => {
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch((err) => {
				throw err;
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = News;