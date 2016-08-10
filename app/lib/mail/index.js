/**
 * Created by RA on 18.11.2015.
 *
 * Отправка почты с помощью модуля "nodemailer"
 */
"use strict";
const config = require('app/config');
const errors = require('app/lib/errors');
const _ = require('lodash');
const fs = require('fs');
const ejs = require('ejs');
/*
 ejs.open = '{{';
 ejs.close = '}}';
 */

const nodemailer = require('nodemailer');

/**
 * класс по отправке почты
 * @param serviceName - имя сервиса из конфига. например, 'gmail' - будут использованы его настройки для отправки почты
 * @constructor
 */
const Mailer = function(serviceName){

	this.service = config.mail.services[serviceName];
	this.mailFrom = config.mail.from;
	this.transport = null;
};

/**
 * возвращаем инстанс nodemailer.createTransport
 * @returns {null|*}
 */
Mailer.prototype.transporter = function(){

	if(this.transport) return this.transport;
	this.transport = nodemailer.createTransport(this.service);

	return this.transport;
};

/**
 * отправка почты
 * @param opts - параметры для отправки письма
 * {
		to:'email@address.com',
		subject: 'тема письма',
		tplName:'имя шаблона html',
		tplData: {данные для шалона, если нужно}
	}
 * @param callback
 * @returns {*}
 * @throws
 *  errors.ArgumentError
 *  Error
 */
Mailer.prototype.send = function (params, callback){

	if(!_.isPlainObject(params))
	return callback(new errors.ArgumentError('params'));

	params = _.assign({
		to:'',
		subject: '',
		tplName:'',
		tplData: {}
	},params);

	for(var idx in params)
	{
		if(params[idx] == '')
		return callback(new errors.ArgumentError(idx));
	}

	if(!_.isPlainObject(params.tplData))
		return callback(new errors.ArgumentError('tplData'));

	const self = this;

	//путь к шаблону html
	let template = __dirname + '/views/' +params.tplName+'.ejs';
	let content = params.tplData;
	let to = params.to;
	let subject = params.subject;

	// Use fileSystem module to read template file

	fs.readFile(template, 'utf8', function (err, file){

		if(err) return callback (err);

		//ejs.render(file, content); returns a string that will set in mailOptions
		let html = ejs.render(file, content);

		let mailOptions = {
			from: self.mailFrom,
			to: to,
			subject: subject,
			html: html
		};

		//пытаемся отправить письмо
		self.transporter().sendMail(mailOptions, function (err, info){

			if(err) return callback(err);
			//console.log(info);

			//успешная отправка
			callback(null);
		});
	});
};

module.exports = Mailer;
