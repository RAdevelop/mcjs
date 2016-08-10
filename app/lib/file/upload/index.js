"use strict";

const AppConfig = require('app/config');
const File = require('../');
const FileErrors = require('../errors');
//const FS = require('fs');
const FS = require('node-fs');
const Path = require('path');
const Crypto = require('crypto');
const Formidable = require('formidable');
const Promise = require('bluebird');

let secret = "do shash'owania ыва кer";

/*const hashes = Crypto.getHashes();
console.log(hashes);*/

class UploadFile extends File
{
	//TODO добавить настройки для  загрузки файла - тип, размер и тп
	//constructor(opts, req, res)
	constructor(type, req, res)
	{
		super(req, res);

		//opts = opts || {};
		let opts = UploadFile.getUploadConfig(type);

		this.multiUpload      = opts.multiUpload || '';
		this.pathUpload      = opts.pathUpload || '';
		this.uploadDir      = opts.uploadDir || '';
		this.webUploadDir   = opts.webUploadDir || '';
		this.tokenFields    = opts.tokenFields || [];
		this.fileMediaType  = opts.fileMediaType || null;

		this.fileTypes      = opts.fileTypes || [];
		this.fileTypes.forEach(function(value, index, arr)
		{
			arr[index] = value.toLowerCase();
		});

		this.maxFileSize    = opts.maxFileSize || 0;//в мегабайтах. если не указано - 0Мб запрещено закачивать
	}

	getUploadOpts(name = null)
	{
		let opts = {
			uploadDir      : this.uploadDir,
			webUploadDir   : this.webUploadDir,
			tokenFields    : this.tokenFields,
			fileMediaType  : this.fileMediaType,
			fileTypes      : this.fileTypes
		};

		if (name && opts[name])
			return opts[name];

		return opts;
	}

	
	isAllowedFileType(fileType)
	{
		return (this.fileTypes.indexOf(fileType.toLowerCase()) != -1);
	}
	
	uploadPaths()
	{
		let docRoot = File.getDocumentRoot;
		let uploadDir = Path.normalize(Path.join(docRoot, this.pathUpload));
		let p = {uploadDir: uploadDir, webUploadDir: Path.join("/", this.pathUpload)};

		return p;
	}

	getUploadDir()
	{
		return this.uploadDir;
	}

	setUploadDir(uploadDir)
	{
		let uploadPaths = this.uploadPaths();
		this.uploadDir = Path.join(uploadPaths.uploadDir, uploadDir);
		this.webUploadDir = Path.join(uploadPaths.webUploadDir, uploadDir);
		return this;
	}
	
	/**
	 *
	 * @returns {Promise}
	 */
	upload()
	{
		const self = this;
		return new Promise(function (resolve, reject)
		{
			self.uploadFile(function(err, file)
			{
				if (err) return reject(err);

				return resolve(file);
			});
		});
	}

	uploadFile(uploadCb)
	{
		const self = this;

		const form = new Formidable.IncomingForm();
		let file = null,
			fields = {};

		form.keepExtensions = true;
		form.maxFieldsSize = 4096;//2 * 1024 * 1024;
		//form.multiples = true;
		form.multiples = this.getUploadOpts('multiUpload');

		form
			.on('error', function(err)
			{
				console.log('on error');

				if (file)
				{
					if (!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err){
							//console.log(err);
						});
					}

					if (!File.isForbiddenDir(file.fullFilePath))
					{
						FS.unlink(file.fullFilePath, function(err){
							//console.log(err);
						});
					}
				}

				return uploadCb(err);
			})
			.on('aborted', function()
			{
				console.log("file upload on aborted");
				if (file)
				{
					if (file.path && !File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err){
							console.log(err);
						});
					}

					if (file.fullFilePath && !File.isForbiddenDir(file.fullFilePath))
					{
						FS.unlink(file.fullFilePath, function(err){
							console.log(err);
						});
					}
				}
				console.log("END file upload on aborted");
			}).on('fileBegin', function(name, file)
			{
				console.log('fileBegin');

				//this.emit('aborted');
				//this.emit('error',  new Error("AD"));

				/*console.log(name);
				console.log(file);


				file = self.mimeType(file);

				if(!self.isAllowedFileType(file.ext))
				{
					FS.unlink(file.path, function(err){
						//console.log(err);
					});

					//this.aborted();
					this._error(new FileErrors.FileType(fileType, self.fileTypes.join(', ')));
					//return uploadCb(new FileErrors.FileType(fileType, self.fileTypes.join(', ')));
				}
*/
				console.log('END fileBegin');
			})
			.on('field', function(fieldName, value)
			{
				fields[fieldName] = value;

				//form.emit('error', new Error("AD"));

				//return uploadCb(new Error("RA"));
			})
			/*.on('progress', function(bytesReceived, bytesExpected){
			 let percent = Math.floor(bytesReceived / bytesExpected * 100);
			 //console.log(percent +'%');
			 })*/
			.on('file', function(fieldName, fileData)
			{

				/*console.log('fieldName = ' + fieldName);
				 console.log('fileData:');
				 console.log(fileData);*/

				file = fileData;
			})
			.on('end', function()
			{
				//console.log(fields);

				if (!UploadFile.checkToken(fields))
				{
					if (file && !File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err)
						{
							//console.log(err);
						});
					}
					return uploadCb(new FileErrors.FileTokenError());
				}

				if (!file || file.size == 0)
				{
					if(!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err){
							//console.log(err);
						});
					}
					return uploadCb(new FileErrors.FileNotUploaded());
				}

				file = self.mimeType(file);

				if(!self.isAllowedFileType(file.ext))
				{
					if(!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err){
							//console.log(err);
						});
					}

					return uploadCb(new FileErrors.FileType(file.ext, self.fileTypes.join(', ')));
				}

				if (file.size > self.constructor.MEGABYTE * self.maxFileSize)
				{
					if(!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, function(err)
						{
							if (err)
								return uploadCb(err);

							//return uploadCb(new FileErrors.FileTooBig(self.maxFileSize+"Mb"));
						});
					}
					return uploadCb(new FileErrors.FileTooBig(self.maxFileSize+"Mb"));
				}
				else
				{
					return uploadCb(null, file);
				}
			});
		form.parse(this.req);
	}

	/**
	 * создаем токен для проверки подделки данных во время загрузки
	 * @returns {{i_time: number, s_token: *}}
	 */
	static createToken(tokenFields, tplData)
	{
		let tokenStr = secret;
		tplData.i_time = (new Date()).getTime();
		for(let i in tokenFields)
		{
			if (tplData[tokenFields[i]])
			tokenStr += tplData[tokenFields[i]];
		}

		return {"i_time": tplData.i_time, "s_token": Crypto.createHash('md5').update(tokenStr).digest("hex")};
	}

	/**
	 * проверяем, не подделали ли данные во время загрузки файла
	 *
	 * @param fields
	 * @returns {boolean}
	 */
	static checkToken(fields)
	{
		let tokenStr = secret;

		for(let f in this.tokenFields)
		{
			if (fields[this.tokenFields[f]])
			tokenStr += fields[this.tokenFields[f]];
		}

		let c = Crypto.createHash('md5').update(tokenStr).digest("hex");
		let check = (fields["s_token"] && c == fields["s_token"]);

		return check;
	}

	/**
	 * перемещаем загруженный файл в указанную директорию
	 * 
	 * @param file
	 * @param moveToDir
	 * @param moveCb
	 */
	moveUploadedFile(file, moveToDir, moveCb)
	{
		const self = this;
		this.setUploadDir(moveToDir);

		file["latitude"] = null;
		file["longitude"] = null;

		file["fullPathMainDir"]    = this.uploadDir;
		file["fullPathUploadDir"]  = Path.join(file["fullPathMainDir"], 'orig');
		file["fullFilePath"]     = Path.join(file["fullPathUploadDir"], file.name);//TODO в имени файла замнеить пробелы и знаки припенания
		file["webFilePath"]     = (Path.join("/", this.webUploadDir, 'orig', file.name)).split(Path.sep).join('/');
		file["webDirPath"]     = (Path.join("/", this.webUploadDir)).split(Path.sep).join('/');


		FS.stat(file["fullPathUploadDir"], function(err, Stats)
		{
			let errCode = (err ? err.code : null);

			if (err && errCode != 'ENOENT')
			{
				FS.unlink(file.path, function(err){
					//console.log(err);
				});

				return moveCb(err);
			}

			if (errCode == 'ENOENT')//если такой директории нет, создадим ее
			{
				FS.mkdir(file["fullPathUploadDir"], 0o711, true, function(err){ //0o755
					if (err)
					{
						FS.unlink(file.path, function(err){
							//console.log(err);
						});

						return moveCb(err);
					}

					self.moveFile(file, function(err, file)
					{
						if (err)
							return moveCb(err);

						return moveCb(null, file);
					});
				});
			}
			else
			{
				self.moveFile(file, function(err, file)
				{
					if (err)
						return moveCb(err);

					return moveCb(null, file);
				});
			}
		});
	}

	moveFile(file, cb)
	{
		let rStream = FS.createReadStream(file.path);
		let wStream = FS.createWriteStream(file["fullFilePath"]);

		this.res.on('close', function(){
			rStream.destroy();
			wStream.destroy();
		});

		rStream.on('error', function(rStreamErr)
		{
			//console.log('rStream.on error');
			//console.log(rStreamErr);

			wStream.destroy();

			FS.unlink(file["fullFilePath"], function(err)
			{

			});

			FS.unlink(file.path, function(err)
			{

			});

			cb(rStreamErr);
		});

		rStream.on('open', function(){
			//console.log('rStream.on open');
		});

		rStream.on('close', function(){
			//console.log('rStream.on close');
		});
		rStream.on('end', function(){
			//console.log('rStream.on end');
		});

		wStream.on('open', function(){
			//console.log('wStream.on open');
		});
		wStream.on('finish', function(){
			//console.log('wStream.on finish');

			FS.unlink(file.path, function(err)
			{
				//if (err) return cb(err);

				cb(null, file);
			});

		});

		wStream.on('error', function(wStreamErr)
		{
			//console.log('wStream.on error');
			//console.log(wStreamErr);

			rStream.destroy();

			FS.unlink(file["fullFilePath"], function(err)
			{

			});

			FS.unlink(file.path, function(err){

			});

			cb(wStreamErr);
		});

		rStream.pipe(wStream);
	}
}



module.exports = UploadFile;