"use strict";
const FS = require('fs');
const Path = require('path');

//console.log(Path.join(__dirname, '../../public'));

let document_root = Path.join(__dirname, '../../public');
/**
 * кофигруационный файл
 *
 * @type {*}
 */
var config = {
	port: 3000,
	server_closing: 'server_closing', //название переменной для app.set(name, value) при выключении или перезагрузки сервера
	document_root: document_root,
	session:  {
		name: 'sessionId',
		saveUninitialized: true, // saved new sessions
		resave           : true, // false do not automatically write to the session store
		secret           : 'varRy Sicret str0ka',
		store            : null,
		cookie           : {
			secure: true//true
			,httpOnly: true//true
			,path: '/'
			//,maxAge: 86400000 //in milliseconds
		}
		, unset: 'destroy'
		, prefix:'appsess:'
	},
	redis:{
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
	db:   {
		mariasql: {
			host: 'localhost', //192.168.0.91
			user: 'mc',
			password: 'mcjs',
			db: 'mcjs',
			charset: 'utf8',
			multiStatements: true,
			keepQueries: true //true false
		}
	},
	mail: {
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
	ssl: {
		key: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.key')),
		cert: FS.readFileSync(Path.join(__dirname, '../../openssl/mc_cert.pem'))
	},
	userCookieExpires: 15552000000, //значение в милисекундах= 60*60*24 * 30 (дн) * 6 (мес) = пол года
	uploads: {
		default: {
			pathUpload: "upload",
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
				{w: 512, h: 384},
				{w: 256, h: 192},
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
			pathUpload: "user/video",
			fileTypes: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv','gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'video',
			multiUpload: false,
			maxFileSize: 2048,//Mb
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
			pathUpload: "user/audio",
			fileTypes: ['avi', 'MP4', '3gp', 'mpeg', 'mov', 'flv', 'wmv'],
			fileMediaType: 'audio',
			multiUpload: false,
			maxFileSize: 10,//Mb
			sizeParams: [],
			tokenFields: ['i_time', 'u_id']
		},
		user_blog: {
			pathUpload: "user/blog",
			fileTypes: ['gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'image',
			multiUpload: true,
			maxFileSize: 6,//Mb
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
			pathUpload: "events",
			fileTypes: ['gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'image',
			multiUpload: true,
			maxFileSize: 6,//Mb
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
			pathUpload: "news",
			fileTypes: ['gif', 'png', 'jpg', 'jpeg'],
			fileMediaType: 'image',
			multiUpload: true,
			maxFileSize: 6,//Mb
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
		app_secret: 'BuD3VeOO8f84tkk1dQHS',
		app_access_token: 'e62a0528e62a0528e67a515d2ee6729ea4ee62ae62a0528bec954578ee7b489c232cf2a',
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