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
				'^\/?[0-9]+\/\\S+\/?$': ['i_blog_id','s_blog_alias']
				,"^\/?page\/[1-9]+[0-9]*\/?$" : [ ,"i_page"] //список с постраничкой
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
		let tplData = {
			blog: null,
			blogList: null
		};

		let {i_blog_id=null, s_blog_alias=null} = this.routeArgs;

		if (i_blog_id)
			return this.blog(tplData, i_blog_id, s_blog_alias);

		return this.blogList(tplData);
	}

	/**
	 * выбранная статья блога
	 *
	 * @param tplData
	 * @param i_blog_id
	 * @param s_alias
	 * @returns {Promise}
	 * @throws Errors.HttpStatusError
	 */
	blog(tplData, i_blog_id, s_alias)
	{
		//let show = (this.getLocalAccess()['post_edit'] ? null : 1);

		return this._getBlogData(i_blog_id)
			.then((props)=>
			{
				if (
					props.blog && props.blog["b_alias"] == s_alias
					&&  (props.isRootAdmin || props.blog['u_id'] == this.getUserId() || props.blog['b_show'] == 1)
				)
				{
					return this.getUser(props.blog['u_id'])
						.then((user)=>
						{
							props.blog['user'] = user;
							return Promise.resolve(props.blog);
						});
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

				//this.view.setPageH1(blog.b_title);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["blog"], 'blogData');
				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			});
	}

	/**
	 * список событий
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	blogList(tplData)
	{
		let {i_page=1} = this.routeArgs;
		//let show = (this.getLocalAccess()['post_edit'] ? null : 1);
		let show = 1;

		return Promise.resolve(this.getClass("blog")
			.getBlogList(new Pages(i_page, limit_per_page), show))
			.spread((blogList, Pages) =>
			{
				let u_ids = blogList.map((blog)=>
				{
					return blog['u_id'];
				});

				return this.getClass('user').getUserListById(u_ids, blogList)
					.spread((users, blogList)=>
					{
						users = null;
						return Promise.resolve([blogList, Pages]);
					});
			})
			.spread((blogList, Pages) =>
			{
				tplData["blogList"] = blogList;

				let exposeBlog = 'blogList';
				Pages.setLinksUri(this.getBaseUrl())
					.setAjaxPagesType(true)
					.setAjaxDataSrc([exposeBlog])
					.setAjaxDataTarget(exposeBlog)
					.setJquerySelectorData('.blogListContainer .blogListItem');

				tplData["pages"] = Pages.pages();

				let isAjax = this.getReq().xhr;
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
				u_id: ''
			}
		};

		let tplFile = "blog";
		this.view.setTplData(tplFile, tplData);
		return Promise.resolve(null);
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

		tplData = CtrlMain.stripTags(tplData, ["s_b_title","t_b_notice"]);

		tplData["t_b_text"] = CtrlMain.cheerio(tplData["t_b_text"]).root().cleanTagEvents().html();
		tplData["b_show"] = tplData["b_show"] || false;
		
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
						.add(this.getUserId(), tplData["s_b_title"], tplData["t_b_notice"], tplData["t_b_text"], tplData["b_show"])
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
			.then((props) =>
			{
				if (!props.blog || !(props.isRootAdmin || blog['u_id'] == this.getUserId()))
					throw new Errors.HttpError(404);

				return this.getClass('blog')
					.getImageList(props.blog['b_id'])
					.spread((images, allPreviews) =>
					{
						return Promise.resolve([props.blog, images, allPreviews]);
					});
			})
			.spread((blog, images, allPreviews) =>
			{
				if (this.getLocalAccess()['post_upload'])
				{
					let uploadTypeConf = 'user_blog';
					Object.assign(blog, FileUpload.createToken(uploadTypeConf, {"b_id": blog.b_id, "u_id": blog.u_id}) );
					this.getRes().expose(FileUpload.exposeUploadOptions(uploadTypeConf), 'blogUploadOpts');
				}

				let tplFile = "blog";
				let tplData = { blog: blog, blogImages: images};
				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(blog.b_title);
				this.view.setPageH1(blog.b_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["blog"], 'blogData');
				this.getRes().expose(tplData["blogImages"], 'blogImages');
				this.getRes().expose(allPreviews, 'blogImagesPreviews');

				return Promise.resolve(null);
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
			.then((props) =>
			{
				if (!props.blog || !(props.isRootAdmin || props.blog['u_id'] == this.getUserId()))
					throw new Errors.HttpError(404);

				switch(tplData["btn_save_blog"])
				{
					default:
						throw new Errors.HttpError(401);
						break;
					case 'main':
						return this.editBlog(tplData, tplFile);
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
	 * @returns {Promise}
	 */
	editBlog(tplData, tplFile)
	{
		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				tplData = CtrlMain.stripTags(tplData, ["s_b_title","t_b_notice"]);
				tplData["t_b_text"] = CtrlMain.cheerio(tplData["t_b_text"]).root().cleanTagEvents().html();
				tplData["b_show"] = tplData["b_show"] || false;

				let errors = {};

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
				return this.getClass('blog').edit(
					tplData["i_blog_id"], this.getUserId(),
					tplData["s_b_title"], tplData["t_b_notice"], tplData["t_b_text"], tplData["b_show"])
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
									//TODO возможно путь надо вести на статью в профиле юзера?
									link_to: this.getMenuItem['m_path']+'/edit/'+tplData["i_blog_id"]
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

	_getBlogData(b_id)
	{
		return Promise.props({
			isRootAdmin: this.getClass('user/groups').isRootAdmin(this.getUserId()),
			blog: this.getClass('blog').getBlogById(b_id)
		})
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Blog;