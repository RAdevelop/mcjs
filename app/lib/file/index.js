"use strict";

const AppConfig = require('app/config');
const FS = require('node-fs');

const Mime = require('mime');
const Path = require('path');
const Promise = require("bluebird");
const GM = require('gm');
const FileErrors = require('./errors');

/**
 * список директорий для загрузки файлов
 * @type {Array}
 */
let uploadDirs = [];
Object.keys(AppConfig.uploads).forEach(function (key)
{
	uploadDirs.push(AppConfig.uploads[key]["pathUpload"]);
});

//console.log(uploadDirs);
//рефакторинг в lib/file - получение списка директорий для загрузки


class File
{
	constructor(req, res)
	{
		this.req  = req;
		this.res  = res;
	}

	set req(req)
	{
		this._req = req;
	}
	get req()
	{
		return this._req;
	}

	set res(res)
	{
		this._res = res;
	}
	get res()
	{
		return this._res;
	}

	static fs()
	{
		return FS;
	}

	/**
	 * 1 Кбайт в байтах
	 *
	 * @returns {number}
	 *
	 */
	static get KILOBYTE()
	{
		return 1024;
	}

	/**
	 * 1 мегабайт в байтах
	 *
	 * @returns {number}
	 *
	 */
	static get MEGABYTE()
	{
		return 1048576;
	}

	static megaByteToByte(megaByte)
	{
		return megaByte * this.MEGABYTE;
	}

	static megaToKiloByte(megaByte, floor = false)
	{
		if (floor)
		return Math.floor(megaByte * this.KILOBYTE);

		return (megaByte * this.KILOBYTE);
	}

	/**
	 * 1 гигабайт в байтах
	 *
	 * @returns {number}
	 */
	static get GIGABYTE()
	{
		return 1073741824;
	}

	static get Mime()
	{
		return Mime;
	}

	/**
	 *
	 * @param file - json данные файла
	 * @returns {file}
	 */
	mimeType(file)
	{
		let type = Mime.lookup(file.path).split('/');
		file["type"] = type[0] || null;
		file["ext"] = type[1] || null;

		return file;
	}

	static get getDocumentRoot()
	{
		return AppConfig["document_root"];
	}

	static get imageTypes()
	{
		return ['gif', 'png', 'jpg', 'jpeg'];
	}

	static get videoTypes()
	{
		return ['avi', 'mp4', '3gp', 'mpeg', 'mov', 'flv', 'wmv'];
	}

	static getUploadConfig(type)
	{
		let uploadOpts = (AppConfig.uploads[type] ? AppConfig.uploads[type] : AppConfig.uploads.default);

		//uploadOpts["tokenFields"] = ['i_time'];
		uploadOpts["fileSizeLimit"] = this.megaToKiloByte(uploadOpts.maxFileSize, true);

		return uploadOpts;
	}

	/**
	 *
	 * @param file - объект json данных файла
	 * @param w - ширина
	 * @param h - высота
	 * @return Promise
	 */
	resizeImage(file, w, h)
	{
		//const self = this;
		return new Promise(function(resolve, reject)
		{
			let filePrefix = w + '_' + h;
			let fileName = filePrefix + '.jpg';
			let filePathTo = Path.join(file.fullPathMainDir, fileName);
			let fileUrl = Path.join(Path.dirname(file.webFilePath), '../', fileName);

			GM(file.fullFilePath)
			.size(function (err, size)
			{
				if (err)
				{
					/*if (!File.isForbiddenDir(file.fullFilePath))
					{
						FS.unlink(file.fullFilePath, function(err){
							//console.log(err);
						});
					}*/
					return reject(new FileErrors.FileGetImageSize(err));
				}

				//console.log(size.width > size.height ? 'size.width > size.height' : 'size.width < size.height');
				if (size.width < size.height && w > h)
				{
					h = null;
				}

				this.resize(w, h, '^')
				.gravity('Center')
				.background('white')
				.extent(w, h)
				.write(filePathTo, function (err)
				{
					if (err)
					{
						/*if (!File.isForbiddenDir(filePathTo))
						{
							FS.unlink(filePathTo, function(err){
								//console.log(err);
							});
						}*/

						return reject(new FileErrors.FileImageReSize(err));
					}

					return resolve({[filePrefix]: fileUrl});
				});
			});
		});
	}

	resize(file, uploadConf)
	{
		let sizeParams = File.getUploadConfig(uploadConf).sizeParams;
		const self = this;
		let images = sizeParams.map(function(size)
		{
			return self.resizeImage(file, size.w, size.h);
		});

		file["previews"] = {};

		return Promise.all(images.map(function(promise)
		{
			return promise.reflect();
		}))
			.each(function(inspection)
			{
				if (inspection.isFulfilled())
				{
					let key = Object.keys(inspection.value()).shift();
					file["previews"][key] = inspection.value()[key];
				}
			})
			.then(function ()
			{
				return Promise.resolve(file);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	static cropImg(file, w, h, crop_x, crop_y, crop_width, crop_height)
	{
		return new Promise(function(resolve, reject)
		{
			let docRoot = File.getDocumentRoot;
			let filePrefix = w + '_' + h;
			let fileName = filePrefix + '.jpg';
			let filePathFrom = Path.join(docRoot, file.cropSrc);
			let filePathTo = Path.join(docRoot, file.dir,fileName);
			let fileUrl = Path.join(file.dir, fileName);

			GM(filePathFrom)
				.size(function (err, size)
				{
					crop_x = parseInt((crop_x > 0 ? crop_x : 0), 10);
					crop_y = parseInt((crop_y > 0 ? crop_y : 0), 10);

					crop_width = parseInt(crop_width, 10) || 50;
					crop_width = ((crop_width + crop_x) < size.width ? crop_width : (size.width - crop_x));
					crop_width = (crop_width > 50 ? crop_width : 50);

					crop_height = parseInt(crop_height, 10) || 50;
					crop_height = ((crop_height + crop_y) < size.height ? crop_height : (size.height - crop_y));
					crop_height = (crop_height > 50 ? crop_height : 50);

					if (err)
						return reject(new FileErrors.FileGetImageSize(err));

					this.crop(crop_width, crop_height, crop_x, crop_y)
						.resize(w, h, '^')
						.gravity('Center')
						.background('white')
						.extent(w, h)
						.write(filePathTo, function (err)
						{
							if (err)
								return reject(new FileErrors.FileImageReSize(err));

							return resolve({[filePrefix]: fileUrl});
						});
				});
		});
	}

	static cropImage(file, uploadConfType, crop_x, crop_y, crop_width, crop_height)
	{
		let sizeParams = File.getUploadConfig(uploadConfType).cropSize;
		
		let images = sizeParams.map(function(size)
		{
			return File.cropImg(file, size.w, size.h, crop_x, crop_y, crop_width, crop_height);
		});

		file["previews"] = {};

		return Promise.all(images.map(function(promise)
		{
			return promise.reflect();
		}))
			.each(function(inspection)
			{
				if (inspection.isFulfilled())
				{
					let key = Object.keys(inspection.value()).shift();
					file["previews"][key] = inspection.value()[key];
				}
			})
			.then(function ()
			{
				return Promise.resolve(file);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	setImageGeo(file)
	{
		return new Promise(function(resolve, reject)
		{
			GM.subClass({imageMagick: true})(file.fullFilePath)
			.identify(function (err, data)
			{
				if (err) return resolve(file);//reject(file);

				let geo = exifGeoLocation(data);

				file["latitude"] = geo.latitude;
				file["longitude"] = geo.longitude;

				return resolve(file);
			});
		});
	}

	/**
	 * сканируем указанные директорию, получаем все ее содержимое
	 *
	 * @param dir
	 * @param done - колбэк
	 */
	static walkDir(dir, done)
	{
		const self = this;
		let results = new Map();

		FS.readdir(dir, function(err, list)
		{
			if (err) return done(err);

			let pending = list.length;

			if (!pending) return done(null, results);

			list.forEach(function(file)
			{
				file = Path.resolve(dir, file);

				FS.stat(file, function(err, stat)
				{
					if (stat && stat.isDirectory())
					{
						results.set(file, false);

						File.walkDir(file, function(err, res)
						{
							res.forEach(function (val, file)
							{
								results.set(file, val);
							});

							if (!--pending) done(null, results);
						});
					}
					else
					{
						results.set(file, true);

						if (!--pending) done(null, results);
					}
				});
			});
		});
	}

	/**
	 *
	 * @param dir
	 * @returns {boolean} - true - запрещено, false - разрешено
	 */
	static isForbiddenDir(dir)
	{
		switch (dir)
		{
			case File.getDocumentRoot:
			case Path.dirname(File.getDocumentRoot):
			case '.':
			case '..':
			case process.cwd():
			case Path.dirname(process.cwd()):

				console.log('isForbiddenDir(dir) in switch (dir)');
				console.log('\n');

				return true;
			break;
		}

		//return (!dir ? false : true);

		//if (bd[0].search(/^\d{2,2}$/ig) == -1) return false;

		if (!dir || dir.search(/\.*\.+\//ig) >= 0 || uploadDirs.indexOf(dir) >=0 )
		{
			console.log('isForbiddenDir(dir) in if (!dir || dir.search(/\.+/ig) >= 0 || uploadDirs.indexOf(dir) >=0 )');
			console.log('\n');
			return true;
		}

		return false;
	}

	/**
	 * удаляем указанную директорию
	 * 
	 * @param dir
	 * @returns {Promise.<TResult>}
	 */
	static deleteDir(dir, delNotEmptyDir = true)
	{
		return new Promise(function (resolve, reject)
		{
			if (File.isForbiddenDir(dir))
				return reject(new FileErrors.ForbiddenDirectory(dir));

			File.walkDir(dir, function (err, dirData)
			{
				if (err) return reject(err);

				if (dirData.size == 0)
				{
					return reject(new FileErrors.DirEmpty(dir));
				}
				else if (!delNotEmptyDir)//не удалять не пустую папку
				{
					return reject(new FileErrors.DirNotEmpty(dir));
				}
				return resolve(dirData);
			});
		})
		.then(function (dirData)
		{
			let data = {"dirs":[], "files":[]};

			dirData.forEach(function (isFile, file)
			{
				if (isFile) data.files.push(file);
				else data.dirs.push(file);
			});

			data.dirs = data.dirs.sort(function (a, b)
			{
				let al = a.split(Path.sep).length;
				let bl = b.split(Path.sep).length;

				if (al > bl) return -1;
				if (al < bl) return 1;

				return 0;
			});

			dirData = null;

			return Promise.resolve(data);
		})
		.then(function (dirData) //удаление файлов и директорий
		{
			//console.log(dirData);

			dirData.files = dirData.files.map(function(fPath)
			{
				return new Promise(function (resolve, reject)
				{
					if (File.isForbiddenDir(fPath))
						return reject(new FileErrors.ForbiddenDirectory(fPath));

					FS.unlink(fPath, function (err) 
					{
						//если ошибка не связана с директории или файла, которых хотим удалить
						if (err && err.code != 'ENOENT')
							return reject(err);

						return resolve(true);
					});
				});
			});

			return Promise.all(dirData.files)
				.then(function ()
				{
					return Promise.mapSeries(dirData.dirs, function (dPath)
					{
						if (File.isForbiddenDir(dPath))
							return Promise.reject(new FileErrors.ForbiddenDirectory(dPath));

						FS.rmdir(dPath, function (err)
						{
							//if (err) return Promise.reject(err);

							//если ошибка не связана с директории или файла, которых хотим удалить
							if (err && err.code != 'ENOENT')
								return Promise.reject(err);

							return Promise.resolve(true);
						});
					});
				})
				.then(function ()
				{
					return new Promise(function (resolve, reject)
					{
						if (File.isForbiddenDir(dir))
							return reject(new FileErrors.ForbiddenDirectory(dir));

						FS.rmdir(dir, function (err)
						{
							//if (err) return reject(err);
							//если ошибка не связана с директории или файла, которых хотим удалить
							if (err && err.code != 'ENOENT')
								return reject(err);

							return resolve(true);
						});
					});
				});
		})
		.catch(FileErrors.DirEmpty, function (err)
		{
			return new Promise(function (resolve, reject)
			{
				if (File.isForbiddenDir(dir))
					return reject(new FileErrors.ForbiddenDirectory(dir));

				FS.rmdir(dir, function (err)
				{
					//если ошибка не связана с директории или файла, которых хотим удалить
					if (err && err.code != 'ENOENT')
						return reject(err);

					return resolve(true);
				});
			});
		})
		.catch(FileErrors.DirNotEmpty, function (err)
		{
			return Promise.resolve(true);
		})
		.then(function (done)
		{
			//console.log('all done');
			return Promise.resolve(done);
		})
		.catch(function (err)
		{
			if (err.code == 'ENOENT')//если нет директории, которую хотим удалить
			{
				return Promise.resolve(true);
			}
			throw err;
		});
	}
}

function exifGeoLocation(exifData)
{
	let props = exifData["Properties"];
	let result = {"latitude": null, "longitude": null};

	if (!props || !props["exif:GPSLatitude"] || !props["exif:GPSLatitudeRef"] || !props["exif:GPSLongitude"] || !props["exif:GPSLongitudeRef"] )
	return result;

	let latData = props["exif:GPSLatitude"].split(',').map(function(val){return val.trim()});
	let lngData = props["exif:GPSLongitude"].split(',').map(function(val){return val.trim()});

	//get the Hemisphere multiplier
	let latM = 1;
	let longM = 1;

	if(props["exif:GPSLatitudeRef"] == 'S')
	{
		latM = -1;
	}

	if(props["exif:GPSLongitudeRef"] == 'W')
	{
		longM = -1;
	}

	//get the GPS data
	let gps = {};
	gps['LatDegree']    = latData[0];
	gps['LatMinute']    = latData[1];
	gps['LatSeconds']   = latData[2];

	gps['LongDegree']   = lngData[0];
	gps['LongMinute']   = lngData[1];
	gps['LongSeconds']  = lngData[2];

	let pos = true;
	for(let key in gps)
	{
		pos = (gps[key].indexOf('/') != -1);
		if(pos !== false)
		{
			let temp = gps[key].split('/');
			temp[1] = (temp[1] != 0 ? temp[1] : 1)
			gps[key] = temp[0] / temp[1];
		}
	}

	result['latitude'] = latM * (gps['LatDegree'] + (gps['LatMinute'] / 60) + (gps['LatSeconds'] / 3600));
	result['longitude'] = longM * (gps['LongDegree'] + (gps['LongMinute'] / 60) + (gps['LongSeconds'] / 3600));

	return result;
}

module.exports = File;