"use strict";

//const AppConfig = require('app/config');
const File = require('../');
const FileErrors = require('../errors');
//const FS = require('fs');
const FS = require('node-fs');
const Path = require('path');
const Crypto = require('crypto');
const Formidable = require('formidable');
const Promise = require('bluebird');
const EventEmitter = require('events');

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

		this.fileSizeLimit      = opts.fileSizeLimit || '';
		this.multiUpload      = opts.multiUpload || '';
		this.pathUpload      = opts.pathUpload || '';
		this.uploadDir      = opts.uploadDir || '';
		this.webUploadDir   = opts.webUploadDir || '';
		this.tokenFields    = opts.tokenFields || [];
		this.fileMediaType  = opts.fileMediaType || null;

		this.fileTypes      = opts.fileTypes || {};
		/*this.fileTypes.forEach(function(value, index, arr)
		{
			arr[index] = value.toLowerCase();
		});*/

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

	/**
	 * на клиентскую часть
	 * @params uploadType  - название типа загрзуки файлов в конфиге
	 * @returns {Object}
	 */
	static exposeUploadOptions(uploadType)
	{
		let conf = UploadFile.getUploadConfig(uploadType);
		return {
			"fileMediaType":    conf.fileMediaType
			,"fileSizeLimit":   conf.fileSizeLimit
			,"fileTypes":       conf.fileTypes
			,"maxFileSize":     conf.maxFileSize
			,"multiUpload":     conf.multiUpload
		};
	}
	
	isAllowedFileType(fileExt)
	{
		//console.log('fileExt = ', fileExt);
		//console.log('this.fileTypes = ', this.fileTypes);
		
		let isAllowed = false;
		
		Object.keys(this.fileTypes).some((f_type)=>{
			if (this.fileTypes[f_type].indexOf(fileExt.toLowerCase()) != -1)
			{
				isAllowed = true;
				return true;
			}
			return false;
		});
		
		return isAllowed;
	}
	
	uploadPaths()
	{
		let docRoot = File.getDocumentRoot;
		let uploadDir = Path.normalize(Path.join(docRoot, this.pathUpload));
		return {uploadDir: uploadDir, webUploadDir: Path.join("/", this.pathUpload)};
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
		//const self = this;
		return new Promise((resolve, reject)=>
		{
			this.uploadFile((err, file)=>
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
				//console.log('Formidable on error');
				//console.log(err);

				if (file)
				{
					if (!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, (err)=>{
							//console.log(err);
						});
					}

					if (!File.isForbiddenDir(file.fullFilePath))
					{
						FS.unlink(file.fullFilePath, (err)=>{
							//console.log(err);
						});
					}
				}

				return uploadCb(err);
			})
			.on('aborted', function()
			{
				//console.log("file upload on aborted");
				if (file)
				{
					if (file.path && !File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, (err)=>{
							//console.log(err);
						});
					}

					if (file.fullFilePath && !File.isForbiddenDir(file.fullFilePath))
					{
						FS.unlink(file.fullFilePath, (err)=>{
							//console.log(err);
						});
					}
				}
				//console.log("END file upload on aborted");
				//form.emit('error', new FileErrors.FileNotUploaded());
				return uploadCb(new FileErrors.FileNotUploaded());

			}).on('fileBegin', function(name, file)
			{
				//console.log('fileBegin');

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
				//console.log('END fileBegin');
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

				if (!self.checkToken(fields))
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
						FS.unlink(file.path, (err)=>{
							//console.log(err);
						});
					}
					return uploadCb(new FileErrors.FileNotUploaded());
				}

				file = File.mimeType(file);

				if(!self.isAllowedFileType(file.ext))
				{
					if(!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, (err)=>{
							//console.log(err);
						});
					}
					let f_typ_list = '';
					
					Object.keys(self.fileTypes).forEach((f_type)=>{
						f_typ_list += '<br/>' + self.fileTypes[f_type].join(', ');
					});
					
					return uploadCb(new FileErrors.FileType(file.ext, f_typ_list));
				}
				
				if (file.size > self.constructor.MEGABYTE * self.maxFileSize)
				{
					if(!File.isForbiddenDir(file.path))
					{
						FS.unlink(file.path, (err)=>
						{
							if (err)
								return uploadCb(err);
						});
					}
					return uploadCb(new FileErrors.FileTooBig(self.maxFileSize+"Mb"));
				}
				else
				{
					for(let f in self.tokenFields)
					{
						if (fields[self.tokenFields[f]])
						{
							file[self.tokenFields[f]] = fields[self.tokenFields[f]];
						}
					}
					return uploadCb(null, file);
				}
			});
		form.parse(this.req);
	}
	
	/**
	 * создаем токен для проверки подделки данных во время загрузки
	 * @returns {{i_time: number, s_token: *}}
	 */
	static createToken(uploadTypeConf, tokenData)
	{
		let tokenFields = UploadFile.getUploadConfig(uploadTypeConf)["tokenFields"] || ['i_time'];
		let tokenStr = secret;
		tokenData.i_time = (new Date()).getTime();

		tokenStr += tokenData.i_time;

		for(let i in tokenFields)
		{
			if (tokenData[tokenFields[i]])
			{
				tokenStr += tokenData[tokenFields[i]];
			}
		}

		return {"i_time": tokenData.i_time, "s_token": Crypto.createHash('md5').update(tokenStr).digest("hex")};
	}

	/**
	 * проверяем, не подделали ли данные перед загрузкой файла
	 *
	 * @param fields
	 * @returns {boolean}
	 */
	checkToken(fields = {})
	{
		let tokenStr = secret;

		if (!fields["i_time"] || !this.tokenFields || !this.tokenFields.length)
			return false;

		tokenStr += fields.i_time;

		let i=0;
		for(let f in this.tokenFields)
		{
			if (fields[this.tokenFields[f]])
			{
				i++;
				tokenStr += fields[this.tokenFields[f]];
			}
		}

		if (i < this.tokenFields.length)
			return false;

		let c = Crypto.createHash('md5').update(tokenStr).digest("hex");
		return (fields["s_token"] && c == fields["s_token"]);
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
		if (!file)
			return moveCb(new FileErrors.FileNotUploaded("Нет файла для загрузки"));

		if (!moveToDir)
			return moveCb(new FileErrors.FileNotUploaded("Директория для загрузки не указана: [" + moveToDir+"]"));

		
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
				if (!File.isForbiddenDir(file.path))
				{
					FS.unlink(file.path, function(){//err
						//console.log(err);
					});
				}

				return moveCb(err);
			}

			//права для папки и файлов
			let mode = 0o755;//0o755  0o711

			if (errCode == 'ENOENT')//если такой директории нет, создадим ее
			{
				FS.mkdir(file["fullPathUploadDir"], 0o755, true, (err)=>
				{
					if (err)
					{
						if (!File.isForbiddenDir(file.path))
						{
							FS.unlink(file.path, (err)=>{
								//console.log(err);
							});
						}

						return moveCb(err);
					}

					self.moveFile(file, 0o755, (err, file)=>
					{
						if (err)
							return moveCb(err);

						return moveCb(null, file);
					});
				});
			}
			else
			{
				self.moveFile(file, 0o755, (err, file)=>
				{
					if (err)
						return moveCb(err);

					return moveCb(null, file);
				});
			}
		});
	}

	moveFile(file, mode, cb)
	{
		let error = false;

		let rStream = FS.createReadStream(file.path);
		let options = {
			"mode": mode,
			"flags": "w"
		};
		let wStream = FS.createWriteStream(file["fullFilePath"], options);

		if (this.res instanceof EventEmitter)
		{
			this.res.on('close', ()=>
			{
				rStream.destroy();
				wStream.destroy();
				
				this.res.emit("cancelUploadedFile", file);
			});
		}
		
		rStream.on('error', function(rStreamErr)
		{
			//console.log('rStream.on error');
			//console.log(rStreamErr);
			
			wStream.destroy();
			
			if (!File.isForbiddenDir(file["fullFilePath"]))
			{
				FS.unlink(file["fullFilePath"], (err)=> {});
			}
			
			if (!File.isForbiddenDir(file["path"]))
			{
				FS.unlink(file.path, (err)=> {});
			}
			
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
		
		wStream.on('finish', function()
		{
			//console.log('wStream.on finish');
			
			if (!File.isForbiddenDir(file["path"]))
			{
				FS.unlink(file.path, function(err)
				{
					//if (err) return cb(err);
					
					return cb(null, file);
				});
			}
			else
			{
				return cb(null, file);
			}

		});

		wStream.on('error', function(wStreamErr)
		{
			//console.log('wStream.on error');
			//console.log(wStreamErr);

			rStream.destroy();

			if (!File.isForbiddenDir(file["fullFilePath"]))
			{
				FS.unlink(file["fullFilePath"], (err)=>
				{

				});
			}

			if (!File.isForbiddenDir(file["path"]))
			{
				FS.unlink(file.path, (err)=>{

				});
			}

			cb(wStreamErr);
		});

		rStream.pipe(wStream);
	}
}



module.exports = UploadFile;