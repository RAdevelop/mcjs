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

let limit_per_page = 20;

class ProfileVideo extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", "i_va_id", ,"i_page"] //список фоток в альбоме с постраничкой
				,"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/?$" : ["i_u_id", "i_va_id"] //список фоток в альбоме юзера

				,"^\/?[1-9]+[0-9]*\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", ,"i_page"] //список видео юзера с постраничкой
				,"^\/?[1-9]+[0-9]*\/?$" : ["i_u_id"] //список видео пользователя
				,"^\/?$" : null //список юзеров
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
					return this.album(i_u_id, tplData, xhr);

				return this.albumList(i_u_id, tplData, xhr);
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
	albumList(i_u_id, tplData, isAjax = false)
	{
		let {i_page=1} = this.routeArgs;

		return this.getClass('video/albums')
			.getVideoAlbumList(this.getUserId(), i_u_id, new Pages(i_page, limit_per_page))
			.spread((videoAlbums, Pages) =>
			{
				tplData["videoAlbums"] = videoAlbums;

				let exposeAlbums = 'albums';
				Pages.setLinksUri(this.getBaseUrl()+'/'+ i_u_id)
					.setAjaxPagesType(true)
					.setAjaxDataSrc(['albums'])
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

		return this.albumPostActions(tplData)
			.then((tplData) => { //если валидация успешна

				//tplData.formError.error = false;
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.FormError, (err) => {

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
		if (!tplData["btn_save_album"] || !tplData["ui_u_id"] || tplData["ui_u_id"] != this.getUserId())
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

			case 'upd_img_text':
				return this.updImgText(tplData);
				break;

			case 'del_img':
				return this.delImg(tplData);
				break;

			case 'sort_img':
				return this.sortImg(tplData);
				break;

			case 'del_album':
				return this.delAlbum(tplData);
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
					return this.getClass('video/albums')
						.addVideoAlbum(this.getUserId(), tplData["s_va_name"], tplData["t_va_text"])
						.then((va_id) =>
						{
							tplData["va_id"] = va_id;
							return Promise.resolve(tplData);
						});
				}
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