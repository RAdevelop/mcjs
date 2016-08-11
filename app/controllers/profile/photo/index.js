"use strict";

const Logger = require('app/lib/logger');
//const Moment = require('moment');
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
//const Mail = require('app/lib/mail');
//const MultiGeocoder = require('multi-geocoder');
const FileUpload = require('app/lib/file/upload');

//const FileErrors = require('app/lib/file/errors');
//const _ = require('lodash');

const Base = require('app/lib/controller');

class ProfilePhoto extends Base {
	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));

		let args = this.getArgs();

		if (args.length > 1)
			return cb(new Errors.HttpStatusError(404, "Not found"));

		let tplData = this.getUser();
		
		this.getClass("user").getUser(this.getUserId())
			.bind(this)
			.then(function (userData)
			{
				tplData = Object.assign(tplData, {user: userData});
				tplData["albums"] = null;
				tplData["album"] = null;

				if (args.length)
					return this.album(cb, tplData, args.shift());

				return this.albumList(cb, tplData);
			})
			.catch(function (err)
			{
				return cb(err);
			});
	}
	
	/**
	 * список фотоальбомов пользователя
	 * @param u_id
	 * @returns {*}
	 */
	albumList(cb, tplData)
	{
		let tplFile = 'user/profile/photo/albums.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('user/photo').getAlbumList(this.getUserId())
					.then(function (albums)
					{
						tplData["albums"] = albums;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData('user/left', {user: tplData["user"]});

				return cb(null);
			});
	}

	album(cb, tplData, a_id)
	{
		let tplFile = 'user/profile/photo/albums.ejs';

		return Promise.resolve(tplData)
			.bind(this)
			.then(function (tplData)
			{
				return this.getClass('user/photo').getAlbum(this.getUserId(), a_id)
					.then(function (album)
					{
						if (!album)
							return Promise.reject(new Errors.HttpStatusError(404, "Not found"));

						tplData["a_id"] = a_id;
						tplData["album"] = album;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				tplData = Object.assign(tplData, FileUpload.createToken('user_photo', tplData) );

				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData('user/left', {user: tplData["user"]});

				this.getRes().expose(FileUpload.getUploadConfig('user_photo'), 'albumUploadOpts');

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
		}
	}

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