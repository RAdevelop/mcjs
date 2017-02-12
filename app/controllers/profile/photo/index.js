"use strict";

const Pages = require("app/lib/pages");
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const Errors = require('app/lib/errors');

const FileUpload = require('app/lib/file/upload');
const CtrlMain = require('app/lib/controller');

let limit_per_page = 20;

class ProfilePhoto extends CtrlMain
{
	static routePaths()
	{
		return {
			"index": {
				"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", "i_a_id", ,"i_page"] //список фоток в альбоме с постраничкой
				,"^\/?[1-9]+[0-9]*\/[1-9]+[0-9]*\/?$" : ["i_u_id", "i_a_id"] //список фоток в альбоме юзера
				,"^\/?tag\/\\S+\/page\/[1-9]+[0-9]*\/?$" : ['b_tag','s_tag',,'i_page'] //по тегам
				,"^\/?tag\/\\S+\/?$" : ['b_tag','s_tag']
				,"^\/?[1-9]+[0-9]*\/page\/[1-9]+[0-9]*\/?$" : ["i_u_id", ,"i_page"] //список альбомов юзера с постраничкой
				,"^\/?[1-9]+[0-9]*\/?$" : ["i_u_id"] //список альбомов
				,"^\/?$" : null //
			},
			"upload": {
				"^\/?$" : null
			}
		};
	}

	/**
	 * показываем страницу с фотоальбомами пользователя (свою, или выбранного)
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		//console.log(this.getLocalAccess());

		let xhr = this.getReq().xhr;
		let {i_u_id=this.getUserId(), i_a_id=null, b_tag=null, s_tag=null} = this.routeArgs;

		//TODO список альбомов по тегу
		b_tag = !!b_tag;

		return this.getUser(i_u_id)
			.then((userData) =>
			{
				if (!userData["u_id"])
					throw new Errors.HttpError(404);

				userData["u_is_owner"] = this.isTheSameUser(i_u_id);

				let tplData = {
					"user": userData
					,   "albums": null
					,   "album": null
					,   "pages": null
				};

				if (i_a_id)
					return this._album(i_u_id, tplData, xhr);

				return this._albumList(i_u_id, tplData, xhr);
			});
	}

	/**
	 * список фотоальбомов пользователя
	 *
	 * @param i_u_id
	 * @param tplData
	 * @param isAjax
	 * @returns {Promise}
	 */
	_albumList(i_u_id, tplData, isAjax = false)
	{
		let {i_page=1} = this.routeArgs;

		return this.getClass('user/photo')
			.getAlbumList(this.getUserId(), i_u_id, new Pages(i_page, limit_per_page))
			.spread((albums, Pages) =>
			{
				tplData["albums"] = albums;

				Pages.setLinksUri(this.getBaseUrl()+'/'+ i_u_id)
					.setAjaxPagesType(true);

				tplData["pages"] = Pages.pages();

				let tplFile = '';

				if (isAjax)
				{
					tplFile = 'user/profile/photo/album_list.ejs';
				}
				else
				{
					tplFile = 'user/profile/photo/albums.ejs';
					this.view.addPartialData('user/left', {user: tplData["user"]});
				}

				this.view.setTplData(tplFile, tplData, isAjax);

				this.getRes().expose(tplData["albums"], 'albums');
				this.getRes().expose(tplData["pages"], 'pages');
				Pages = null;
				return Promise.resolve(isAjax);
			});
	}

	/**
	 * просмотр фотоальбома
	 *
	 * @param i_u_id
	 * @param tplData
	 * @param isAjax
	 */
	_album(i_u_id, tplData, isAjax = false)
	{
		let {i_a_id, i_page=1} = this.routeArgs;

		return this.getClass('user/photo')
			.getAlbum(this.getUserId(), i_u_id, i_a_id)
			.then((album) =>
			{
				if (!album)
					throw new Errors.HttpError(404);

				tplData["album"] = album;
				tplData["album"]["images"] = [];
				
				if (tplData["album"]["a_img_cnt"] == 0)
					return [tplData, [], null];

				return this.getClass('user/photo')
					.getAlbumImages(i_u_id, i_a_id, new Pages(i_page, limit_per_page, tplData["album"]["a_img_cnt"]))
					.spread((Pages, images, allPreviews) =>
					{
						Pages.setLinksUri([this.getBaseUrl(),i_u_id, i_a_id].join('/'));

						tplData["album"]["images"] = images;
						//return Promise.resolve(tplData);
						return [tplData, allPreviews, Pages];
					});
			})
			.spread((tplData, allPreviews, Pages) =>
			{
				if (!isAjax && i_u_id == this.getUserId())
				{
					let uploadPhotoConfigName = this.getClass('user/photo').constructor.uploadPhotoConfigName;

					Object.assign(tplData, FileUpload.createToken(uploadPhotoConfigName, {"a_id": i_a_id}) );

					this.getRes().expose(FileUpload.exposeUploadOptions(uploadPhotoConfigName), 'albumUploadOpts');
				}

				let exposeAlbumImages = 'albumImages';
				if (Pages)
				{
					Pages.setAjaxPagesType(true);

					tplData["pages"] = Pages.pages();
				}

				let tplFile = '';

				if (isAjax)
				{
					tplFile = 'user/profile/photo/image_list.ejs';
				}
				else
				{
					tplFile = 'user/profile/photo/albums.ejs';
					this.view.addPartialData('user/left', {user: tplData["user"]});

					this.view.setPageTitle(tplData["album"]["a_name"]);
					this.view.setPageDescription(CtrlMain.cheerio(tplData["album"]["a_text"]).text());

					if (tplData["album"]["images"] && tplData["album"]["images"][0] && tplData["album"]["images"][0]["previews"]["512_384"])
						this.view.setPageOgImage(tplData["album"]["images"][0]["previews"]["512_384"]);
				}

				this.view.setTplData(tplFile, tplData, isAjax);

				this.getRes().expose(tplData["album"], 'album');
				this.getRes().expose(tplData["album"]["images"], exposeAlbumImages);
				this.getRes().expose(allPreviews, 'albumPreviews');
				this.getRes().expose(tplData["pages"], 'pages');
				Pages = null;
				return Promise.resolve(isAjax);
			});
	}

	indexActionPost()
	{
		let tplData = this.getParsedBody();

		let tplFile = 'user/profile/photo/albums.ejs';

		//console.log(tplData);

		return this._albumPostActions(tplData)
			.then((tplData) =>
			{ //если валидация успешна
				//tplData.formError.error = false;
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.FormError, (err) =>
			{
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			});
	}

	/**
	 * обработка POST событий над формами
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_albumPostActions(tplData)
	{
		if (!tplData["btn_save_album"])
			throw new Errors.HttpError(400);

		switch(tplData["btn_save_album"])
		{
			default:
				tplData.formError.error = true;
				tplData.formError.message = 'Невереные данные';

				throw new Errors.HttpError(400, tplData.formError.message);
				break;

			case 'add_album':
				return this._addNamedAlbum(tplData);
				break;

			case 'edit_album':
				return this._editAlbum(tplData);
				break;

			case 'upd_img_text':
				return this._updImgText(tplData);
				break;

			case 'del_img':
				return this._delImg(tplData);
				break;

			case 'sort_img':
				return this._sortImg(tplData);
				break;

			case 'del_album':
				return this._delAlbum(tplData);
				break;
			
			case 'get_tags':
				return this._getTags(tplData);
				break;
		}
	}

	_getTags(tplData)
	{
		return this.getClass('keywords').getKeyWordList()
			.then((list)=>
			{
				tplData['keyWords'] = list;
				return Promise.resolve(tplData);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param tplData
	 */
	_sortImg(tplData)
	{
		if (!tplData["i_a_id"] || !tplData.hasOwnProperty("ai_pos") || !tplData["ai_pos"].length)
			return Promise.resolve(tplData);

		return this.getClass('user/photo')
			.sortImgUpd(this.getUserId(), tplData["i_a_id"], tplData["ai_pos"])
			.then(() => {
				return Promise.resolve(tplData);
			});
	}

	/**
	 * создание фотоальбома
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_addNamedAlbum(tplData)
	{
		if (!tplData["i_u_id"] || tplData["i_u_id"] != this.getUserId())
			throw new Errors.HttpError(400);

		tplData = CtrlMain.stripTags(tplData, ["s_album_name", "t_album_text", "s_tags"]);

		let errors = {};

		if (tplData["s_album_name"] == '')
			errors["s_album_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.then((errors)=>
			{
				if (this.parseFormErrors(tplData, errors, 'Ошибка при создании фотоальбома'))
				{
					return this.getClass('user/photo')
						.addNamedAlbum(this.getUserId(), tplData["s_album_name"], tplData["t_album_text"])
						.then((album) =>
						{
							return this.getClass('keywords').saveKeyWords(
								this.getClass('user/photo'), album['b_id'], tplData['s_tags'],  1, album['a_create_ts']
							).then(()=>
							{
								tplData["a_id"] = album['a_id'];
								return Promise.resolve(tplData);
							});
						});
				}
			});
	}

	/**
	 * радактирование названия и описания фотоальбома
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_editAlbum(tplData)
	{
		tplData = CtrlMain.stripTags(tplData, ["s_album_name", "t_album_text", "s_tags"]);

		if (!tplData["i_a_id"] || !tplData.hasOwnProperty("s_album_name"))
			throw new Errors.HttpError(400);

		let errors = {};
		if (tplData["s_album_name"] == '')
			errors["s_album_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.then((errors)=>
			{
				if (this.parseFormErrors(tplData, errors, 'Ошибка при редактировании фотоальбома'))
				{
					return this.getClass('user/photo')
						.getAlbum(this.getUserId(), this.getUserId(), tplData["i_a_id"])
						.then((album) =>
						{
							if (!album || !album["a_is_owner"])
								throw new Errors.HttpError(400);

							return Promise.all([
								this.getClass('user/photo')
									.editAlbumNamed(
										this.getUserId(), tplData["i_a_id"],
										tplData["s_album_name"], tplData["t_album_text"]
									),
								this.getClass('keywords').saveKeyWords(
									this.getClass('user/photo'), album['a_id'], tplData['s_tags'],
									1, album['a_create_ts']
								)
							])
								.then(() =>
								{
									tplData["a_id"] = album['a_id'];
									return Promise.resolve(tplData);
								});
						});
				}
			});
	}

	/**
	 * обновляем описание фотографии
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_updImgText(tplData)
	{
		if (!tplData["i_a_id"] || !tplData["i_ai_id"] || !tplData.hasOwnProperty("t_ai_text"))
			return new Errors.HttpError(400);

		tplData = CtrlMain.stripTags(tplData, ["t_ai_text"]);

		return this.getClass('user/photo')
			.updImgText(this.getUserId(), tplData["i_a_id"], tplData["i_ai_id"], tplData["t_ai_text"])
			.then(() => {
				return Promise.resolve(tplData);
			});
	}

	/**
	 * удаление фотографии пользователем
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_delImg(tplData)
	{
		if (!tplData["i_a_id"] || !tplData["i_ai_id"])
			throw new Errors.HttpError(400);

		return this.getClass('user/photo')
			.delImage(this.getUserId(), tplData["i_a_id"], tplData["i_ai_id"])
			.then(() =>
			{
				return Promise.resolve(tplData);
			})
			.catch(Errors.io.FileNotFoundError, (err) => 
			{
				Logger.error(err);
				throw new Errors.HttpError(404, 'Фотография не найдена');
			});
	}

	/**
	 * загружаем новую фотографю в альбом
	 *
	 * @returns {Promise}
	 */
	uploadActionPost()
	{
		let tplFile = 'user/profile/photo/albums.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) => {
			if (file["u_id"] && file["a_id"] && file["ai_id"])
				return this.getClass('user/photo').delImage(file["u_id"], file["a_id"], file["ai_id"], file);
		});

		return this.getClass('user/photo')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then((file) => {
				//console.log(file);
				tplData = {
					a_id: file.a_id,
					ai_id: file.ai_id,
					ai_text: file.ai_text,
					ai_pos: file.ai_pos,
					ai_name: file.ai_name,
					ai_latitude: file.latitude,
					ai_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch((err) => {
				Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			});
	}

	/**
	 * удаление указанного альбома
	 *
	 * @param tplData
	 * @returns {Promise}
	 */
	_delAlbum(tplData)
	{
		if (!tplData["i_a_id"])
			throw new Errors.HttpError(400);

		return this.getClass('user/photo').delAlbum(this.getUserId(), tplData["i_a_id"])
			.then(() => {
				return Promise.resolve(tplData);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = ProfilePhoto;
