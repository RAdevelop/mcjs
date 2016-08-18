"use strict";

const Pages = require("app/lib/pages");
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
//const MultiGeocoder = require('multi-geocoder');
const FileUpload = require('app/lib/file/upload');
const Base = require('app/lib/controller');

let limit_per_page = 2;

class ProfilePhoto extends Base
{

	routePaths()
	{
		return {
			"index": {
				"^\/?$" : null //список альбомов
				,"^\/?page\/[0-9]+\/?$" : [ ,"i_page"] //список альбомов с постраничкой
				,"^\/?[0-9]+\/page\/[0-9]+\/?$" : ["i_a_id", ,"i_page"] //список фоток в альбоме с постраничкой
				,"^\/?[0-9]+\/?$" : ["i_a_id"] //список фоток в альбоме
			}
		}
	}

	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));

		//if (args.length > 1)
		//	return cb(new Errors.HttpStatusError(404, "Not found"));
			
		return Promise.resolve(this.getReq().xhr)
			.bind(this)
			.then(function (xhr)
			{
				if (xhr)
					return Promise.resolve({});

				let tplData = (xhr ? {} : this.getUser());
				return this.getClass("user").getUser(this.getUserId())
					.then(function (userData)
					{
						tplData["user"] = userData;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				tplData["albums"] = null;
				tplData["album"] = null;
				tplData["pages"] = null;

				if (this.routeArgs["i_a_id"])
					return this.album(cb, tplData, this.getReq().xhr);

				return this.albumList(cb, tplData, this.getReq().xhr);
			})
			.catch(function (err)
			{
				return cb(err);
			});
	}
	
	/**
	 * список фотоальбомов пользователя
	 *
	 * @param cb
	 * @param tplData
	 * @param isAjax
	 * @returns {Promise.<TResult>}
	 */
	albumList(cb, tplData, isAjax = false)
	{
		let {i_page=1} = this.routeArgs;

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('user/photo').getAlbumList(this.getUserId(), new Pages(i_page, limit_per_page))
					.bind(this)
					.spread(function (albums, Pages)
					{
						tplData["albums"]   = albums;

						return [tplData, Pages];
					});
			})
			.spread(function (tplData, Pages)
			{
				let exposeAlbums = 'albums';
				Pages.setLinksUri(this.getBaseUrl())
					.setAjaxPagesType(true)
					.setAjaxDataSrc(['albums'])
					.setAjaxDataTarget(exposeAlbums)
					.setJquerySelectorData('.album');

				tplData["pages"] = Pages.pages();

				console.log(tplData);

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

				this.getRes().expose(tplData["albums"], exposeAlbums);
				this.getRes().expose(tplData["pages"], 'pages');

				return cb(null);
			});
	}

	/**
	 * просмотр фотоальбома
	 *
	 * @param cb
	 * @param tplData
	 * @param isAjax
	 */
	album(cb, tplData, isAjax = false)
	{
		let {i_a_id, i_page=1} = this.routeArgs;

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('user/photo').getAlbum(this.getUserId(), i_a_id)
					.then(function (album)
					{
						if (!album)
							return Promise.reject(new Errors.HttpStatusError(404, "Not found"));

						tplData["album"] = album;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				if (!tplData["album"]["a_img_cnt"])
				{
					tplData["album"]["images"] = [];
					return [tplData, [], null];
				}

				return this.getClass('user/photo')
					.getAlbumImages(this.getUserId(), i_a_id, new Pages(i_page, limit_per_page, tplData["album"]["a_img_cnt"]))
					.bind(this)
					.spread(function (Pages, images, allPreviews)
					{
						Pages.setLinksUri(this.getBaseUrl()+'/'+i_a_id);

						tplData["album"]["images"] = images;
						//return Promise.resolve(tplData);
						return [tplData, allPreviews, Pages];
					});
			})
			.spread(function (tplData, allPreviews, Pages)
			{
				if (!isAjax)
				{
					tplData = Object.assign(tplData, FileUpload.createToken('user_photo', {"a_id": i_a_id}) );

					let uploadConfig = FileUpload.getUploadConfig('user_photo');

					this.getRes().expose({
						"fileMediaType":    uploadConfig["fileMediaType"]
						,"fileSizeLimit":   uploadConfig["fileSizeLimit"]
						,"fileTypes":       uploadConfig["fileTypes"]
						,"maxFileSize":     uploadConfig["maxFileSize"]
						,"multiUpload":     uploadConfig["multiUpload"]
					}, 'albumUploadOpts');
				}

				let exposeAlbumImages = 'albumImages';
				if (Pages)
				{
					Pages.setAjaxPagesType(true)
						.setAjaxDataSrc(['album', 'images'])
						.setAjaxDataTarget(exposeAlbumImages)
						.setJquerySelectorData('.imageList .image');

					tplData["pages"] = Pages.pages();

					console.log(tplData["pages"]);
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
				}

				this.view.setTplData(tplFile, tplData, isAjax);
				this.getRes().expose(tplData["album"]["images"], exposeAlbumImages);
				this.getRes().expose(allPreviews, 'albumPreviews');
				this.getRes().expose(tplData["pages"], 'pages');

				return cb(null);
			})
	}

	indexActionPost(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));

		let args = this.getArgs();

		if (args.length > 1)
			return cb(new Errors.HttpStatusError(404, "Not found"));

		let tplData = this.getParsedBody();

		if (!tplData["btn_save_album"])
			return Promise.reject(new Errors.HttpStatusError(400, "Bad request"));

		let tplFile = 'user/profile/photo/albums.ejs';

		console.log(tplData);

		return this.albumPostActions(tplData)
			.bind(this)
			.then(function(tplData) //если валидация успешна
			{
				//tplData.formError.error = false;
				this.view.setTplData(tplFile, tplData);
				return cb(null, true);
			})
			.catch(Errors.ValidationError, Errors.AlreadyInUseError, function(err)
			{
				//такие ошибки не уводят со страницы.
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 * обработка POST событий над формами
	 *
	 * @param tplData
	 * @returns {*}
	 */
	albumPostActions(tplData)
	{
		switch(tplData["btn_save_album"])
		{
			default:
				tplData.formError.error = true;
				tplData.formError.message = 'Невереные данные';

				return Promise.reject(new Errors.HttpStatusError(400, tplData.formError.message));
				break;

			case 'add_album':
				return this.addNamedAlbum(tplData);
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
		}
	}

	/**
	 * создание фотоальбома
	 *
	 * @param tplData
	 * @returns {Promise.<TResult>}
	 */
	addNamedAlbum(tplData)
	{
		let errors = {};

		tplData["s_album_name"] = (tplData["s_album_name"] || '').trim();

		if (tplData["s_album_name"] == '')
			errors["s_album_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				let errKeys = Object.keys(errors);

				if (errKeys.length)
				{
					errKeys.forEach(function(f)
					{
						tplData.formError.fields[f] = errors[f];
					});

					tplData.formError.message = 'Ошибка при создании фотоальбома';
					return Promise.reject(new Errors.ValidationError(tplData.formError.message));
				}

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/photo').addNamedAlbum(this.getUserId(), tplData["s_album_name"], tplData["s_album_text"])
					.then(function (a_id)
					{
						tplData["a_id"] = a_id;
						return Promise.resolve(tplData);
					});
			});
	}

	/**
	 * радактирование названия и описания фотоальбома
	 *
	 * @param tplData
	 * @returns {*}
	 */
	editAlbum(tplData)
	{
		let errors = {};

		tplData["s_album_name"] = (tplData["s_album_name"] || '').trim();

		if (!tplData["i_a_id"] || !tplData.hasOwnProperty("s_album_name") || !tplData.hasOwnProperty("s_album_text"))
			return Promise.reject(new Errors.HttpStatusError(400, 'Bad request'));

		if (tplData["s_album_name"] == '')
			errors["s_album_name"] = 'Укажите название альбома';

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				let errKeys = Object.keys(errors);

				if (errKeys.length)
				{
					errKeys.forEach(function(f)
					{
						tplData.formError.fields[f] = errors[f];
					});

					tplData.formError.message = 'Ошибка при редактировании фотоальбома';
					return Promise.reject(new Errors.ValidationError(tplData.formError.message));
				}

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/photo').editAlbumNamed(this.getUserId(), tplData["i_a_id"], tplData["s_album_name"], tplData["s_album_text"])
					.then(function (a_id)
					{
						tplData["a_id"] = a_id;
						return Promise.resolve(tplData);
					});
			});
	}

	updImgText(tplData)
	{
		if (!tplData["i_a_id"] || !tplData["i_ai_id"] || !tplData.hasOwnProperty("s_ai_text"))
			return Promise.reject(new Errors.HttpStatusError(400, 'Bad request'));

		tplData["s_ai_text"] = (tplData["s_ai_text"] || '').trim();

		//return Promise.resolve(tplData);

		return this.getClass('user/photo').updImgText(this.getUserId(), tplData["i_a_id"], tplData["i_ai_id"], tplData["s_ai_text"])
			.then(function ()
			{
				return Promise.resolve(tplData);
			});
	}

	delImg(tplData)
	{
		if (!tplData["i_a_id"] || !tplData["i_ai_id"])
			return Promise.reject(new Errors.HttpStatusError(400, 'Bad request'));

		//return Promise.resolve(tplData);

		return this.getClass('user/photo').delImage(this.getUserId(), tplData["i_a_id"], tplData["i_ai_id"])
			.then(function ()
			{
				return Promise.resolve(tplData);
			});
	}

	/**
	 * загружаем новую фотографю в альбом
	 *
	 * @param cb
	 * @returns {*}
	 */
	uploadActionPost(cb)
	{
		let self = this;
		let tplFile = 'user/profile/photo/albums.ejs';
		let tplData = self.getParsedBody();

		this.getRes().on('cancelUploadedFile', function(file)
		{
			if (file["u_id"] && file["a_id"] && file["ai_id"])
			return self.getClass('user/photo').delImage(file["u_id"], file["a_id"], file["ai_id"], file);
		});

		self.getClass('user/photo')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then(function (file)
			{
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
				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(function (err)
			{
				Logger().error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = ProfilePhoto;