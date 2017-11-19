"use strict";
const FS = require('fs');
const Path = require('path');

//console.log(Path.join(__dirname, '../../public'));
//console.log('process.env.NODE_ENV ', process.env.NODE_ENV);

let document_root = Path.join(__dirname, '../../public');
/**
 * кофигруационный файл
 *
 * @type {*}
 */
let config = {
	https: true, //FIXME
	port: 3000,
	server_closing: 'server_closing', //название переменной для app.set(name, value) при выключении или перезагрузки сервера
	document_root: document_root,
	session:	{
		name: 'sessionId',
		saveUninitialized: true, // saved new sessions
		resave           : false, // false do not automatically write to the session store
		secret           : 'varRy Sicret str0ka',
		store            : null,
		cookie           : {
			secure: this.https//true
			,httpOnly: this.https//true
			,path: '/'
			//,maxAge: 86400000 //in milliseconds
		}
		, unset: 'destroy'
		, prefix:'appsess:'
	},
	redis:	{
		// /usr/local/opt/redis/bin/redis-server /usr/local/etc/redis.conf
		port: 6379,
		host: 'localhost',
		showFriendlyErrorStack: true,
		password: 'RoLexey2381Doberman05FireBlade',
		connectionName : 'config'
		/*,
		reconnectOnError: function (err) {
			var targetError = 'READONLY';
			if (err.message.slice(0, targetError.length) === targetError) {
			  // Only reconnect when the error starts with "READONLY" 
			  return true; // or `return 1;` 
			}
		},
		retryStrategy: function (times) {
			var delay = Math.min(times * 2, 2000);//увеличить 2000? это 2 секунды сейчас
			
			//console.log(delay +' '+ times);
			
			return delay;
		}*/
	},
	db:	{
		mariasql: {
			host: 'localhost', //192.168.0.91
			user: 'mc',
			password: 'mcjs',
			db: (!!process.env.NODE_ENV && process.env.NODE_ENV === 'test' ? 'mcjs_test' :  'mcjs'),
			charset: 'utf8',
			multiStatements: true,
			keepQueries: true //true false
		}
	},
	mail:	{
		from: 'info@motocommunity.ru',
		to: 'info@motocommunity.ru',
		service: 'gmail',
		services: {
			gmail: {
				service: 'Gmail',
				auth: {
					user: 'roalexey@gmail.com',
					pass: 'RoLexey2381'
				}
			}
		}
	},
	ssl:	{
		key: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.key')),
		cert: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.pem'))
	},
	userCookieExpires: 15552000000, //значение в милисекундах= 60*60*24 * 30 (дн) * 6 (мес) = пол года
	uploads:	{
		default: {
			pathUpload: "files/upload",
			fileTypes: {},
			fileMediaType: '',
			multiUpload: false,
			maxFileSize: 0,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 1; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time'],
			sizeParams: []
		},
		user_photo: {
			pathUpload: "files/user/photo",
			fileTypes: {
				image: ['gif', 'png', 'jpg', 'jpeg']
			},
			fileMediaType: 'application', //deprecated
			multiUpload: true,
			maxFileSize: 6,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 0; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time', 'a_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 50, h: 50}
			],
			cropSize: []
		},
		user_ava: {
			pathUpload: "files/user/photo",
			fileTypes: {
				image: ['gif', 'png', 'jpg', 'jpeg']
			},
			fileMediaType: 'application', //deprecated
			multiUpload: false,
			maxFileSize: 6,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 0; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time', 'u_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 180, h: 180},
				{w: 100, h: 100},
				{w: 50, h: 50},
				{w: 25, h: 25}
			],
			cropSize: [
				{w: 180, h: 180},
				{w: 100, h: 100},
				{w: 50, h: 50},
				{w: 25, h: 25}
			]
		},
		user_video: {
			pathUpload: "files/user/video",
			fileTypes: {
				video: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv','gif', 'png', 'jpg', 'jpeg']
				//application: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv','gif', 'png', 'jpg', 'jpeg']
			},
			fileMediaType: 'application', //deprecated
			
			multiUpload: false,
			maxFileSize: 2048,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 10; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time', 'u_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 50, h: 50}
			],
			cropSize: []
		},
		user_audio: {
			pathUpload: "files/user/audio",
			fileTypes: {
				audio: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv']
				//application: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv']
			},
			fileMediaType: 'application', //deprecated
			
			multiUpload: false,
			maxFileSize: 10,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 20; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			sizeParams: [],
			tokenFields: ['i_time', 'u_id']
		},
		user_blog: {
			pathUpload: "files/user/blog",
			fileTypes: {
				image: ['gif', 'png', 'jpg', 'jpeg'],
				application: [
					'xls', 'xlsx', 'xml', 'csv', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'pxd', 'rtf', 'txt',
					'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'7z', 'zip', 'gz', 'gzip', 'rar', 'tar', 'tgz'
				]
			},
			fileMediaType: 'application', //deprecated
			multiUpload: true,
			maxFileSize: 6,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 20; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time','b_id', 'u_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 50, h: 50}
			],
			cropSize: []
		}
		,events: {
			pathUpload: "files/events",
			
			fileTypes: {
				image: ['gif', 'png', 'jpg', 'jpeg'],
				application: [
					'xls', 'xlsx', 'xml', 'csv', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'pxd', 'rtf', 'txt',
					'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'7z', 'zip', 'gz', 'gzip', 'rar', 'tar', 'tgz'
				]
			},
			fileMediaType: 'application', //deprecated
			
			multiUpload: true,
			maxFileSize: 6,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 10; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time','e_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 50, h: 50}
			],
			cropSize: []
		},
		news: {
			pathUpload: "files/news",
			fileTypes: {
				image: ['gif', 'png', 'jpg', 'jpeg'],
				application: [
					'xls', 'xlsx', 'xml', 'csv', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'pxd', 'rtf', 'txt', 
					'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'7z', 'zip', 'gz', 'gzip', 'rar', 'tar', 'tgz'
				]
			},
			fileMediaType: 'application', //deprecated
			multiUpload: true,
			maxFileSize: 6,//Mb
			checkLimitFile: function(file_cnt, Errors)
			{
				let limit = 10; //0 - то без лимита
				if (limit > 0 && file_cnt >= limit)
					throw new Errors(`Можно добавить не более ${limit} файлов.`);
			},
			tokenFields: ['i_time','n_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 512, h: 384},
				{w: 256, h: 192},
				{w: 50, h: 50}
			],
			cropSize: []
		}
	},
	vk: {
		app_id: 5806988, //он же client_id
		app_secret: 'GbZHOh3ILid62kNGk1qU',
		app_service_token: '6ed715a46ed715a46e880e51e06e8f8e2866ed76ed715a43638e6645a6ea87fddedece8',
		group_id: 34886964,
		api_host: 'api.vk.com',
		api_service: '/method/',
		api_version: '5.63'
	},
	cache: {
		user_ts: 0, //10 sec
		guest_ts: 60 //60 sec
	}
};

module.exports = config;