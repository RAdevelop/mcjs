"use strict";
//const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
//const FileUpload = require('app/lib/file/upload');
//const Mail = require('app/lib/mail');

const EmbedContent = require("app/lib/embed/content");

//const Moment = require('moment'); //работа со временем
const CtrlMain = require('app/lib/controller');

let limit_per_page = 2;

class ProfileVideo extends CtrlMain
{
	/**
	 * @see CtrlMain.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				//список видео в альбоме с постраничкой
				"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/\\S+\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", "i_va_id", "s_va_alias", ,"i_page"]
				//список видео в альбоме юзера
				,"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/\\S+\/?$" : ["i_u_id", "i_va_id", "s_va_alias"]
				//список видео юзера с постраничкой
				,"^\/?[1-9]+[0-9]*\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", ,"i_page"]
				//список видео пользователя
				,"^\/?[1-9]+[0-9]*\/?$" : ["i_u_id"]
				//список
				,"^\/?$" : null
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
		let {i_u_id=this.getUserId(), i_va_id=null} = this.routeArgs;

		return this.getUser(i_u_id)
			.then((userData) =>
			{
				if (!userData["u_id"])
					throw new Errors.HttpError(404);

				userData["u_is_owner"] = this.isTheSameUser(i_u_id);

				let tplData = {
					 "user": userData
					,"videoAlbums": null
					,"videoAlbum": null
					,"pages": null
				};

				let xhr = this.getReq().xhr;
				if (i_va_id)
					return this.videoAlbum(i_u_id, tplData, xhr);

				return this.videoAlbumList(i_u_id, tplData, xhr);
			});
	}

	/**
	 * просмотр альбома
	 *
	 * @param i_u_id
	 * @param tplData
	 * @param isAjax
	 */
	videoAlbum(i_u_id, tplData, isAjax = false)
	{
		let {i_va_id, s_va_alias, i_page=1} = this.routeArgs;

		return this.getClass('video')
			.getVideoAlbum(this.getUserId(), i_u_id, i_va_id)
			.then((album) =>
			{
				if (!album || album['va_alias'] != s_va_alias)
					throw new Errors.HttpError(404);

				tplData["videoAlbum"] = album;
				tplData["videoAlbum"]["videos"] = [];

				if (tplData["videoAlbum"]["va_cnt"] == 0)
					return [tplData, [], null];

				return this.getClass('video')
					.getAlbumVideos(i_u_id, i_va_id, new Pages(i_page, limit_per_page, tplData["videoAlbum"]["va_cnt"]))
					.spread((Pages, videos, allPreviews) =>
					{
						Pages.setLinksUri([this.getBaseUrl(),i_u_id,i_va_id,album['va_alias']].join('/'));

						tplData["videoAlbum"]["videos"] = videos;
						//return Promise.resolve(tplData);
						return [tplData, allPreviews, Pages];
					});
			})
			.spread((tplData, allPreviews, Pages) =>
			{
				/*if (!isAjax)
				{
					tplData = Object.assign(tplData, FileUpload.createToken('user_photo', {"va_id": i_va_id}) );

					this.getRes().expose(FileUpload.exposeUploadOptions('user_photo'), 'albumUploadOpts');
				}*/

				let exposeAlbumVideos = 'videoAlbums';
				if (Pages)
				{
					let linksUri = [this.getBaseUrl(),i_u_id,tplData['videoAlbum']['va_id'],tplData['videoAlbum']['va_alias']].join('/');

					Pages.setLinksUri(linksUri)
						.setAjaxPagesType(true)
						.setAjaxDataSrc(['videoAlbums'])
						.setAjaxDataTarget(exposeAlbumVideos)
						.setJquerySelectorData('.albumList .album');

					tplData["pages"] = Pages.pages();
				}

				let tplFile = '';

				if (isAjax)
				{
					tplFile = 'user/profile/video/video.ejs';
				}
				else
				{
					tplFile = 'user/profile/video/index.ejs';
					this.view.addPartialData('user/left', {user: tplData["user"]});

					this.view.setPageTitle(tplData["videoAlbum"]["va_name"]);
					this.view.setPageDescription(CtrlMain.cheerio(tplData["videoAlbum"]["va_text"]).text());

					if (tplData["videoAlbum"]["va_img"])
						this.view.setPageOgImage(tplData["videoAlbum"]["va_img"]);
				}

				this.view.setTplData(tplFile, tplData, isAjax);

				this.getRes().expose(tplData["videoAlbum"], 'videoAlbum');
				this.getRes().expose(tplData["videoAlbum"]["videos"], exposeAlbumVideos);
				//this.getRes().expose(allPreviews, 'albumPreviews');
				this.getRes().expose(tplData["pages"], 'pages');
				Pages = null;
				return Promise.resolve(isAjax);
			});
	}

	/**
	 * список альбомов пользователя
	 *
	 * @param i_u_id
	 * @param tplData
	 * @param isAjax
	 * @returns {Promise}
	 */
	videoAlbumList(i_u_id, tplData, isAjax = false)
	{
		let {i_page=1} = this.routeArgs;

		return this.getClass('video')
			.getVideoAlbumList(this.getUserId(), i_u_id, new Pages(i_page, limit_per_page))
			.spread((videoAlbums, Pages) =>
			{
				tplData["videoAlbums"] = videoAlbums;

				let exposeAlbums = 'videoAlbums';
				Pages.setLinksUri(this.getBaseUrl()+'/'+ i_u_id)
					.setAjaxPagesType(true)
					.setAjaxDataSrc(['videoAlbums'])
					.setAjaxDataTarget(exposeAlbums)
					.setJquerySelectorData('.albumList .album');

				tplData["pages"] = Pages.pages();

				let tplFile = '';

				if (isAjax)
				{
					tplFile = 'user/profile/video/video_list.ejs';
				}
				else
				{
					tplFile = 'user/profile/video/index.ejs';
					this.view.addPartialData('user/left', {user: tplData["user"]});
				}

				this.view.setTplData(tplFile, tplData, isAjax);

				this.getRes().expose(tplData["videoAlbums"], 'videoAlbums');
				this.getRes().expose(tplData["pages"], 'pages');
				Pages = null;
				return Promise.resolve(isAjax);
			});
	}

	indexActionPost()
	{
		let tplData = this.getParsedBody();

		let tplFile = 'user/profile/video/index.ejs';

		//console.log(tplData);

		if (tplData["b_load_embed_content"])
			return EmbedContent.content(tplData, tplFile, this);

		return this.albumPostActions(tplData)
			.then((tplData) =>
			{ //если валидация успешна

				//tplData.formError.error = false;
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.FormError, Errors.AlreadyInUseError, (err) =>
			{
				if (err.name == 'AlreadyInUseError')
				{
					tplData.formError.message = 'Такой альбом уже существует';
					tplData.formError.fields['s_va_name'] = "Укажите название альбома";
					tplData.formError.error = true;
					tplData.formError.errorName = err.name;

					err['data'] = tplData;
				}

				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * обработка POST событий над формами
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	albumPostActions(tplData)
	{
		if (!tplData["btn_save_album"] || tplData["ui_u_id"] != this.getUserId())
			throw new Errors.HttpError(400);

		switch(tplData["btn_save_album"])
		{
			default:
				tplData.formError.error = true;
				tplData.formError.message = 'Невереные данные';

				throw new Errors.HttpError(400, tplData.formError.message);
				break;

			case 'add_album':
				return this.addVideoAlbum(tplData);
				break;

			case 'edit_album':
				return this.editAlbum(tplData);
				break;

			case 'add_video':
				return this.addVideo(tplData);
				break;

			case 'del_video_album':
				return this.delVideoAlbum(tplData);
				break;

			case 'del_img':
				return this.delImg(tplData);
				break;

			case 'sort_img':
				return this.sortImg(tplData);
				break;

		}
	}

	addVideoAlbum(tplData)
	{
		tplData = CtrlMain.stripTags(tplData, ["s_va_name", "t_va_text"]);

		let errors = {};

		if (tplData["s_va_name"] == '')
			errors["s_va_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors, 'Ошибка при создании фотоальбома'))
				{
					return this.getClass('video')
						.addVideoAlbum(this.getUserId(), tplData["s_va_name"], tplData["t_va_text"])
						.then((album) =>
						{
							return Promise.resolve(album);
						});
				}
			});
	}

	/**
	 * радактирование названия и описания альбома
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	editAlbum(tplData)
	{
		tplData = CtrlMain.stripTags(tplData, ["s_va_name", "t_va_text"]);

		if (!tplData["ui_va_id"] || !tplData.hasOwnProperty("s_va_name"))
			throw new Errors.HttpError(400);

		let errors = {};
		if (tplData["s_va_name"] == '')
			errors["s_va_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('video')
						.getVideoAlbum(this.getUserId(), this.getUserId(), tplData["ui_va_id"])
						.then((album) =>
						{
							if (!album || !album["va_is_owner"])
								throw new Errors.HttpError(400);

							return this.getClass('video')
								.editVideoAlbum(this.getUserId(), tplData["ui_va_id"], tplData["s_va_name"], tplData["t_va_text"]);
						});
				}
			})
			.then((videoAlbum) =>
			{
				return Promise.resolve(videoAlbum);
			});
	}

	addVideo(tplData)
	{
		tplData = CtrlMain.stripTags(tplData, ['link_v_url', 'link_v_img', 's_v_name', 't_v_text']);

		if (!tplData["ui_va_id"])
			throw new Errors.HttpError(400);

		let errors = {};
		if (tplData["s_va_name"] == '')
			errors["s_va_name"] = 'Укажите название альбома';

		if (!tplData["link_v_url"] || tplData["link_v_url"] == '')
			errors["link_v_url"] = 'Укажите cсылку на видеоролик';
//TODO перед сохранением слать ли еще раз запрос на получение данных?
		//только надо будет тут описывать iframe, как на клиенте
		//console.log(tplData);

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return Promise.resolve(tplData);

					return this.getClass('video')
						.getVideoAlbum(this.getUserId(), this.getUserId(), tplData["ui_va_id"])
						.then((album) =>
						{
							if (!album || !album["va_is_owner"])
								throw new Errors.HttpError(400);

							return this.getClass('video')
								.addVideo(this.getUserId(), tplData["ui_va_id"], tplData["s_v_name"], tplData["t_v_text"], tplData["link_v_img"], tplData["t_v_content"], tplData["link_v_url"]);
						});
				}
			});
	}

	delVideoAlbum(tplData)
	{
		if (!tplData["ui_va_id"])
			throw new Errors.HttpError(400);

		return this.getClass('video').delVideoAlbum(this.getUserId(), tplData["ui_va_id"])
			.then(()=>
			{
				return Promise.resolve(tplData);
			});
	}

	/**
	 * форма добавления новости
	 * @returns {Promise}
	 */
	addActionGet()
	{
		let tplData = {};

		let tplFile = "user/profile/video";
		this.view.setTplData(tplFile, tplData);
		return Promise.resolve(null);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = ProfileVideo;