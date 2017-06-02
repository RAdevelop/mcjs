"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
const FileUpload = require('app/lib/file/upload');
const Mail = require('app/lib/mail');

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
	static routePaths()
	{
		return {
			"index": {
				'^\/?$': null
				,"^\/?tag\/\\S+\/page\/[1-9]+[0-9]*\/?$" : ['b_tag','s_tag',,'i_page'] //по тегам
				,"^\/?tag\/\\S+\/?$" : ['b_tag','s_tag']
				,'^\/?[0-9]+\/\\S+\/?$': ['i_news_id','s_news_alias']
				,"^\/?page\/[1-9]+[0-9]*\/?$" : [ ,'i_page'] //список с постраничкой
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
			},
			"comment": {
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
		this.view.useCache(true);
		
		let tplData = {
			news: null,
			newsList: null
		};
		
		let {i_news_id=null, s_news_alias=null, b_tag=null, s_tag=null} = this.routeArgs;
		b_tag = !!b_tag;
		
		if (i_news_id)
			return this._news(tplData, i_news_id, s_news_alias);
		
		if (b_tag)
		{
			s_tag = decodeURIComponent(s_tag);
			return this._tagNewsList(tplData, s_tag);
		}
		
		return this._newsList(tplData);
	}
	
	_tagNewsList(tplData, s_tag)
	{
		let {i_page=1} = this.routeArgs;

		return this.getClass('news').getNewsListByTag(new Pages(i_page, limit_per_page), s_tag)
			.spread((newsList, Pages) =>
			{
				tplData['newsList'] = newsList;

				let baseUrl = [this.getBaseUrl(), 'tag', s_tag];

				baseUrl = baseUrl.join('/');
				Pages.setLinksUri(baseUrl);

				tplData['pages'] = Pages.pages();

				let isAjax = this.getReq().xhr;
				let tplFile = (isAjax ? 'news/list.ejs':'news');

				this.view.setTplData(tplFile, tplData, isAjax);

				if (!isAjax)
				{
					this.getRes().expose(newsList, 'newsList');
					this.getRes().expose(tplData['pages'], 'pages');

					//this.view.addPartialData("user/left", {user: userData});
					//this.view.addPartialData("user/right", {title: 'right_col'});
				}

				return Promise.resolve(isAjax);
			});
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
	_news(tplData, i_news_id, s_alias)
	{
		let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		let isAjax = this.getReq().xhr;
		let {i_page=1} = this.routeArgs;
		
		return Promise.join(
			this.getClass('user/groups').isRootAdmin(this.getUserId()),
			this.getClass('news').get(i_news_id, show)
		, (isRootAdmin, news)=>
			{
				if (!news || news['n_alias'] != s_alias)
					throw new Errors.HttpError(404);
				
				return Promise.join(
					(isAjax ? [[],[]] : this.getClass('news').getFileList(news['n_id'])),
					this.getClass('comment').getCommentList(this, this.getClass('news'), isRootAdmin, news['n_id'], new Pages(i_page, limit_per_page))
					, (images, comments)=>
					{
						return Promise.resolve([news, images[0], images[1], comments]);
					})
				.spread((news, images, allPreviews, comments) =>
				{
					news['newsImages'] = images;
					news['newsImagesPreviews'] = allPreviews;
					
					let tplFile = 'news';
					
					tplData['news'] = news;
					tplData['newsImages'] = news['newsImages'];
					
					tplData['comments'] = this.getClass('comment')
					.commentsData(news['n_id'], comments[0], comments[1].getTotal());
					
					comments[1].setLinksUri(this.getOriginalUrl());
					tplData['pages'] = comments[1].pages();
					
					if (!isAjax)
					{
						this.view.setPageTitle(news['n_title']);
						this.view.setPageDescription(news['n_notice']);
						
						if (news['newsImages'] && news['newsImages'][0] && news['newsImages'][0]['previews']['512_384'])
							this.view.setPageOgImage(news['newsImages'][0]['previews']['512_384']);
						
						//this.view.setPageH1(news.n_title);
						//экспрот данных в JS на клиента
						this.getRes().expose(tplData['news'], 'newsData');
						this.getRes().expose(tplData['comments']['list'], 'comments');
						this.getRes().expose(tplData['pages'], 'pages');
					}
					
					this.view.setTplData(tplFile, tplData, isAjax);
					return Promise.resolve(isAjax);
				});
			});
	}

	/**
	 * список новостей
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_newsList(tplData)
	{
		let {i_page=1} = this.routeArgs;
		let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		
		return this.getClass('news').getNews(new Pages(i_page, limit_per_page), show)
			.spread((newsList, Pages) =>
			{
				tplData['newsList'] = newsList;
				
				let exposeNews = 'newsList';
				Pages.setLinksUri(this.getBaseUrl());
				
				tplData['pages'] = Pages.pages();
				
				let isAjax = this.getReq().xhr;
				let tplFile = (isAjax ? 'news/list.ejs':'news');
				
				this.view.setTplData(tplFile, tplData, isAjax);
				
				if (!isAjax)
				{
					this.getRes().expose(newsList, exposeNews);
					this.getRes().expose(tplData['pages'], 'pages');
					
					//this.view.addPartialData("user/left", {user: userData});
					//this.view.addPartialData("user/right", {title: 'right_col'});
				}
				
				return Promise.resolve(isAjax);
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
				u_id: '',
				kw_names: []
			}
		};

		return this.getClass('keywords').getKeyWordList()
			.then((keywords)=>
			{
				let tplFile = 'news';
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(keywords, 'keyWords');

				return Promise.resolve(null);
			});
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
		let tplFile = 'news/edit.ejs';
		
		if (tplData['b_load_embed_content'])
			return EmbedContent.content(tplData, tplFile, this);

		let errors = {};

		tplData = CtrlMain.stripTags(tplData, ['dt_show_ts', 's_n_title','t_n_notice','s_tags']);

		tplData['t_n_text'] = CtrlMain.cheerio(tplData['t_n_text']).root().cleanTagEvents().html();
		tplData['b_show'] = tplData['b_show'] || false;

		if (!tplData['dt_show_ts'])
			errors['dt_show_ts'] = "Укажите дату новости";

		if (!tplData['s_n_title'])
			errors['s_n_title'] = "Укажите название новости";

		if (!tplData['t_n_notice'])
			errors['t_n_notice'] = "Укажите анонс новости";

		if (!tplData['t_n_text'])
			errors['t_n_text'] = "Укажите описание новости";

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('news')
						.add(this.getUserId(), tplData['s_n_title'], tplData['t_n_notice'], tplData['t_n_text'], tplData['dt_show_ts'], tplData['b_show'])
						.then((news)=>
						{
							return this.getClass('keywords').saveKeyWords(
								this.getClass('news'), news['n_id'], tplData['s_tags'],
								news['n_show'], news['n_create_ts']
							)
								.then(()=>
								{
									return Promise.resolve(news['n_id']);
								});
						})
						.then((i_news_id)=>
						{
							process.nextTick(()=>
							{
								const Mailer = new Mail(CtrlMain.appConfig.mail.service);

								let title = 'Добавлена новость на сайте www.MotoCommunity.ru';
								let sendParams = {
									//to:         '',
									subject:    title,
									tplName:    'news/new',
									tplData: {
										title: title,
										links: 'https://'+this.getHostPort(),
										link: 'http://'+this.getHostPort(),
										link_to: [this.getMenuItem['m_path'],'edit',i_news_id].join('/')
									}
								};

								Mailer.send(sendParams,  (err) =>
								{
									if(err)
										Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
								});
							});
							tplData['i_news_id'] = i_news_id;
							return Promise.resolve(tplData);
						});
				}
			})
			.then((tplData) =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, (err) =>
			{
				//такие ошибки не уводят со страницы.
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
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
			.then((news) =>
			{
				if (!news)
					throw new Errors.HttpError(404);
				
				return Promise.all([
					this.getClass('keywords').getKeyWordList(),
					this.getClass('news').getFileList(news['n_id'])
				])
					.spread((keywords, imageData) =>
					{
						return Promise.resolve([news, keywords, imageData]);
					});
			})
			.spread((news, keywords, imageData) =>
			{
				if (this.getLocalAccess()['post_upload'])
				{
					let uploadConfigName = this.getClass('news').constructor.uploadConfigName;
					
					Object.assign(news, FileUpload.createToken(uploadConfigName, {'n_id': news['n_id']}));
					this.getRes().expose(FileUpload.exposeUploadOptions(uploadConfigName), 'newsUploadOpts');
				}
				
				let tplFile = "news";
				let tplData = {
					news: news,
					newsImages: imageData[0] //images
				};
				
				this.view.setTplData(tplFile, tplData);
				
				this.view.setPageTitle(news.n_title);
				this.view.setPageH1(news.n_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData['news'], 'newsData');
				this.getRes().expose(tplData['newsImages'], 'newsImages');
				this.getRes().expose(imageData[1], 'newsImagesPreviews'); //allPreviews
				this.getRes().expose(keywords, 'keyWords');

				return Promise.resolve(null);
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

		if (tplData['b_load_embed_content'])
			return EmbedContent.content(tplData, tplFile, this);

		if (!tplData['i_news_id'] || !tplData['btn_save_news'])
			throw new Errors.HttpError(404);

		return this.getClass('news').get(tplData['i_news_id'] )
			.then((news)=>
			{
				if (!news)
					throw new Errors.HttpError(404);
				
				switch(tplData['btn_save_news'])
				{
					default :
						throw new Errors.HttpError(404);
						break;
					
					case 'main':
						return this._editNews(tplData, tplFile, news);
						break;
					case 'sort_img':
						return this._sortImg(tplData, tplFile);
						break;
					
					case 'del_img':
						return this._delFile(tplData, tplFile);
						break;
					
					case 'del_news':
						return this._delNews(tplData, tplFile, news);
						break;
				}
			});
	}

	/**
	 *
	 * @param tplData
	 * @param tplFile
	 * @param news
	 * @returns {Promise}
	 */
	_editNews(tplData, tplFile, news)
	{
		return this.getClass('news')
			.get(tplData['i_news_id'])
			.then((news) =>
			{
				if (!news)
					throw new Errors.HttpError(404);

				tplData = CtrlMain.stripTags(tplData, ['dt_show_ts', 's_n_title', 't_n_notice', 's_tags']);
				tplData['t_n_text'] = CtrlMain.cheerio(tplData['t_n_text']).root().cleanTagEvents().html();
				tplData['b_show'] = tplData['b_show'] || false;

				let errors = {};
				if (!tplData['dt_show_ts'])
					errors['dt_show_ts'] = "Укажите дату новости";

				if (!tplData['s_n_title'])
					errors['s_n_title'] = "Укажите название новости";

				if (!tplData['t_n_notice'])
					errors['t_n_notice'] = "Укажите анонс новости";

				if (!tplData['t_n_text'])
					errors['t_n_text'] = "Укажите описание новости";

				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) =>
			{
				return this.getClass('news').edit(
					news['n_id'], this.getUserId(),
					tplData['s_n_title'], tplData['t_n_notice'], tplData['t_n_text'], tplData['dt_show_ts'], tplData['b_show']
				)
					.then(() =>
					{
						return this.getClass('keywords').saveKeyWords(
							this.getClass('news'), news['n_id'], tplData['s_tags'],
							tplData['b_show'], news['n_create_ts']
						)
							.then(()=>
							{
								return Promise.resolve(news);
							});
					})
					.then((news) =>
					{
						process.nextTick(()=>
						{
							const Mailer = new Mail(CtrlMain.appConfig.mail.service);

							let title = 'Изменена новость на сайте www.MotoCommunity.ru';
							let sendParams = {
								//to:         '',
								subject:    title,
								tplName:    'news/new',
								tplData: {
									title: title,
									links: 'https://'+this.getHostPort(),
									link: 'http://'+this.getHostPort(),
									link_to: [this.getMenuItem['m_path'],'edit',news['n_id']].join('/')
								}
							};
							
							Mailer.send(sendParams,  (err) =>
							{
								if(err)
									Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
							});
						});
						
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch(Errors.ValidationError, (err) =>
			{ //такие ошибки не уводят со страницы
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	_sortImg(tplData, tplFile)
	{
		if (!tplData['i_news_id'] || !tplData.hasOwnProperty('file_pos') || !tplData['file_pos'].length)
			throw new Errors.HttpError(400);
		
		return this.getClass('news').sortImgUpd(tplData['i_news_id'], tplData['file_pos'])
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}
	
	/**
	 * добавляем фотографи к новости
	 *
	 * @returns {Promise}
	 */
	uploadActionPost()
	{
		let tplFile = 'news/news_images.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) =>
		{
			if (file['u_id'] && file['n_id'] && file['f_id'])
				return this.getClass('news').delFile(file['u_id'], file['n_id'], file['f_id'], file);
		});
		
		return this.getClass('news').uploadFile(this.getUserId(), this.getReq(), this.getRes())
			.then((file) =>
			{
				//console.log(__dirname , file);
				tplData = {
					n_id: file.n_id,
					f_id: file.f_id,
					f_pos: file.f_pos,
					f_name: file.f_name,
					f_type: file.type,
					f_latitude: file.latitude,
					f_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch((err) =>
			{
				//Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}

	/**
	 * удаление файла пользователем
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	_delFile(tplData, tplFile)
	{
		if (!tplData['i_f_id'])
			throw new Errors.HttpError(400);
		
		return this.getClass('news').delFile(this.getUserId(), tplData['i_news_id'], tplData['i_f_id'])
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}

	/**
	 * удаление указанной новости
	 *
	 * @param tplData
	 * @param tplFile
	 * @param news
	 * @returns {Promise}
	 */
	_delNews(tplData, tplFile, news)
	{
		return this.getClass('news').delNews(news)
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}
	
	/**
	 * обработка запросов по работе с комментариями
	 * @returns {Promise}
	 */
	commentActionPost()
	{
		return this.getClass('comment').commentActionPost(this, this.getClass('news'));
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = News;