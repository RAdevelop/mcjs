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
	 * @returns {Promise}
	 */
	uploadProfile(u_id, req, res)
	{
		let ai_id, a_id;
		let ufile = {};

		const UploadFile = new FileUpload(UserPhoto.uploadAvaConfigName, req, res);

		return UploadFile.upload()
			.then((file) =>
			{
				ufile = file;

				return this.model('user/photo')
					.addProfilePhoto(u_id, file)
					.then((file) =>
					{
						ufile = file;

						ai_id = file.ai_id;
						a_id = file.a_id;

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
						return UploadFile.resize(file, UserPhoto.uploadAvaConfigName);
					});
			})
			.then((file) =>
			{
				//console.log(file);

				return this.model('user/photo')
					.updImage(u_id, file.a_id, file.ai_id, file.latitude, file.longitude, '', file.webDirPath, file.name, true, 1)
					.then(() =>
					{
						ufile = null;
						return Promise.resolve(file);
					});
			})
			.catch((err) =>
			{
				return this.getClass('user/photo').delImage(u_id, a_id, ai_id, ufile)
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
	 * получаем фотографию профиля пользователя
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	getUserAva(u_id)
	{
		return this.model('user/photo/profile').getUserAva(u_id)
			.then((ava) =>
			{
				ava["previews"] = {};

				if (!ava || !ava["ai_id"])
					return Promise.resolve(ava);

				let sizeParams = FileUpload.getUploadConfig(UserPhoto.uploadAvaConfigName).sizeParams;

				ava = Object.assign(ava, FileUpload.getPreviews(sizeParams, ava, "ai_dir")["obj"]);

				return Promise.resolve(ava);
			});
	}

	/**
	 * получаем аватарки указанных юзеров
	 *
	 * @param users_ids
	 * @returns {Promise}
	 */
	getUsersAva(users_ids = [])
	{
		return this.model('user/photo/profile').getUsersAva(users_ids)
			.then((ava) =>
			{
				let sizeParams = FileUpload.getUploadConfig(UserPhoto.uploadAvaConfigName).sizeParams;

				Object.keys(ava).forEach((i) =>
				{
					Object.assign(ava[i], FileUpload.getPreviews(sizeParams, ava[i], "ai_dir")["obj"]);
				});

				return Promise.resolve(ava);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhotoProfile;