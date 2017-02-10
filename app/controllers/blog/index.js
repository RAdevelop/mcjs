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

class Blog extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?subj\/[1-9]+[0-9]*\/[a-z0-9-_]{3,}\/page\/[1-9]+[0-9]*\/?$': [,'ui_bs_id','s_bs_alias',, 'i_page']
				,'^\/?subj\/[1-9]+[0-9]*\/[a-z0-9-_]{3,}\/?$': [,'ui_bs_id','s_bs_alias']
				,'^\/?[1-9]+[0-9]*\/[a-z0-9-_]{3,}\/?$': ['i_blog_id','s_blog_alias']
				,"^\/?tag\/\\S+\/page\/[1-9]+[0-9]*\/?$" : ['b_tag','s_tag',,'i_page'] //по тегам
				,"^\/?tag\/\\S+\/?$" : ['b_tag','s_tag']
				,"^\/?page\/[1-9]+[0-9]*\/?$" : [ ,'i_page'] //список с постраничкой
				,'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_blog_id']
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
		//console.log('this.name', this.constructor.name);
		let {i_u_id=null, i_blog_id=null, s_blog_alias=null, ui_bs_id=null, s_bs_alias=null, b_draft=false
			, b_tag=null, s_tag=null
		} = this.routeArgs;

		b_draft = !!b_draft;
		b_tag = !!b_tag;

		let tplData = {
			blog: null,
			blogList: null,
			blogDraft:b_draft
		};

		if (i_blog_id)
			return this.blog(tplData, i_blog_id, s_blog_alias, i_u_id);

		if (b_tag)
		{
			s_tag = decodeURIComponent(s_tag);
			return this.tagBlogList(tplData, s_tag);
		}

		return this.blogList(tplData, i_u_id, ui_bs_id, s_bs_alias, b_draft);
	}

	tagBlogList(tplData, s_tag)
	{
		let {i_page=1} = this.routeArgs;

		return Promise.all([
			this.getClass("blog")
				.getBlogListByTag(new Pages(i_page, limit_per_page), s_tag),
			this.getUser(),
			this.getClass('blog').getBlogSubjectList()
		])
			.spread((blog, user, blogSubjects) =>
			{
				tplData['user'] = {u_id: null};
				tplData["blogSubjects"] = blogSubjects;

				if(!blog[0] || blog[0].length == 0)
					return Promise.resolve([[], blog[1]]);

				let u_ids = blog[0].map((u)=>
				{
					return u['u_id'];
				});

				return this.getClass('user').getUserListById(u_ids, blog[0])
					.spread((users, blogList)=>
					{
						users = null;
						return Promise.resolve([blogList, blog[1]]);
					});
			})
			.spread((blogList, Pages) =>
			{
				let isAjax = this.getReq().xhr;

				if (!isAjax)
				{
					let pageTitle = [];

					if (tplData['user'] && tplData['user']['u_id'])
						pageTitle.push(tplData['user']['u_display_name']+':');

					if (tplData["blogSubjects"]['selected'])
						pageTitle.push(tplData["blogSubjects"]['selected']['bs_name']);

					pageTitle = pageTitle.join(' ');
					this.view.setPageTitle(pageTitle);
					this.view.setPageH1(pageTitle);
				}
				tplData["blogList"] = blogList;

				let exposeBlog = 'blogList';
				//let baseUrl = (i_u_id ? [this.getBaseUrl(), i_u_id].join('/') : this.getBaseUrl());
				let baseUrl = [this.getBaseUrl(), 'tag', s_tag];

				/*
				if (i_u_id)
					baseUrl.push(i_u_id);
				if (ui_bs_id && s_bs_alias)
					baseUrl.push('subj', ui_bs_id, s_bs_alias);*/

				baseUrl = baseUrl.join('/');
				Pages.setLinksUri(baseUrl)
					.setAjaxPagesType(true);

				tplData["pages"] = Pages.pages();

				let tplFile = (isAjax ? 'blog/list.ejs':'blog');

				this.getRes().expose(blogList, exposeBlog);
				this.getRes().expose(tplData["pages"], 'pages');

				this.view.setTplData(tplFile, tplData, isAjax);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(isAjax);
			});
	}

	/**
	 * выбранная статья блога
	 *
	 * @param tplData
	 * @param i_blog_id
	 * @param s_alias
	 * @param i_u_id
	 * @returns {Promise}
	 * @throws Errors.HttpStatusError
	 */
	blog(tplData, i_blog_id, s_alias, i_u_id=null)
	{
		//let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		
		return this._getBlogData(i_blog_id, i_u_id)
			.spread((isRootAdmin, blog, user, blogSubjects)=>
			{
				if (
					blog && blog["b_alias"] == s_alias
					&& (isRootAdmin || blog['u_id'] == this.getUserId() || blog['b_show'] == 1)
				)
				{
					tplData["user"] = (i_u_id ? user : {u_id: null});
					tplData["blogSubjects"] = blogSubjects;
					return Promise.resolve(blog);
				}

				throw new Errors.HttpError(404);
			})
			.then((blog) =>
			{
				return this.getClass('blog').getImageList(blog['b_id'])
					.spread((images, allPreviews) =>
					{
						return Promise.resolve([blog, images, allPreviews]);
					});
			})
			.spread((blog, images, allPreviews) =>
			{
				blog["blogImages"] = images;
				blog["blogImagesPreviews"] = allPreviews;

				let tplFile = "blog";

				tplData["blog"] = blog;
				tplData["blogImages"] = blog["blogImages"];

				this.view.setPageTitle(blog["b_title"]);
				this.view.setPageDescription(blog["b_notice"]);

				if (blog["blogImages"] && blog["blogImages"][0] && blog["blogImages"][0]["previews"]["512_384"])
					this.view.setPageOgImage(blog["blogImages"][0]["previews"]["512_384"]);

				if (!!tplData["blogSubjects"]['selected']['bs_id'])
				{
					this.view.setPageH1(tplData["blogSubjects"]['selected']['bs_name']);
				}
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["blog"], 'blogData');
				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			});
	}

	/**
	 * список статей
	 *
	 * @param tplData
	 * @param i_u_id
	 * @param ui_bs_id
	 * @param s_bs_alias
	 * @returns {Promise}
	 */
	blogList(tplData, i_u_id=null, ui_bs_id=null, s_bs_alias=null, b_draft=false)
	{
		let {i_page=1} = this.routeArgs;
		//let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		let show = (i_u_id==this.getUserId() ? null : 1);

		if (b_draft && i_u_id!=this.getUserId())
			throw new Errors.HttpError(404);
		else if (b_draft && i_u_id==this.getUserId())
			show = 0;

		return Promise.all([
			this.getClass("blog")
				.getBlogList(new Pages(i_page, limit_per_page), show, i_u_id, ui_bs_id, s_bs_alias),
			this.getUser(i_u_id),
			this.getClass('blog').getBlogSubjectList(ui_bs_id, i_u_id, show)
		])
			.spread((blog, user, blogSubjects) =>
			{
				tplData['user'] = user;
				tplData["blogSubjects"] = blogSubjects;

				if(!blog[0] || blog[0].length == 0)
					return Promise.resolve([[], blog[1]]);

				let u_ids = blog[0].map((u)=>
				{
					return u['u_id'];
				});

				return this.getClass('user').getUserListById(u_ids, blog[0])
					.spread((users, blogList)=>
					{
						users = null;
						return Promise.resolve([blogList, blog[1]]);
					});
			})
			.spread((blogList, Pages) =>
			{
				let isAjax = this.getReq().xhr;

				if (!isAjax)
				{
					let pageTitle = [];

					if (tplData['user'] && tplData['user']['u_id'])
						pageTitle.push(tplData['user']['u_display_name']+':');

					if (tplData["blogSubjects"]['selected'])
						pageTitle.push(tplData["blogSubjects"]['selected']['bs_name']);

					pageTitle = pageTitle.join(' ');
					this.view.setPageTitle(pageTitle);
					this.view.setPageH1(pageTitle);
				}
				tplData["blogList"] = blogList;

				let exposeBlog = 'blogList';
				//let baseUrl = (i_u_id ? [this.getBaseUrl(), i_u_id].join('/') : this.getBaseUrl());
				let baseUrl = [this.getBaseUrl()];

				if (i_u_id)
					baseUrl.push(i_u_id);
				if (ui_bs_id && s_bs_alias)
					baseUrl.push('subj', ui_bs_id, s_bs_alias);

				baseUrl = baseUrl.join('/');
				Pages.setLinksUri(baseUrl)
					.setAjaxPagesType(true);

				tplData["pages"] = Pages.pages();

				let tplFile = (isAjax ? 'blog/list.ejs':'blog');

				this.getRes().expose(blogList, exposeBlog);
				this.getRes().expose(tplData["pages"], 'pages');

				this.view.setTplData(tplFile, tplData, isAjax);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

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
			blog: {
				b_id: '',
				b_create_ts: '',
				b_update_ts: '',
				b_title: '',
				b_notice: '',
				b_text: '',
				kw_names: [],
				u_id: ''
			},
			user: {u_id: this.getUserId()},
			blogDraft: false
		};
		return Promise.all([
			this.getClass('keywords').getKeyWordList(),
			this.getClass('blog').getBlogSubjectList()
		])
			.spread((keywords, blogSubjects)=>
			{
				tplData['blogSubjects'] = blogSubjects;

				//экспрот данных в JS на клиента
				this.getRes().expose(keywords, 'keyWords');

				let tplFile = "blog";
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(null);
			});
	}

	/**
	 * добавляем
	 *
	 * @returns {Promise}
	 */
	addActionPost()
	{
		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();
		let tplFile = "blog/edit.ejs";

		if (tplData["b_load_embed_content"])
			return EmbedContent.content(tplData, tplFile, this);

		let errors = {};

		tplData = CtrlMain.stripTags(tplData, ["s_b_title","t_b_notice",'s_tags']);

		tplData["t_b_text"] = CtrlMain.cheerio(tplData["t_b_text"]).root().cleanTagEvents().html();
		tplData["b_show"] = tplData["b_show"] || false;
		
		if (!tplData["ui_bs_id"] || tplData["ui_bs_id"] == 0)
			errors["ui_bs_id"] = "Укажите тему";

		if (!tplData["s_b_title"])
			errors["s_b_title"] = "Укажите название";

		if (!tplData["t_b_notice"])
			errors["t_b_notice"] = "Укажите анонс";

		if (!tplData["t_b_text"])
			errors["t_b_text"] = "Укажите описание";

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('blog')
						.add(this.getUserId(), tplData["s_b_title"],
							tplData["t_b_notice"], tplData["t_b_text"],
							tplData["ui_bs_id"], tplData["b_show"]
						)
						.then((blog)=>
						{
							return this.getClass('keywords').saveKeyWords(
									this.getClass('blog').constructor.keyWordsObjName, tplData['s_tags'],
									blog['b_id'], blog['b_show'], blog['b_create_ts']
								).then(()=>
								{
									return Promise.resolve(blog['b_id']);
								});
						})
						.then((i_blog_id)=>
						{
							process.nextTick(()=>
							{
								const Mailer = new Mail(CtrlMain.appConfig.mail.service);

								let title = 'Добавлена статья в блог на сайте www.MotoCommunity.ru';
								let sendParams = {
									//to:         '',
									subject:    title,
									tplName:    'blog/new',
									tplData: {
										title: title,
										links: 'https://'+this.getHostPort(),
										link: 'http://'+this.getHostPort(),
										link_to: this.getMenuItem['m_path']+'/edit/'+i_blog_id
									}
								};

								Mailer.send(sendParams,  (err) =>
								{
									if(err)
										Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
								});
							});
							tplData["i_blog_id"] = i_blog_id;
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
	 * форма редактирования
	 * @returns {Promise}
	 */
	editActionGet()
	{
		let {i_blog_id} = this.routeArgs;

		if (!i_blog_id)
			throw new Errors.HttpError(404);

		//let show = (this.getLocalAccess()['post_edit'] ? null : 1);

		return this._getBlogData(i_blog_id)
			.spread((isRootAdmin, blog, user, blogSubjects)=>
			{
				if (!blog || !(isRootAdmin || blog['u_id'] == this.getUserId()))
					throw new Errors.HttpError(404);

				return Promise.all([
					this.getClass('keywords').getKeyWordList(),
					this.getClass('blog').getImageList(blog['b_id'])
				])
					.spread((keywords, imagesData) =>
					{
						if (this.getLocalAccess()['post_upload'])
						{
							let uploadTypeConf = 'user_blog';
							Object.assign(blog, FileUpload.createToken(uploadTypeConf, {"b_id": blog.b_id, "u_id": blog.u_id}) );
							this.getRes().expose(FileUpload.exposeUploadOptions(uploadTypeConf), 'blogUploadOpts');
						}

						let tplFile = "blog";
						let tplData = {
							blogDraft: '',
							blog: blog,
							blogImages: imagesData[0],
							user: {u_id: blog['u_id']}, //user
							blogSubjects: blogSubjects
						};

						this.view.setTplData(tplFile, tplData);

						this.view.setPageTitle(blog.b_title);
						this.view.setPageH1(blog.b_title);
						//экспрот данных в JS на клиента
						this.getRes().expose(tplData["blog"], 'blogData');
						this.getRes().expose(tplData["blogImages"], 'blogImages');
						this.getRes().expose(imagesData[1], 'blogImagesPreviews');
						this.getRes().expose(keywords, 'keyWords');

						return Promise.resolve(null);
					});
			});
	}

	/**
	 * редактируем блог по его id
	 *
	 * @returns {Promise}
	 */
	editActionPost()
	{
		let tplFile = "blog/edit.ejs";
		let tplData = this.getParsedBody();

		if (tplData["b_load_embed_content"])
			return EmbedContent.content(tplData, tplFile, this);

		if (!tplData["i_blog_id"] || !tplData["btn_save_blog"])
			throw new Errors.HttpError(404);

		return this._getBlogData(tplData["i_blog_id"])
			.spread((isRootAdmin, blog)=>
			{
				if (!blog || !(isRootAdmin || blog['u_id'] == this.getUserId()))
					throw new Errors.HttpError(404);
				
				switch(tplData["btn_save_blog"])
				{
					default:
						throw new Errors.HttpError(401);
						break;
					case 'main':
						return this.editBlog(tplData, tplFile, blog);
						break;
					case 'sort_img':
						return this.sortImg(tplData, tplFile);
						break;

					case 'del_img':
						return this.delImg(tplData, tplFile);
						break;

					case 'del_blog':
						return this.delBlog(tplData, tplFile);
						break;
				}
			});
	}

	/**
	 *
	 * @param tplData
	 * @param tplFile
	 * @param blog
	 * @returns {Promise}
	 */
	editBlog(tplData, tplFile, blog)
	{
		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				tplData = CtrlMain.stripTags(tplData, ["s_b_title","t_b_notice",'s_tags']);
				tplData["t_b_text"] = CtrlMain.cheerio(tplData["t_b_text"]).root().cleanTagEvents().html();
				tplData["b_show"] = tplData["b_show"] || false;

				let errors = {};

				if (!tplData["ui_bs_id"] || tplData["ui_bs_id"] == 0)
					errors["ui_bs_id"] = "Укажите тему";

				if (!tplData["s_b_title"])
					errors["s_b_title"] = "Укажите название";

				if (!tplData["t_b_notice"])
					errors["t_b_notice"] = "Укажите анонс";

				if (!tplData["t_b_text"])
					errors["t_b_text"] = "Укажите описание";

				if (this.parseFormErrors(tplData, errors))
					return Promise.resolve(tplData);
			})
			.then((tplData) =>
			{
				return Promise.all([
					this.getClass('blog').edit(
						blog['b_id'], blog['u_id'], tplData["s_b_title"], tplData["t_b_notice"],
						tplData["t_b_text"], tplData["ui_bs_id"],
						tplData["b_show"], tplData['s_tags']
					),
					this.getClass('keywords')
						.saveKeyWords(
							this.getClass('blog').constructor.keyWordsObjName, tplData['s_tags'],
							blog['b_id'], tplData['b_show'], blog['b_create_ts']
						)
				])
					.then(() =>
					{
						process.nextTick(()=>
						{
							const Mailer = new Mail(CtrlMain.appConfig.mail.service);

							let title = 'Изменена статья в блоге на сайте www.MotoCommunity.ru';
							let sendParams = {
								//to:         '',
								subject:    title,
								tplName:    'blog/new',
								tplData: {
									title: title,
									links: 'https://'+this.getHostPort(),
									link: 'http://'+this.getHostPort(),
									link_to: this.getMenuItem['m_path']+'/edit/'+blog['b_id']
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
			.catch(Errors.ValidationError, (err) => { //такие ошибки не уводят со страницы

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
	sortImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				if (!tplData["i_blog_id"] || !tplData.hasOwnProperty("bi_pos") || !tplData["bi_pos"].length)
					return Promise.resolve(tplData);

				return this.getClass('blog').sortImgUpd(tplData["i_blog_id"], tplData["bi_pos"])
					.then(() =>
					{
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			});
	}

	/**
	 * добавляем фотографи
	 *
	 * @returns {Promise}
	 */
	uploadActionPost()
	{
		let tplFile = 'blog/blog_images.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) =>
		{
			if (file["u_id"] && file["b_id"] && file["bi_id"])
				return this.getClass('blog').delImage(file["u_id"], file["b_id"], file["bi_id"], file);
		});

		return this.getClass('blog')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then((file) =>
			{
				//console.log(file);
				tplData = {
					b_id: file.b_id,
					bi_id: file.bi_id,
					bi_pos: file.bi_pos,
					bi_name: file.bi_name,
					bi_latitude: file.latitude,
					bi_longitude: file.longitude,
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
	 * удаление фотографии пользователем
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	delImg(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				if (!tplData["i_bi_id"])
					throw new Errors.HttpError(400);

				return this.getClass('blog')
					.delImage(this.getUserId(), tplData["i_blog_id"], tplData["i_bi_id"])
					.then(() =>
					{
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			});
	}

	/**
	 * удаление
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	delBlog(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				return this.getClass('blog').delBlog(this.getUserId(), tplData["i_blog_id"])
					.then(() =>
					{
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			});
	}

	_getBlogData(b_id, i_u_id=null)
	{
		return Promise.all([
			this.getClass('user/groups').isRootAdmin(this.getUserId()),
			this.getClass('blog').getBlogById(b_id, i_u_id)
		])
			.spread((isRootAdmin, blog)=>
			{
				if (!blog)
					throw new Errors.HttpError(404);

				let u_id = (!i_u_id && blog['u_id'] ? blog['u_id'] : i_u_id);

				return Promise.all([
					this.getUser(u_id),
					this.getClass('blog').getBlogSubjectList(blog['bs_id'], i_u_id)
				])
					.spread((user, blogSubjects)=>
					{
						blog["user"] = user;
						return Promise.resolve([isRootAdmin, blog, user, blogSubjects]);
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Blog;