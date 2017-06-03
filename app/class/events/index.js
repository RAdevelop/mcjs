"use strict";
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class Events extends Base
{
	static get uploadConfigName()
	{
		return `events`;
	}

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
	 * @returns {Promise}
	 */
	add(i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);
		let e_alias = this.helpers.clearSymbol(this.helpers.translit(s_e_title), '-');

		return this.model('events')
			.add(i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
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
	 * @returns {Promise}
	 */
	edit(i_e_id, i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);
		let e_alias = this.helpers.clearSymbol(this.helpers.translit(s_e_title), '-');

		return this.model('events')
			.edit(i_e_id, i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
	}

	/**
	 * данные события по его id
	 *
	 * @param e_id
	 * @returns {Promise}
	 */
	get(e_id)
	{
		return this.model('events').getById(e_id)
			.then((eventData)=>
			{
				return this.getClass('keywords').getObjKeyWords(this, eventData, 'e_id')
					.then((eventData)=>
					{
						return Promise.resolve(eventData);
					});
			});
	}

	/**
	 * список событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param date_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {Promise}
	 */
	getEvents(date_ts, end_ts, l_id = null)
	{
		return this.model('events').getEvents(date_ts, end_ts, l_id)
			.then((eventList) =>
			{
				if (!eventList)
					return Promise.resolve(null);
				
				let sizeParams = FileUpload.getUploadConfig(Events.uploadConfigName).sizeParams;
				let list = FileUpload.getPreviews(sizeParams, eventList, false, true);
				eventList = list["obj"];
				list['previews'] = null;
				
				return Promise.resolve(eventList);
			});
	}

	getEventsByTag(Pages, s_tag)
	{
		return this.getClass('keywords').getKeyWordByName(s_tag)
			.then((kw)=>
			{
				if (!kw)
					return Promise.resolve([0, null]);

				return this.getClass('keywords').countObjByKwId(this, kw['kw_id'])
					.then((cnt)=>
					{
						return Promise.resolve([cnt, kw['kw_id']]);
					});
			})
			.spread((cnt, kw_id)=>
			{
				Pages.setTotal(cnt);
				if (!cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					throw new FileErrors.HttpError(404);

				return this.getClass('keywords')
					.getObjListByKwId(this, kw_id, Pages.getLimit(), Pages.getOffset())
					.then((obj_ids)=>
					{
						if (!obj_ids)
							return Promise.resolve([null, Pages]);

						return this.model('events').getEventsByIds(obj_ids)
							.then((eventList) =>
							{
								if (!eventList)
									return Promise.resolve([null, Pages]);

								let sizeParams = FileUpload.getUploadConfig(Events.uploadConfigName).sizeParams;
								eventList = FileUpload.getPreviews(sizeParams, eventList)["obj"];

								return Promise.resolve([eventList, Pages]);
							});
					});
			});
	}

	/**
	 * список дат событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param date_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {Promise}
	 */
	getEventsDate(date_ts, end_ts, l_id = null)
	{
		return this.model('events').getEventsDate(date_ts, end_ts, l_id)
			.then((eventsDate) => {
				//console.log("eventsDate = ", eventsDate);
				if (!eventsDate)
					return Promise.resolve([]);

				return Promise.resolve(eventsDate);
			});
	}

	/**
	 * список локаций, к которым привязаны события (включая родительские районы, города, страны..)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id
	 * @returns {Promise}
	 */
	getLocations(start_ts, end_ts, l_id = null)
	{
		return this.model('events').getLocations(start_ts, end_ts, l_id)
			.then((locations)=>
			{
				let placeList = {
					list: [],
					selected: {}
				};
				if (locations)
				{
					placeList['list'] = locations;
					locations.some((loc)=>
					{
						if (loc['l_id'] == l_id)
						{
							placeList['selected'] = loc;
							return true;
						}
						return false;
					});
				}
				return Promise.resolve(placeList);
			});
	}

	/**
	 * добавляем фотографию к событию
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 * @returns {Promise}
	 */
	uploadImage(u_id, req, res)
	{
		let f_id, e_id;
		let ufile = {};
		
		const UploadFile = new FileUpload(Events.uploadConfigName, req, res);
		let uploadConfig = FileUpload.getUploadConfig(Events.uploadConfigName);
		
		return UploadFile.upload()
			.then((file) =>
			{
				ufile = file;
				e_id = file.e_id;
				
				return this.get(e_id)
					.then((event) => 
					{
						uploadConfig.checkLimitFile(event["file_cnt"], FileErrors.LimitExceeded);
						
						return Promise.resolve(ufile);
					});
			})
			.then((file) => 
			{
				return this.model('events')
					.addPhoto(u_id, file)
					.then((file) => 
					{
						f_id = file.f_id;
						
						file["moveToDir"] = FileUpload.getImageUri(file.e_id, file.f_id);
						
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
				{
					file = FileUpload.getPreviews([], file, false, true)['obj'];
					return Promise.resolve(file);
				}
				
				return UploadFile.setImageGeo(file)
					.then((file) => 
					{
						return UploadFile.resize(file, Events.uploadConfigName);
					});
			})
			.then((file) =>
			{
				//console.log(file);
				return this.model('events')
					.updImage(
						file.e_id, file.f_id, file.latitude, file.longitude, 
						file.webDirPath, file.name, file.type, true
					)
					.then(() => 
					{
						ufile = null;
						file["f_name"] = file.name;
						return Promise.resolve(file);
					});
			})
			.catch((err) => 
			{
				//console.log(ufile);
				Logger.error(err);
				return this.delImage(u_id, e_id, f_id, ufile)
					.catch((delErr) => 
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
	 * @param f_id
	 * @returns {Promise}
	 */
	getImage(f_id)
	{
		f_id = parseInt(f_id, 10)||0;
		
		if (!f_id)
			return Promise.resolve(null);
		
		return this.model('events').getImage(f_id)
			.then((image) => 
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: EVents.getImage(f_id="+f_id+")");

				let sizeParams = FileUpload.getUploadConfig(Events.uploadConfigName).sizeParams;
				let previews = FileUpload.getPreviews(sizeParams, image, true);
				previews['previews'] = null;
				image = previews['obj'];

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
			.then((images) => 
			{
				if (!images)
					return [[], []];

				let sizeParams = FileUpload.getUploadConfig(Events.uploadConfigName).sizeParams;
				let previews = FileUpload.getPreviews(sizeParams, images, true);
				images = previews['obj'];

				return [images, previews['previews']];
			});
	}
	
	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param e_id
	 * @param f_id
	 * @param file
	 * @returns {Promise}
	 */
	delImage(u_id, e_id, f_id, file = {})
	{
		return FileUpload.deleteFile(file.path || '')
			.then(() => 
			{
				return this.getImage(f_id);
			})
			.then((image) => 
			{
				if (!image || image["e_id"] != e_id)
					throw new FileErrors.io.FileNotFoundError();
				
				return Promise.resolve(image);
			})
			.then((image) => 
			{
				let dir = (image["f_dir"] ? image["f_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.then(() => {
						return this.model('events').delImage(e_id, f_id);
					})
					.then(() => {
						return Promise.resolve(image);
					});
			})
			.catch((err) => {

				console.log('class Events delImage catch');
				Logger.error(err);
				console.log('\n');

				return this.model('events')
					.delImage(e_id, f_id)
					.then(() => {
						throw err;
					});
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param e_id
	 * @param file_pos
	 * @returns {Promise}
	 */
	sortImgUpd(e_id, file_pos)
	{
		return this.model('events').updSortImg(e_id, file_pos);
	}

	/**
	 * удаляем указанное событие
	 *
	 * @param u_id
	 * @param e_id
	 * @returns {Promise}
	 */
	delEvent(u_id, e_id)
	{
		e_id = parseInt(e_id, 10)||0;

		if (!!e_id === false)
			return Promise.resolve(null);

		return this.get(e_id)
			.then((event) =>
			{
				if (!event)
					return Promise.resolve(null);

				let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig(Events.uploadConfigName)["pathUpload"], FileUpload.getAlbumUri(e_id));

				return FileUpload.deleteDir(dir, true)
					.then(() =>
					{
						return this.model('events').delEvent(event['e_id'])
							.then(() =>
							{
								return this.getClass('keywords').saveKeyWords(this, event['e_id']);
							});
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;