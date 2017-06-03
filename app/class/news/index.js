"use strict";
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class News extends Base
{
	static get uploadConfigName()
	{
		return `news`;
	}
	/**
	 * добавляем новое событие
	 *
	 * @param i_u_id
	 * @param s_n_title
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dt_show_ts
	 * @param n_show
	 *
	 * @returns {Promise}
	 */
	add(i_u_id, s_n_title, t_n_notice, t_n_text, dt_show_ts, n_show = 0)
	{
		let n_alias = this.helpers.clearSymbol(this.helpers.translit(s_n_title), '-');

		return this.model('news').add(i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dt_show_ts, n_show);
	}

	/**
	 * редактируем событие
	 *
	 * @param i_n_id
	 * @param i_u_id
	 * @param s_n_title
	 * @param t_n_notice
	 * @param t_n_text
	 * @param dt_show_ts
	 * @param n_show
	 *
	 * @returns {Promise}
	 */
	edit(i_n_id, i_u_id, s_n_title, t_n_notice, t_n_text, dt_show_ts, n_show = 0)
	{
		let n_alias = this.helpers.clearSymbol(this.helpers.translit(s_n_title), '-');

		return this.model('news').edit(i_n_id, i_u_id, s_n_title, n_alias, t_n_notice, t_n_text, dt_show_ts, n_show);
	}

	/**
	 * данные новости по его id
	 *
	 * @param n_id
	 * @param n_show
	 * @returns {Promise}
	 */
	get(n_id, n_show = null)
	{
		return this.model('news').getById(n_id, n_show)
			.then((news)=>
			{
				if (!news)
					return Promise.resolve(null);

				return this.getClass('keywords').getObjKeyWords(this, news, 'n_id')
					.then((news)=>
					{
						return Promise.resolve(news);
					});
			});
	}

	/**
	 * список событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param Pages
	 * @param n_show
	 *
	 * @returns {Promise}
	 */
	getNews(Pages, n_show = null)
	{
		return this.model('news').countNews(n_show)
			.then((cnt) => 
			{
				Pages.setTotal(cnt);
				
				if (!cnt)
					return [null, Pages];
				
				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpError(404));
				
				return this.model('news').getNews(Pages.getLimit(), Pages.getOffset(), n_show)
					.then((newsList) => 
					{
						if (!newsList)
							return Promise.resolve([null, Pages]);
						
						let sizeParams = FileUpload.getUploadConfig(News.uploadConfigName).sizeParams;
						newsList = FileUpload.getPreviews(sizeParams, newsList, false)['obj'];
						
						return Promise.resolve([newsList, Pages]);
					});
			});
	}
	
	getNewsListByTag(Pages, s_tag)
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
					return Promise.reject(new FileErrors.HttpError(404));
				
				return this.getClass('keywords').getObjListByKwId(this, kw_id, Pages.getLimit(), Pages.getOffset())
					.then((obj_ids)=>
					{
						if (!obj_ids)
							return Promise.resolve([null, Pages]);
						
						return this.model('news').getNewsListByIds(obj_ids, 1)
							.then((newsList) =>
							{
								//console.log('newsList = ', newsList);
								
								if (!newsList)
									return Promise.resolve([null, Pages]);
								
								let sizeParams = FileUpload.getUploadConfig(News.uploadConfigName).sizeParams;
								newsList = FileUpload.getPreviews(sizeParams, newsList, false)['obj'];
								
								return Promise.resolve([newsList, Pages]);
							});
					});
			});
	}
	
	/**
	 * добавляем файл к статье
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 * @returns {Promise}
	 */
	uploadFile(u_id, req, res)
	{
		let f_id, n_id;
		let ufile = {};
		
		const UploadFile = new FileUpload(News.uploadConfigName, req, res);
		
		let uploadConfig = FileUpload.getUploadConfig(News.uploadConfigName);
		return UploadFile.upload()
			.then((file) =>
			{
				ufile = file;
				n_id = file.n_id;
				
				return this.get(n_id).then((news) => 
				{
					uploadConfig.checkLimitFile(news["file_cnt"], FileErrors.LimitExceeded);
					
					return Promise.resolve(ufile);
				});
			})
			.then((file) =>
			{
				return this.model('news').addFile(u_id, file)
					.then((file) =>
					{
						f_id = file.f_id;
						
						file["moveToDir"] = FileUpload.getImageUri(file.n_id, file.f_id);
						
						return new Promise((resolve, reject) =>
						{
							UploadFile.moveUploadedFile(file, file["moveToDir"], (err, file) =>
							{
								if (err)
									return reject(err);
								
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
						return UploadFile.resize(file, News.uploadConfigName);
					});
			})
			.then((file) =>
			{
				//console.log(__dirname, file);
				
				return this.model('news')
					.updFile(
						file.n_id, file.f_id, file.latitude, file.longitude, 
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
				return this.delFile(u_id, n_id, f_id, ufile)
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
	 * получаем данные для указанного файла
	 *
	 * @param f_id
	 * @returns {Promise}
	 */
	getFile(f_id)
	{
		f_id = parseInt(f_id, 10)||0;
		
		if (!f_id)
		return Promise.resolve(null);
		
		return this.model('news').getFile(f_id)
			.then((image) =>
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: News.getFile(f_id="+f_id+")");
				
				let sizeParams = FileUpload.getUploadConfig(News.uploadConfigName).sizeParams;
				let previews = FileUpload.getPreviews(sizeParams, image, false, true);
				previews['previews'] = null;
				
				image = previews['obj'];
				
				return Promise.resolve(image);
			});
	}
	
	/***
	 * получаем файлы для указанной новости
	 *
	 * @param n_id
	 * @return [images, allPreviews]
	 */
	getFileList(n_id)
	{
		return this.model('news').getFileList(n_id)
			.then((file_list) => 
			{
				if (!file_list)
					return [[], []];
				
				let sizeParams = FileUpload.getUploadConfig(News.uploadConfigName).sizeParams;
				let previews = FileUpload.getPreviews(sizeParams, file_list, true, true);
				
				file_list = previews['obj'];
				
				return [file_list, previews['previews']];
			});
	}
	
	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param n_id
	 * @param f_id
	 * @param file
	 * @returns {Promise}
	 */
	delFile(u_id, n_id, f_id, file = {})
	{
		//console.log(file);
		
		return FileUpload.deleteFile(file.path || '')
			.then(() => 
			{
				return this.getFile(f_id);
			})
			.then((image) => 
			{
				if (!image || image["n_id"] != n_id)
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
					.then(() => 
					{
						return this.model('news').delFile(n_id, f_id);
					})
					.then(() => 
					{
						return Promise.resolve(image);
					});
			})
			.catch((err) => 
			{
				console.log('class News delImage catch');
				Logger.error(err);
				console.log('\n');
				
				return this.model('news').delFile(n_id, f_id)
					.then(() =>
					{
						throw err;
					});
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param n_id
	 * @param file_pos
	 * @returns {Promise}
	 */
	sortImgUpd(n_id, file_pos)
	{
		return this.model('news').updSortImg(n_id, file_pos);
	}

	/**
	 * удаляем
	 *
	 * @param news
	 * @returns {Promise}
	 */
	delNews(news)
	{
		news['n_id'] = parseInt(news['n_id'], 10)||0;
		if (!news || !!news['n_id'] === false)
			return Promise.resolve(0);
		
		let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig(News.uploadConfigName)["pathUpload"], FileUpload.getAlbumUri(news['n_id']));
		
		return FileUpload.deleteDir(dir, true)
			.then(() =>
			{
				return this.model('news').delNews(news['n_id']);
			})
			.then(() =>
			{
				return Promise.all([
					this.getClass('keywords').saveKeyWords(this, news['n_id']),
					this.getClass('comment').deleteCommentForObj(this, news['n_id'])
				]);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = News;