"use strict";
const FS = require('fs');
const Path = require('path');

//console.log(Path.join(__dirname, '../../public'));


/**
 * кофигруационный файл
 *
 * @type {{port: number, db: {mysql: {host: string, user: string, password: string, dbname: string, charset: string}}}}
 */
var config = {
	port: 3000,
	document_root: Path.join(__dirname, '../../public'),
	session:  {
		saveUninitialized: true, // saved new sessions
		resave           : false, // do not automatically write to the session store
		secret           : 'varRy Sicret st0ka',
		cookie           : {
			secure: true, //TODO 
			httpOnly: true,
			path: '/',
			maxAge: null
		}
	},
	redis:{
		port: 6379,
		host: 'localhost',
		showFriendlyErrorStack: true/*,
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
	redisClient:{
		prefix:'appsess:'
	},
	db:   {
		mariasql: {
			host: 'localhost', //192.168.0.91
			user: 'mc',
			password: 'mcjs',
			//dbname: 'mcjs',
			db: 'mcjs',
			charset: 'utf8',
			multiStatements: true
			//, keepQueries: true
		}
	},
	mail: {
		from: 'info@motocommunity.ru',
		services: {
			gmail: {
				service: 'Gmail',
				auth: {
					user: 'roalexey@gmail.com',
					pass: 'Doberman2381'
				}
			}
		}
	},
	ssl: {
		key: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.key')),
		cert: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.pem'))
	},
	userCookieExpires: 15552000000, //значение в милисекундах= 60*60*24 * 30 (дн) * 6 (мес) = пол года
	uploads: {
		default: {
			pathUpload: "/upload",
			fileTypes: [],
			fileMediaType: '',
			multiUpload: false,
			maxFileSize: 0,//Mb
			tokenFields: ['i_time'],
			sizeParams: []
		},
		user_photo: {
			pathUpload: "user/photo",
			fileTypes: ['gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'image',
			multiUpload: true,
			maxFileSize: 6,//Mb
			tokenFields: ['i_time', 'a_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 320, h: 213},
				{w: 50, h: 50}
			],
			cropSize: []
		},
		user_ava: {
			pathUpload: "user/photo",
			fileTypes: ['gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'image',
			multiUpload: false,
			maxFileSize: 6,//Mb
			tokenFields: ['i_time', 'u_id'],
			sizeParams: [
				{w: 1280, h: 853},
				{w: 1024, h: 768},
				{w: 320, h: 213},
				{w: 180, h: 180},
				{w: 100, h: 100},
				{w: 50, h: 50},
			],
			cropSize: [
				{w: 180, h: 180},
				{w: 100, h: 100},
				{w: 50, h: 50},
				{w: 25, h: 25}
			]
		},
		user_video: {
			pathUpload: "user/video",
			fileTypes: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv'],
			fileMediaType: 'video',
			multiUpload: false,
			maxFileSize: 2048,//Mb
			sizeParams: []
		},
		user_audio: {
			pathUpload: "user/audio",
			fileTypes: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv'],
			fileMediaType: 'audio',
			multiUpload: false,
			maxFileSize: 10,//Mb
			sizeParams: []
		}
	},
};

module.exports = config;