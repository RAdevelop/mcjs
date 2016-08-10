/**
 * Created by Asus on 10.11.2015.
 */
"use strict";

const winston = require('winston');
//var fs = require('fs');
const path = require('path');

const config = {
	levels: {
		error: 0,
		debug: 1,
		warn: 2,
		data: 3,
		info: 4,
		verbose: 5,
		silly: 6
	},
	colors: {
		error: 'red',
		debug: 'blue',
		warn: 'yellow',
		data: 'grey',
		info: 'green',
		verbose: 'cyan',
		silly: 'magenta'
	}
};

/**
 * TODO
 * нужно указать в настройках размер файла, после которого будет создан новый.
 * а так же, по переменной окружения app.get('env') настроить выводить в консоль для продакшин, или нет.
 * @returns {*}
 */
module.exports = function(){
	//TODO по-хорошенму, надо проверять существование директории
	var pathToLogDir = __dirname+'/../../../log/';

	return new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({
				colorize: true
				,prettyPrint: true
				,handleExceptions: true
				//,json: false
				//stringify: true
			}),
			new (winston.transports.File)({
				name: 'app-error',
				level: 0,
				filename: path.join( pathToLogDir,  'app-error.log'),
				maxsize: 1048576, //1Mb
				handleExceptions: true,
				humanReadableUnhandledException: true
			})
		],
		levels: config.levels,
		colors: config.colors
	});
}