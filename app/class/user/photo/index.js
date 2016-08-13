"use strict";

//const Errors = require('app/lib/errors');
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
		return this.model('user/photo').createAlbumNamed(u_id, a_name, a_text);
	}

	/**
	 * список фотоальбомов пользователя
	 * @param u_id
	 * @returns {*}
	 */
	getAlbumList(u_id)
	{
		return this.model('user/photo').getAlbumList(u_id)
			.then(function (albums)
			{
				if (albums["info"]["numRows"] == 0)
					return Promise.resolve(null);

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

				albums.forEach(function (album)
				{
					if (!album["previews"]) album["previews"] = [];
					if (album["ai_dir"])
					{
						sizeParams.forEach(function (size)
						{
							album["previews"][size.w+'_'+size.h] = album["ai_dir"] + '/' + size.w+'_'+size.h +'.jpg';
						});
					}
				});
				//console.log(albums);
				return Promise.resolve(albums);
			});
	}

	/**
	 * выбранный альбом пользователя
	 * @param u_id
	 * @param a_id
	 * @returns {*}
	 */
	getAlbum(u_id, a_id)
	{
		return this.model('user/photo').getAlbum(u_id, a_id)
			.then(function (album)
			{
				if (!album)
					return Promise.resolve(null);

				return Promise.resolve(album);
			});
	}

	getAlbumImages(u_id, a_id)
	{
		return this.model('user/photo').getAlbumImages(u_id, a_id)
			.then(function (images)
			{
				if (!images)
					return Promise.resolve([]);

				let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

				let imgSuffix;
				let imgPath;
				images["previews"] = [];
				images.forEach(function (image, indx)
				{
					images[indx]["previews"] = {};
					if (image["ai_dir"])
					{
						sizeParams.forEach(function (size)
						{
							imgSuffix   = size.w+'_'+size.h;
							imgPath     = image["ai_dir"] + '/' + imgSuffix +'.jpg';

							images[indx]["previews"][imgSuffix] = imgPath;
							images["previews"].push(imgPath);
						});
					}
				});

				return Promise.resolve(images);
			});
	}

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
		return this.model('user/photo').getImage(u_id, ai_id)
			.bind(this)
			.then(function (image)
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then(function (image)
			{
				let dir = (image["ai_dir"] ? image["ai_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				if (FileUpload.isForbiddenDir(dir))
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

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
				console.log('class UserPhoto delImage');
				console.log(err);
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
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhoto;