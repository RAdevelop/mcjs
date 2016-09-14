"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
//const Path = require('path');

const UserPhoto = require('app/class/user/photo');

class UserPhotoProfile extends UserPhoto
{
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
		let ufile = {};

		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then(function(file)
			{
				ufile = file;

				return self.model('user/photo')
					.addProfilePhoto(u_id, file)
					.then(function (file)
					{
						ufile = file;

						ai_id = file.ai_id;
						a_id = file.a_id;

						file["moveToDir"] = FileUpload.getImageUri(file.a_id, file.ai_id);

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
					.updImage(u_id, file.a_id, file.ai_id, file.latitude, file.longitude, '', file.webDirPath, file.name, true, 1)
					.then(function ()
					{
						ufile = null;
						return Promise.resolve(file);
					});
			})
			.catch(function (err)
			{
				return self.getClass('user/photo').delImage(u_id, a_id, ai_id, ufile)
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
	 * получаем фотографию профиля пользователя
	 *
	 * @param u_id
	 * @returns {*}
	 */
	getUserAva(u_id)
	{
		return this.model('user/photo/profile').getUserAva(u_id)
			.then(function (ava)
			{
				ava["previews"] = {};
				if (!ava || !ava["ai_id"])
					return Promise.resolve(ava);

				let sizeParams = FileUpload.getUploadConfig('user_ava').sizeParams;

				ava = Object.assign(ava, FileUpload.getPreviews(sizeParams, ava, "ai_dir")["obj"]);

				return Promise.resolve(ava);
			});
	}

	/**
	 * получаем аватарки указанных юзеров
	 *
	 * @param user_ids
	 * @returns {Promise.<TResult>}
	 */
	getUsersAva(users_ids = [])
	{
		return this.model('user/photo/profile').getUsersAva(users_ids)
			.then(function (ava)
			{
				let sizeParams = FileUpload.getUploadConfig('user_ava').sizeParams;

				Object.keys(ava).forEach(function (i, item)
				{
					ava[i] = Object.assign(ava[i], FileUpload.getPreviews(sizeParams, ava[i], "ai_dir")["obj"]);
				});

				return Promise.resolve(ava);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhotoProfile;