"use strict";

const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileErrors = require('app/lib/file/errors');
const FileUpload = require('app/lib/file/upload');
const Crypto = require('crypto');
const Path = require('path');
const User = require('app/class/user');

class UserPhoto extends User
{
	getAlbumUri(a_id)
	{
		return Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
		//return 'part_' + Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
	}

	getImageUri(a_id, ai_id)
	{
		return this.getAlbumUri(a_id) + '/' + ai_id + '/' + Crypto.createHash('md5').update(a_id+''+ai_id).digest("hex");
		//return 'part_' + Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
	}

	/**
	 * создаем именованный фотоальбом пользователю
	 *
	 * @param u_id
	 * @param a_name
	 * @param a_text
	 * @returns {*}
	 */
	addNamedAlbum(u_id, a_name, a_text)
	{
		let a_alias = this.helpers.translit(a_name);
			a_alias = this.helpers.clearSymbol(a_alias, '-');
		return this.model('user/photo').createAlbumNamed(u_id, a_name, a_alias, a_text);
	}

	/**
	 * редактируем название и описание фотоальбома пользователя
	 *
	 * @param u_id
	 * @param a_id
	 * @param a_name
	 * @param a_text
	 * @returns {*}
	 */
	editAlbumNamed(u_id, a_id, a_name, a_text)
	{
		let a_alias = this.helpers.translit(a_name);
			a_alias = this.helpers.clearSymbol(a_alias, '-');

		return this.model('user/photo').editAlbumNamed(u_id, a_id, a_name, a_alias, a_text);
	}

	/**
	 * формируем проевьюхи для объекта obj (льбом или картинка в альбоме)
	 *
	 * @param sizeParams
	 * @param obj
	 * @param spread
	 * @returns {*}
	 */
	static previews(sizeParams, obj, spread = false)
	{
		let previews = [];
		//if (!obj["previews"]) obj["previews"] = {};

		if (!obj["previews"])
		obj["previews"] = {};

		if (obj["ai_dir"])
		{
			sizeParams.forEach(function (size)
			{
				obj["previews"][size.w+'_'+size.h] = obj["ai_dir"] + '/' + size.w+'_'+size.h +'.jpg';

				if (spread)
					previews.push(obj["previews"][size.w+'_'+size.h]);
			});
		}


		return {obj: obj, previews: previews};
	}

	/**
	 * список фотоальбомов пользователя
	 *
	 * @param u_id
	 * @param owner_u_id - чей альбом запросил
	 * @param Pages
	 * @returns {Promise.<TResult>|*}
	 */
	getAlbumList(u_id, owner_u_id, Pages)
	{
		return this.model('user/photo').countUserAlbums(owner_u_id)
			.bind(this)
			.then(function (a_cnt)
			{
				Pages.setTotal(a_cnt);

				if (!a_cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpStatusError(404, "Not found"));

				return this.model('user/photo').getAlbumList(owner_u_id, Pages.getOffset(), Pages.getLimit())
					.then(function (albums)
					{
						let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

						albums.forEach(function (album)
						{
							album["a_is_owner"] = (album["u_id"]        == u_id);
							album["a_profile"]  = (album["a_profile"]   == 1);
							album["a_named"]    = (album["a_named"]     == 1);

							album = Object.assign(album, UserPhoto.previews(sizeParams, album)["obj"]);
						});
						
						albums["a_cnt"] = a_cnt;

						return [albums, Pages];
					});
			});
	}

	/**
	 * выбранный альбом пользователя
	 *
	 * @param u_id - кто запросил
	 * @param owner_u_id - чей альбом запросил
	 * @param a_id
	 * @returns {*}
	 */
	getAlbum(u_id, owner_u_id, a_id)
	{
		return this.model('user/photo').getAlbum(owner_u_id, a_id)
			.then(function (album)
			{
				if (!album)
					return Promise.resolve(null);

				album["a_is_owner"] = (album["u_id"]        == u_id);
				album["a_profile"]  = (album["a_profile"]   == 1);
				album["a_named"]    = (album["a_named"]     == 1);

				return Promise.resolve(album);
			});
	}

	/**
	 * список фоток в альбоме
	 *
	 * @param u_id
	 * @param a_id
	 * @param Pages
	 * @returns {*}
	 */
	getAlbumImages(u_id, a_id, Pages)
	{
		if (Pages.limitExceeded())
			return Promise.reject(new FileErrors.HttpStatusError(404, "Not found"));
		
		return this.model('user/photo').getAlbumImages(u_id, a_id, Pages.getOffset(), Pages.getLimit())
			.then(function (images)
			{
				if (!images)
					return [Pages, [], []];

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

				let allPreviews = [];
				images.forEach(function (image, indx)
				{
					images[indx]["previews"] = {};
					if (image["ai_dir"])
					{
						let obj = UserPhoto.previews(sizeParams, image, true);
						image = obj["obj"];

						allPreviews = allPreviews.concat(obj["previews"]);

						image["previews"]['orig'] = image["ai_dir"] + '/orig/' + image["ai_name"];
					}
				});

				return [Pages, images, allPreviews];
			});
	}

	/**
	 * загружаем фотографию в "именованный" альбом пользователя
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 * @returns {Promise.<TResult>}
	 */
	uploadImage(u_id, req, res)
	{
		const self = this;
		let uploadConf = 'user_photo';
		let ai_id, a_id;
		let file = {};
		
		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then(function(file)
			{
				a_id = file.a_id;
				return self.model('user/photo')
					.addPhoto(u_id, file)
					.then(function (file)
					{
						ai_id = file.ai_id;

						file["moveToDir"] = self.getImageUri(file.a_id, file.ai_id);

						return new Promise(function (resolve, reject)
						{
							UploadFile.moveUploadedFile(file, file["moveToDir"], function (err, file)
							{
								if (err) return reject(err);

								return resolve(file);
							});
						});
					});
			})
			.then(function(file)
			{
				if (file.type != 'image')
					return Promise.resolve(file);

				return UploadFile.setImageGeo(file)
					.then(function (file)
					{
						return UploadFile.resize(file, uploadConf);
					});
			})
			.then(function (file)
			{
				//console.log(file);

				return self.model('user/photo')
					.updImage(u_id, file.a_id, file.ai_id, file.latitude, file.longitude, '', file.webDirPath, file.name, true)
					.then(function ()
					{
						file["ai_name"] = file.name;
						file["ai_text"] = '';
						return Promise.resolve(file);
					});
			})
			.catch(function (err)
			{
				return self.getClass('user/photo').delImage(u_id, a_id, ai_id, file)
					.catch(function (delErr)
					{
						switch (err.name)
						{
							case 'FileTooBig':
							case 'FileType':
							case 'FileTokenError':
								throw err;
								break;

							default:
								throw delErr;
								break;
						}
					});
			});
	}

	/**
	 * получаем данные для указанной фотографии указанного пользователя
	 *
	 * @param u_id - кто запрсил
	 * @param owner_u_id - чью фото запросил
	 * @param ai_id
	 * @returns {*}
	 */
	getImage(u_id, owner_u_id, ai_id)
	{
		return this.model('user/photo').getImage(owner_u_id, ai_id)
			.then(function (image)
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: UserPhoto.getImage(u_id="+u_id+", ai_id="+ai_id+")");

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;
				image["ai_is_owner"] = (image["u_id"] == u_id);
				image["previews"] = {};
				if (image["ai_dir"])
				{
					image = UserPhoto.previews(sizeParams, image, false)["obj"];
				}
				return Promise.resolve(image);
			});
	}

	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_id
	 * @param file
	 * @returns {*}
	 */
	delImage(u_id, a_id, ai_id, file = {})
	{
		return this.getImage(u_id, u_id, ai_id)
			.bind(this)
			.then(function (image)
			{
				if (!image || image["a_id"] != a_id || !image["ai_is_owner"])
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then(function (image)
			{
				let dir = (image["ai_dir"] ? image["ai_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.bind(this)
					.then(function ()
					{
						return this.model('user/photo').delImage(u_id, a_id, ai_id);
					})
					.then(function ()
					{
						return Promise.resolve(image);
					});
			})
			.catch(function (err)
			{
				console.log('class UserPhoto delImage catch');
				Logger.error(err);
				console.log('\n');

				return this.model('user/photo').delImage(u_id, a_id, ai_id)
					.then(function ()
					{
						throw err;
					});
			});
	}

	/**
	 * обновляем описание фотографии
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_id
	 * @param ai_text
	 */
	updImgText(u_id, a_id, ai_id, ai_text)
	{
		return this.model('user/photo').updImgText(u_id, a_id, ai_id, ai_text);
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param u_id
	 * @param a_id
	 * @param ai_pos
	 * @returns {*}
	 */
	sortImgUpd(u_id, a_id, ai_pos)
	{
		return this.model('user/photo').updSortImg(u_id, a_id, ai_pos);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhoto;