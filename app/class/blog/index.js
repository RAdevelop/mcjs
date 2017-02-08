"use strict";
const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class Blog extends Base
{
	static get keyWordsObjName()
	{
		return 'blog_list';
	}

	/**
	 * добавляем контент в блог
	 *
	 * @param i_u_id
	 * @param s_title
	 * @param t_notice
	 * @param t_text
	 * @param ui_bs_id
	 * @param b_show
	 *
	 * @returns {Promise}
	 */
	add(i_u_id, s_title, t_notice, t_text, ui_bs_id, b_show = 0)
	{
		let s_alias = this.helpers.clearSymbol(this.helpers.translit(s_title), '-');

		return this.model('blog').add(i_u_id, s_title, s_alias, t_notice, t_text, ui_bs_id, b_show);
	}

	/**
	 * редактируем контент блога
	 *
	 * @param b_id
	 * @param i_u_id
	 * @param s_title
	 * @param t_notice
	 * @param t_text
	 * @param ui_bs_id
	 * @param b_show
	 *
	 * @returns {Promise}
	 */
	edit(b_id, i_u_id, s_title, t_notice, t_text, ui_bs_id, b_show = 0)
	{
		let s_alias = this.helpers.clearSymbol(this.helpers.translit(s_title), '-');

		return this.model('blog').edit(b_id, i_u_id, s_title, s_alias, t_notice, t_text, ui_bs_id, b_show);
	}

	/**
	 * данные контента блога по его id
	 *
	 * @param b_id
	 * @param i_u_id
	 * @param b_show
	 * @returns {Promise}
	 */
	getBlogById(b_id, i_u_id=null, b_show = null)
	{
		return this.model('blog').getBlogById(b_id, i_u_id, b_show)
			.then((blog)=>
			{
				if (!blog)
					return Promise.resolve(blog);

				blog['kw_names'] = [];

				return this.getClass('keywords').getObjKeyWords(blog['b_id'], Blog.keyWordsObjName)
					.then((kw_list)=>
					{
						if (kw_list && kw_list.length > 0)
						{
							blog['kw_names'] = kw_list.map((kw)=>
							{
								return kw['kw_name'];
							});
						}
						return Promise.resolve(blog);
					});
			});
	}

	/**
	 *
	 * @param Pages
	 * @param b_show
	 * @param i_u_id
	 * @param ui_bs_id
	 * @param s_bs_alias
	 *
	 * @returns {Promise}
	 */
	getBlogList(Pages, b_show = null, i_u_id = null, ui_bs_id=null, s_bs_alias=null)
	{
		return this.model('blog').countBlog(b_show, i_u_id, ui_bs_id, s_bs_alias)
			.then((cnt) =>
			{
				Pages.setTotal(cnt);

				if (!cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpError(404));

				return this.model('blog')
					.getBlogList(Pages.getLimit(), Pages.getOffset(), b_show, i_u_id, ui_bs_id, s_bs_alias)
					.then((blogList) =>
					{
						if (!blogList)
							return Promise.resolve([null, Pages]);

						Blog._blogPreviews(blogList);

						return Promise.resolve([blogList, Pages]);
					});
			});
	}

	getBlogListByTag(Pages, s_tag)
	{
		return this.getClass('keywords').getKeyWordByName(s_tag)
			.then((kw)=>
			{
				if (!kw)
					return Promise.resolve([0, null]);

				return this.getClass('keywords').countObjByKwId(kw['kw_id'], Blog.keyWordsObjName)
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

				return this.getClass('keywords')
					.getObjListByKwId(kw_id, Blog.keyWordsObjName, Pages.getLimit(), Pages.getOffset())
					.then((obj_ids)=>
					{
						if (!obj_ids)
							return Promise.resolve([null, Pages]);

						return this.model('blog').getBlogListByIds(obj_ids, 1)
							.then((blogList) =>
							{
								//console.log('blogList = ', blogList);

								if (!blogList)
									return Promise.resolve([null, Pages]);

								Blog._blogPreviews(blogList);

								return Promise.resolve([blogList, Pages]);
							});
					});
			});
	}

	static _blogPreviews(list)
	{
		let sizeParams = FileUpload.getUploadConfig('user_blog').sizeParams;

		list.forEach((item, indx) =>
		{
			list[indx]["previews"] = {};
			if (item["bi_dir"])
				list[indx] = FileUpload.getPreviews(sizeParams, item, "bi_dir", true)["obj"];
		});

		//return blogList; можно не возвращать. объекты в JS "передаются" по ссылке
	}

	/**
	 * добавляем фотографию
	 *
	 * @param u_id
	 * @param req
	 * @param res
	 * @returns {Promise}
	 */
	uploadImage(u_id, req, res)
	{
		let uploadConf = 'user_blog';
		let bi_id, b_id;
		let ufile = {};

		const UploadFile = new FileUpload(uploadConf, req, res);

		return UploadFile.upload()
			.then((file) =>
			{
				ufile = file;
				b_id = file['b_id'];
				
				return this.getBlogById(b_id)
					.then((blog) =>
					{
						if (blog["b_img_cnt"] >= 10)
							throw new FileErrors.LimitExceeded('Можно добавить не более 10 файлов.');

						return Promise.resolve(ufile);
					});
			})
			.then((file) =>
			{
				return this.model('blog').addPhoto(u_id, file)
					.then((file) =>
					{
						bi_id = file['bi_id'];

						file["moveToDir"] = FileUpload.getImageUri(file['b_id'], file['bi_id']);

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

				return this.model('blog')
					.updImage(file.b_id, file.bi_id, file.latitude, file.longitude, file.webDirPath, file.name, true)
					.then(() =>
					{
						ufile = null;
						file["bi_name"] = file.name;
						return Promise.resolve(file);
					});
			})
			.catch((err) =>
			{
				//console.log(ufile);
				Logger.error(err);
				return this.delImage(u_id, b_id, bi_id, ufile)
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
	 * @param bi_id
	 * @returns {Promise}
	 */
	getImage(bi_id)
	{
		return this.model('blog').getImage(bi_id)
			.then((image) =>
			{
				if (!image)
					throw new FileErrors.io.FileNotFoundError("фотография не найдена: Blog.getImage(bi_id="+bi_id+")");
				
				let sizeParams = FileUpload.getUploadConfig('user_blog').sizeParams;
				image["previews"] = {};

				if (image["bi_dir"])
					image = FileUpload.getPreviews(sizeParams, image, "bi_dir", false)["obj"];

				return Promise.resolve(image);
			});
	}

	/***
	 * получаем фотографии
	 *
	 * @param bi_id
	 * @return [images, allPreviews]
	 */
	getImageList(bi_id)
	{
		return this.model('blog').getImageList(bi_id)
			.then((images) =>
			{
				if (!images)
					return [[], []];

				let sizeParams = FileUpload.getUploadConfig('user_blog').sizeParams;

				let allPreviews = [];
				images.forEach((image, indx) =>
				{
					images[indx]["previews"] = {};
					if (image["bi_dir"])
					{
						let obj = FileUpload.getPreviews(sizeParams, image, "bi_dir", true);
						image = obj["obj"];

						allPreviews = allPreviews.concat(obj["previews"]);

						image["previews"]['orig'] = image["bi_dir"] + '/orig/' + image["bi_name"];
					}
				});

				return [images, allPreviews];
			});
	}
	
	/**
	 * удаление фотографии
	 *
	 * @param u_id
	 * @param b_id
	 * @param bi_id
	 * @param file
	 * @returns {Promise}
	 */
	delImage(u_id, b_id, bi_id, file = {})
	{
		//console.log(file);

		return FileUpload.deleteFile(file.path || '')
			.then(() =>
			{
				return this.getImage(bi_id);
			})
			.then((image) =>
			{
				if (!image || image["b_id"] != b_id)
					throw new FileErrors.io.FileNotFoundError();

				return Promise.resolve(image);
			})
			.then((image) =>
			{
				let dir = (image["bi_dir"] ? image["bi_dir"] : (file["webDirPath"] ? file["webDirPath"] : null));

				if (!dir)
					return Promise.reject(new FileErrors.io.DirectoryNotFoundError());

				dir = Path.dirname(Path.join(FileUpload.getDocumentRoot, dir));

				return FileUpload.deleteDir(dir, true)
					.then(() =>
					{
						return this.model('blog').delImage(b_id, bi_id);
					})
					.then(() =>
					{
						return Promise.resolve(image);
					});
			})
			.catch((err) =>
			{
				console.log('class Events delImage catch');
				Logger.error(err);

				return this.model('blog').delImage(b_id, bi_id)
					.then(() =>
					{
						throw err;
					});
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param b_id
	 * @param bi_pos
	 * @returns {Promise}
	 */
	sortImgUpd(b_id, bi_pos)
	{
		return this.model('blog').updSortImg(b_id, bi_pos);
	}

	/**
	 * удаляем
	 *
	 * @param u_id
	 * @param b_id
	 * @returns {Promise}
	 */
	delBlog(u_id, b_id)
	{
		return Promise.resolve(b_id)
			.then((b_id) =>
			{
				let dir = Path.join(FileUpload.getDocumentRoot, FileUpload.getUploadConfig('user_blog')["pathUpload"], FileUpload.getAlbumUri(b_id));

				return FileUpload.deleteDir(dir, true)
					.then(() =>
					{
						return this.model('blog').delBlog(b_id);
					});
			});
	}

	getBlogSubjectList(bs_id = null, i_u_id = null, b_show = 1)
	{
		return this.model('blog').getBlogSubjectList(i_u_id, b_show)
			.then((list)=>
			{
				let blogSubjects = {
					list: [],
					selected: null
				};
				
				if (!list || list.length == 0)
					return Promise.resolve(blogSubjects);
				
				blogSubjects.list = list.map((subj)=>
				{
					subj['b_selected'] = (subj['bs_id'] == bs_id);
					if (subj['b_selected'])
					{
						blogSubjects.selected = subj;
					}
					return subj;
				});

				return Promise.resolve(blogSubjects);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Blog;