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
		return this.model('user/photo').createAlbumNamed(u_id, a_name, a_alias, a_text)
			.then((a_id)=>
			{
				return this.getAlbum(u_id, u_id, a_id);
			});
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

						let sizeParams = FileUpload.getUploadConfig(User.uploadPhotoConfigName).sizeParams;

						albums.forEach((album) => {
							
							album["a_is_owner"] = (album["u_id"]        == u_id);
							album["a_profile"]  = (album["a_profile"]   == 1);
							album["a_named"]    = (album["a_named"]     == 1);

							Object.assign(album, FileUpload.getPreviews(sizeParams, album)["obj"]);
						});
						
						albums["a_cnt"] = a_cnt;

						return [albums, Pages];
					});
			});
	}

	getAlbumListByTag(Pages, s_tag)
	{
		return this.getClass('keywords').getKeyWordByName(s_tag)
			.then((kw)=>
			{
				if (!kw)
					return Promise.resolve([null, Pages]);

				return this.getClass('keywords').countObjByKwId(this, kw['kw_id'])
					.then((cnt)=>
					{
						return Promise.resolve([cnt, kw['kw_id']]);
					});
			})
			.spread((cnt, kw_id)=>
			{
				Pages.setTotal(cnt||0);
				if (!cnt)
					return Promise.resolve([null, Pages]);

				if (Pages.limitExceeded())
				{
					Pages = null;
					throw new FileErrors.HttpError(404);
				}

				return this.getClass('keywords')
					.getObjListByKwId(this, kw_id, Pages.getLimit(), Pages.getOffset())
					.then((a_ids)=>
					{
						if (!a_ids)
							return Promise.resolve([null, Pages]);

						return this.model('user/photo').getAlbumListByIds(a_ids)
							.then((albumList) =>
							{
								if (!albumList)
								{
									return Promise.resolve([null, Pages]);
								}

								let sizeParams = FileUpload.getUploadConfig(User.uploadPhotoConfigName).sizeParams;
								albumList = FileUpload.getPreviews(sizeParams, albumList)["obj"];

								return Promise.resolve([albumList, Pages]);
							});
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
			.then((album) =>
			{
				if (!album)
					return Promise.resolve(null);
				
				album["a_is_owner"] = (album["u_id"]        == u_id);
				album["a_profile"]  = (album["a_profile"]   == 1);
				album["a_named"]    = (album["a_named"]     == 1);
				
				this.helpers.nlTextSplit(album, 'a_text');
				
				return this.getClass('keywords').getObjKeyWords(this, album, 'a_id')
					.then((album)=>
					{
						return Promise.resolve(album);
					});
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
			.then((images) => 
			{
				if (!images)
					return [Pages, [], []];

				let sizeParams = FileUpload.getUploadConfig(User.uploadPhotoConfigName).sizeParams;
				let previews = FileUpload.getPreviews(sizeParams, images, true);
				
				images = previews['obj'];

				return [Pages, images, previews['previews']];
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
		let f_id, a_id;
		let ufile = {};
		
		const UploadFile = new FileUpload(UserPhoto.uploadPhotoConfigName, req, res);
		
		return UploadFile.upload()
			.then((file) =>
			{
				ufile = file;
				a_id = file.a_id;
				return this.model('user/photo')
					.addPhoto(u_id, file)
					.then((file) => 
					{
						ufile = file;
						f_id = file.f_id;
						
						file["moveToDir"] = FileUpload.getImageUri(file.a_id, file.f_id);
						
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
				if (file.type != FileUpload.TYPE_IMAGE)
					return Promise.resolve(file);
				
				return UploadFile.setImageGeo(file)
					.then((file) =>
					{
						return UploadFile.resize(file, User.uploadPhotoConfigName);
					});
			})
			.then((file) =>
			{
				//console.log(file);

				return this.model('user/photo')
					.updImage(u_id, file.a_id, file.f_id, file.latitude, file.longitude, '', file.webDirPath, file.name, file.type, true)
					.then(() => 
					{
						ufile = null;
						file["f_name"] = file.name;
						file["f_text"] = '';
						return Promise.resolve(file);
					});
			})
			.catch((err) =>
			{
				Logger.error(err);
				return this.delImage(u_id, a_id, f_id, ufile)
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
	 * @param f_id
	 * @returns {Promise}
	 */
	getImage(u_id, owner_u_id, f_id)
	{
		return this.model('user/photo').getImage(owner_u_id, f_id)
			.then((image) => {

				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: UserPhoto.getImage(u_id="+u_id+", f_id="+f_id+")");

				let sizeParams = FileUpload.getUploadConfig(User.uploadPhotoConfigName).sizeParams;
				image["f_is_owner"] = (image["u_id"] == u_id);
				image["previews"] = {};

				if (image["f_dir"])
				{
					image = FileUpload.getPreviews(sizeParams, image, true)["obj"];
				}
				return Promise.resolve(image);
			});
	}

	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param a_id
	 * @param f_id
	 * @param file
	 * @returns {Promise}
	 */
	delImage(u_id, a_id, f_id, file = {})
	{
		return FileUpload.deleteFile(file.path || '')
			.then(() =>
			{
				return this.getImage(u_id, u_id, f_id);
			})
			.then((image) =>
			{
				if (!image || image["a_id"] != a_id || !image["f_is_owner"])
					throw new FileErrors.io.FileNotFoundError();
				
				let dir = (image["f_dir"] ? image["f_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));
				
				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());
				
				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));
				
				return FileUpload.deleteDir(dir, true)
					.then(() =>
					{
						return this.model('user/photo').delImage(u_id, a_id, f_id);
					})
					.then(() =>
					{
						return Promise.resolve(image);
					});
			})
			.catch((err) =>
			{
				console.log('class UserPhoto delImage catch');
				Logger.error(err);
				console.log('\n');
				
				return this.model('user/photo').delImage(u_id, a_id, f_id)
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
	 * @param f_id
	 * @param f_text
	 */
	updImgText(u_id, a_id, f_id, f_text)
	{
		return this.model('user/photo').updImgText(u_id, a_id, f_id, f_text);
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param u_id
	 * @param a_id
	 * @param file_pos
	 * @returns {Promise}
	 */
	sortImgUpd(u_id, a_id, file_pos)
	{
		return this.model('user/photo').updSortImg(u_id, a_id, file_pos);
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
			.then((album) => 
			{
				if (!album || !album["a_named"])
					return Promise.resolve(album);

				let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig(User.uploadPhotoConfigName)["pathUpload"], FileUpload.getAlbumUri(a_id));

				return FileUpload.deleteDir(dir, true)
					.then(() => 
					{
						return this.model('user/photo').delAlbum(album.a_id, u_id)
							.then(() =>
							{
								return this.getClass('keywords').saveKeyWords(this, album['a_id']);
							})
							.then(() =>
							{
								return Promise.resolve(album);
							});
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhoto;