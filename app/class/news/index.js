"use strict";
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class News extends Base
{
	/**
	 * добавляем новое событие
	 *
	 * @param i_u_id
	 * @param s_n_title
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dd_show_ts
	 *
	 * @returns {*}
	 */
	add(i_u_id, s_n_title, t_n_notice, t_n_text, dd_show_ts)
	{
		let n_alias = this.helpers.clearSymbol(this.helpers.translit(s_n_title), '-');

		return this.model('news').add(i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dd_show_ts);
	}

	/**
	 * редактируем событие
	 *
	 * @param i_n_id
	 * @param i_u_id
	 * @param s_n_title
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dd_show_ts
	 *
	 * @returns {Promise.<TResult>}
	 */
	edit(i_n_id, i_u_id, s_n_title, t_n_notice, t_n_text, dd_show_ts)
	{
		let n_alias = this.helpers.clearSymbol(this.helpers.translit(s_n_title), '-');

		return this.model('news').edit(i_n_id, i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dd_show_ts);
	}

	/**
	 * данные новости по его id
	 *
	 * @param n_id
	 * @returns {*}
	 */
	get(n_id)
	{
		return this.model('news').getById(n_id);
	}

	/**
	 * список событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param i_limit
	 * @param i_offset
	 *
	 * @returns {*|Promise.<TResult>|*}
	 */
	getNews(i_limit, i_offset)
	{
		return this.model('news').getNews(i_limit, i_offset)
			.then(function (newsList)
			{
				if (!newsList)
					return Promise.resolve(null);

				let sizeParams = FileUpload.getUploadConfig('news').sizeParams;

				//let allPreviews = [];
				newsList.forEach(function (news, indx)
				{
					newsList[indx]["previews"] = {};
					if (news["ni_dir"])
					{
						news = FileUpload.getPreviews(sizeParams, news, "ni_dir", true)["obj"];
					}
				});

				return Promise.resolve(newsList);
			});
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
		let uploadConf = 'news';
		let ni_id, n_id;
		let ufile = {};

		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then(function(file)
			{
				ufile = file;
				n_id = file.n_id;
				
				return self.get(n_id)
					.then(function (event)
					{
						if (event["e_img_cnt"] >= 5)
							throw new FileErrors.LimitExceeded('Можно добавить не более 5 файлов.');

						return Promise.resolve(ufile);
					});
			})
			.then(function(file)
			{
				return self.model('news')
					.addPhoto(u_id, file)
					.then(function (file)
					{
						ni_id = file.ni_id;

						file["moveToDir"] = FileUpload.getImageUri(file.n_id, file.ni_id);

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

				return self.model('news')
					.updImage(file.n_id, file.ni_id, file.latitude, file.longitude, file.webDirPath, file.name, true)
					.then(function ()
					{
						ufile = null;
						file["ni_name"] = file.name;
						return Promise.resolve(file);
					});
			})
			.catch(function (err)
			{
				//console.log(ufile);
				Logger.error(err);
				return self.delImage(u_id, n_id, ni_id, ufile)
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
	 * @param ni_id
	 * @returns {*}
	 */
	getImage(ni_id)
	{
		return this.model('news').getImage(ni_id)
			.then(function (image)
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: EVents.getImage(ni_id="+ni_id+")");
				
				let sizeParams = FileUpload.getUploadConfig('news').sizeParams;
				image["previews"] = {};
				if (image["ni_dir"])
				{
					image = FileUpload.getPreviews(sizeParams, image, "ni_dir", false)["obj"];
				}
				return Promise.resolve(image);
			});
	}

	/***
	 * получаем фотографии для указанной новости
	 *
	 * @param n_id
	 * @return [images, allPreviews]
	 */
	getImageList(n_id)
	{
		return this.model('news').getImageList(n_id)
			.then(function (images)
			{
				if (!images)
					return [[], []];

				let sizeParams = FileUpload.getUploadConfig('news').sizeParams;

				let allPreviews = [];
				images.forEach(function (image, indx)
				{
					images[indx]["previews"] = {};
					if (image["ni_dir"])
					{
						let obj = FileUpload.getPreviews(sizeParams, image, "ni_dir", true);
						image = obj["obj"];

						allPreviews = allPreviews.concat(obj["previews"]);

						image["previews"]['orig'] = image["ni_dir"] + '/orig/' + image["ni_name"];
					}
				});

				return [images, allPreviews];
			});
	}
	
	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param n_id
	 * @param ni_id
	 * @param file
	 * @returns {*}
	 */
	delImage(u_id, n_id, ni_id, file = {})
	{
		//console.log(file);

		return FileUpload.deleteFile(file.path || '')
			.bind(this)
			.then(function ()
			{
				return this.getImage(ni_id);
			})
			.then(function (image)
			{
				if (!image || image["n_id"] != n_id)
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then(function (image)
			{
				let dir = (image["ni_dir"] ? image["ni_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.bind(this)
					.then(function ()
					{
						return this.model('news').delImage(n_id, ni_id);
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

				return this.model('news').delImage(n_id, ni_id)
					.then(function ()
					{
						throw err;
					});
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param n_id
	 * @param ni_pos
	 * @returns {*}
	 */
	sortImgUpd(n_id, ni_pos)
	{
		return this.model('news').updSortImg(n_id, ni_pos);
	}

	/**
	 * удаляем указанное событие
	 *
	 * @param u_id
	 * @param n_id
	 * @returns {Promise.<*>}
	 */
	delEvent(u_id, n_id)
	{
		return this.get(n_id)
			.bind(this)
			.then(function (news)
			{

				if (!news)
					return Promise.resolve(null);

				let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig('news')["pathUpload"], FileUpload.getAlbumUri(n_id));

				return FileUpload.deleteDir(dir, true)
					.then(function (done)
					{
						return Promise.resolve(news);
					});
			})
			.then(function (news)
			{
				if (!news)
					return Promise.resolve(n_id);

				return this.model('news').delEvent(news.n_id);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = News;