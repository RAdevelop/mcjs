"use strict";

const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileErrors = require('app/lib/file/errors');
const FileUpload = require('app/lib/file/upload');
const Path = require('path');
const User = require('app/class/user');

class UserPhoto extends User
{
	/**
	 * создаем именованный фотоальбом пользователю
	 *
	 * @param u_id
	 * @param a_name
	 * @param a_text
	 * @returns {Promise}
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
	 * @returns {Promise}
	 */
	editAlbumNamed(u_id, a_id, a_name, a_text)
	{
		let a_alias = this.helpers.translit(a_name);
			a_alias = this.helpers.clearSymbol(a_alias, '-');

		return this.model('user/photo').editAlbumNamed(u_id, a_id, a_name, a_alias, a_text);
	}

	/**
	 * список фотоальбомов пользователя
	 *
	 * @param u_id
	 * @param owner_u_id - чей альбом запросил
	 * @param Pages
	 * @returns {Promise}
	 */
	getAlbumList(u_id, owner_u_id, Pages)
	{
		return this.model('user/photo').countUserAlbums(owner_u_id)
			.then((a_cnt) => {

				Pages.setTotal(a_cnt);

				if (!a_cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpError(404));

				return this.model('user/photo').getAlbumList(owner_u_id, Pages.getOffset(), Pages.getLimit())
					.then((albums) => {

						let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

						albums.forEach((album) => {
							
							album["a_is_owner"] = (album["u_id"]        == u_id);
							album["a_profile"]  = (album["a_profile"]   == 1);
							album["a_named"]    = (album["a_named"]     == 1);

							Object.assign(album, FileUpload.getPreviews(sizeParams, album, "ai_dir")["obj"]);
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
	 * @returns {Promise}
	 */
	getAlbum(u_id, owner_u_id, a_id)
	{
		return this.model('user/photo').getAlbum(owner_u_id, a_id)
			.then((album) => {

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
	 * @returns {Promise}
	 */
	getAlbumImages(u_id, a_id, Pages)
	{
		if (Pages.limitExceeded())
			return Promise.reject(new FileErrors.HttpError(404));
		
		return this.model('user/photo').getAlbumImages(u_id, a_id, Pages.getOffset(), Pages.getLimit())
			.then((images) => {

				if (!images)
					return [Pages, [], []];

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

				let allPreviews = [];
				images.forEach((image, indx) => {

					images[indx]["previews"] = {};

					if (image["ai_dir"])
					{
						let obj = FileUpload.getPreviews(sizeParams, image, "ai_dir", true);
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
	 * @returns {Promise}
	 */
	uploadImage(u_id, req, res)
	{
		let uploadConf = 'user_photo';
		let ai_id, a_id;
		let ufile = {};
		
		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then((file) => {

				ufile = file;
				a_id = file.a_id;
				return this.model('user/photo')
					.addPhoto(u_id, file)
					.then((file) => {

						ufile = file;
						ai_id = file.ai_id;

						file["moveToDir"] = FileUpload.getImageUri(file.a_id, file.ai_id);

						return new Promise((resolve, reject) =>
						{
							UploadFile.moveUploadedFile(file, file["moveToDir"], (err, file) =>
							{
								if (err) return reject(err);

								return resolve(file);
							});
						});
					});
			})
			.then((file) =>
			{
				if (file.type != 'image')
					return Promise.resolve(file);

				return UploadFile.setImageGeo(file)
					.then((file) =>
					{
						return UploadFile.resize(file, uploadConf);
					});
			})
			.then((file) =>
			{
				//console.log(file);

				return this.model('user/photo')
					.updImage(u_id, file.a_id, file.ai_id, file.latitude, file.longitude, '', file.webDirPath, file.name, true)
					.then(() => {

						ufile = null;
						file["ai_name"] = file.name;
						file["ai_text"] = '';
						return Promise.resolve(file);
					});
			})
			.catch((err) =>
			{
				Logger.error(err);
				return this.delImage(u_id, a_id, ai_id, ufile)
					.catch((delErr) =>
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
	 * @returns {Promise}
	 */
	getImage(u_id, owner_u_id, ai_id)
	{
		return this.model('user/photo').getImage(owner_u_id, ai_id)
			.then((image) => {

				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: UserPhoto.getImage(u_id="+u_id+", ai_id="+ai_id+")");

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;
				image["ai_is_owner"] = (image["u_id"] == u_id);
				image["previews"] = {};

				if (image["ai_dir"])
				{
					image = FileUpload.getPreviews(sizeParams, image, "ai_dir", false)["obj"];
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
	 * @returns {Promise}
	 */
	delImage(u_id, a_id, ai_id, file = {})
	{
		return FileUpload.deleteFile(file.path || '')
			.then(() => {

				return this.getImage(u_id, u_id, ai_id);
			})
			.then((image) => {

				if (!image || image["a_id"] != a_id || !image["ai_is_owner"])
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then((image) => {

				let dir = (image["ai_dir"] ? image["ai_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.then(() => {
						return this.model('user/photo').delImage(u_id, a_id, ai_id);
					})
					.then(() => {

						return Promise.resolve(image);
					});
			})
			.catch((err) => {

				console.log('class UserPhoto delImage catch');
				Logger.error(err);
				console.log('\n');

				return this.model('user/photo').delImage(u_id, a_id, ai_id)
					.then(() => {
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
	 * @returns {Promise}
	 */
	sortImgUpd(u_id, a_id, ai_pos)
	{
		return this.model('user/photo').updSortImg(u_id, a_id, ai_pos);
	}

	/**
	 * удаление указанного альбома
	 *
	 * @param u_id
	 * @param a_id
	 * @returns {Promise}
	 */
	delAlbum(u_id, a_id)
	{
		return this.getAlbum(u_id, u_id, a_id)
			.then((album) => {

				if (!album || !album["a_named"])
					return Promise.resolve(album);

				let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig('user_photo')["pathUpload"], FileUpload.getAlbumUri(a_id));

				return FileUpload.deleteDir(dir, true)
					.then(() => {

						if (!album || !album["a_named"])
							return Promise.resolve(a_id);

						return this.model('user/photo').delAlbum(album.a_id, u_id);
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhoto;