"use strict";
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class Events extends Base
{
	/**
	 * добавляем новое событие
	 *
	 * @param i_u_id
	 * @param s_e_title
	 * @param t_e_notice
	 * @param t_e_text
	 * @param s_e_address
	 * @param f_e_lat
	 * @param f_e_lng
	 * @param i_location_id
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {*}
	 */
	add(i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);
		let e_alias = this.helpers.translit(s_e_title);

		return this.model('events').add(i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
	}

	/**
	 * редактируем событие
	 *
	 * @param i_e_id
	 * @param i_u_id
	 * @param s_e_title
	 * @param t_e_notice
	 * @param t_e_text
	 * @param s_e_address
	 * @param f_e_lat
	 * @param f_e_lng
	 * @param i_location_id
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {Promise.<TResult>}
	 */
	edit(i_e_id, i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);
		let e_alias = this.helpers.translit(s_e_title);

		return this.model('events').edit(i_e_id, i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
	}

	/**
	 * данные события по его id
	 *
	 * @param e_id
	 * @returns {*}
	 */
	get(e_id)
	{
		return this.model('events').getById(e_id);
	}

	/**
	 * список событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {*|Promise.<TResult>|*}
	 */
	getEvents(date_ts, end_ts = null, l_id = null)
	{
		return this.model('events').getEvents(date_ts, end_ts, l_id);
	}

	/**
	 * список дат событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {*|Promise.<TResult>|*}
	 */
	getEventsDate(date_ts, end_ts, l_id = null)
	{
		return this.model('events').getEventsDate(date_ts, end_ts, l_id)
			.then(function (eventsDate)
			{
				//console.log("eventsDate = ", eventsDate);
				if (!eventsDate)
					return Promise.resolve([]);

				return Promise.resolve(eventsDate);
			});
	}

	/**
	 * список локаций, к которым привязаны события (включая родительские районы, города, страны..)
	 *
	 * @returns {*}
	 */
	getLocations()
	{
		return this.model('events').getLocations();
	}

	/**
	 * добавляем фотографию к событию
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 * @returns {Promise.<TResult>}
	 */
	uploadImage(u_id, req, res)
	{
		const self = this;
		let uploadConf = 'events';
		let ei_id, e_id;
		let ufile = {};

		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then(function(file)
			{
				ufile = file;
				e_id = file.e_id;
				
				return self.get(e_id)
					.then(function (event)
					{
						if (event["e_img_cnt"] >= 5)
							throw new FileErrors.LimitExceeded('Можно добавить не более 5 файлов.');

						return Promise.resolve(ufile);
					});
			})
			.then(function(file)
			{
				return self.model('events')
					.addPhoto(u_id, file)
					.then(function (file)
					{
						ei_id = file.ei_id;

						file["moveToDir"] = FileUpload.getImageUri(file.e_id, file.ei_id);

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

				return self.model('events')
					.updImage(file.e_id, file.ei_id, file.latitude, file.longitude, file.webDirPath, file.name, true)
					.then(function ()
					{
						ufile = null;
						file["ei_name"] = file.name;
						return Promise.resolve(file);
					});
			})
			.catch(function (err)
			{
				//console.log(ufile);
				Logger.error(err);
				return self.delImage(u_id, e_id, ei_id, ufile)
					.catch(function (delErr)
					{
						switch (err.name)
						{
							case 'FileTooBig':
							case 'FileType':
							case 'FileTokenError':
							case 'LimitExceeded':
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
	 * получаем данные для указанной фотографии
	 *
	 * @param ei_id
	 * @returns {*}
	 */
	getImage(ei_id)
	{
		return this.model('events').getImage(ei_id)
			.then(function (image)
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: EVents.getImage(ei_id="+ei_id+")");
				
				let sizeParams = FileUpload.getUploadConfig('events').sizeParams;
				image["previews"] = {};
				if (image["ei_dir"])
				{
					image = FileUpload.getPreviews(sizeParams, image, "ei_dir", false)["obj"];
				}
				return Promise.resolve(image);
			});
	}

	/***
	 * получаем фотографии для указанного события
	 *
	 * @param e_id
	 * @return [images, allPreviews]
	 */
	getImageList(e_id)
	{
		return this.model('events').getImageList(e_id)
			.then(function (images)
			{
				if (!images)
					return [[], []];

				let sizeParams = FileUpload.getUploadConfig('events').sizeParams;

				let allPreviews = [];
				images.forEach(function (image, indx)
				{
					images[indx]["previews"] = {};
					if (image["ei_dir"])
					{
						let obj = FileUpload.getPreviews(sizeParams, image, "ei_dir", true);
						image = obj["obj"];

						allPreviews = allPreviews.concat(obj["previews"]);

						image["previews"]['orig'] = image["ei_dir"] + '/orig/' + image["ei_name"];
					}
				});

				return [images, allPreviews];
			});
	}
	
	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param e_id
	 * @param ei_id
	 * @param file
	 * @returns {*}
	 */
	delImage(u_id, e_id, ei_id, file = {})
	{
		//console.log(file);

		return FileUpload.deleteFile(file.path || '')
			.bind(this)
			.then(function ()
			{
				return this.getImage(ei_id);
			})
			.then(function (image)
			{
				if (!image || image["e_id"] != e_id)
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then(function (image)
			{
				let dir = (image["ei_dir"] ? image["ei_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.bind(this)
					.then(function ()
					{
						return this.model('events').delImage(e_id, ei_id);
					})
					.then(function ()
					{
						return Promise.resolve(image);
					});
			})
			.catch(function (err)
			{
				console.log('class Events delImage catch');
				Logger.error(err);
				console.log('\n');

				return this.model('events').delImage(e_id, ei_id)
					.then(function ()
					{
						throw err;
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;