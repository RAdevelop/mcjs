"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const FileErrors = require('app/lib/file/errors');
const FileUpload = require('app/lib/file/upload');
const Crypto = require('crypto');
const Path = require('path');
const User = require('app/class/user');

class Photo extends User
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
	 * загрузка фото профиля
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 *
	 * @returns {Promise.<TResult>}
	 */
	uploadProfile(u_id, req, res)
	{
		const self = this;
		let uploadConf = 'user_ava';
		let ai_id, a_id;

		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then(function(file)
			{
				return self.model('user/photo')
					.addProfilePhoto(u_id, file)
					.then(function (file)
					{
						ai_id = file.ai_id;
						a_id = file.a_id;

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
				let dir = Path.dirname(UploadFile.getUploadDir());

				//console.log('dir for del = ', dir);

				return FileUpload.deleteDir(dir, true)
					.then(function ()
					{
						self.model('user/photo').delImage(u_id, a_id, ai_id)
							.then(function ()
							{
								throw err;
							});
					})
					.catch(function (delErr)
					{
						if (delErr.name == 'DirectoryNotFoundError')
							throw err;

						throw delErr;
					});

				/*switch (err.name)
				{
					case 'FileTooBig':
					case 'FileType':
					case 'FileTokenError':
						throw err;
						break;

					default:
						return UploadFile.deleteDir(UploadFile.getUploadDir(), true)
							.then(function ()
							{
								throw err;
							})
							.catch(function (delErr)
							{
								console.log('in router');
								console.log(err);//TODO логировать ошибку в файл

								throw delErr;
							});
						break;
				}*/
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Photo;