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
	this.mailTo = config.mail.to;
	this.transport = null;
};

/**
 * возвращаем инстанс nodemailer.createTransport
 * @returns {null|*}
 */
Mailer.prototype.transporter = function()
{
	if(!this.transport)
	this.transport = nodemailer.createTransport(this.service);

	return this.transport;
};

/**
 * отправка почты
 * @param params - параметры для отправки письма
 * {
		to:'email@address.com',
		subject: 'тема письма',
		tplName:'имя шаблона html',
		tplData: {данные для шалона, если нужно}
	}
 * @param callback
 * @returns {Promise}
 * @throws
 *  errors.ArgumentError
 *  Error
 */
Mailer.prototype.send = function (params, callback)
{
	if(!_.isPlainObject(params))
	return callback(new errors.ArgumentError('params'));
	
	if (params['mailFrom'])
		this.mailFrom = params['mailFrom'];
	
	params = _.assign({
		to:this.mailTo,
		from:this.mailFrom,
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
	
	//путь к шаблону html
	let template = __dirname + '/views/' +params.tplName+'.ejs';
	let content = params.tplData;
	//let to = params.to;
	let subject = params.subject;
	
	// Use fileSystem module to read template file
	
	fs.readFile(template, 'utf8', (err, file)=>
	{
		if(err)
			return callback (err);
		
		//ejs.render(file, content); returns a string that will set in mailOptions
		let html = ejs.render(file, content);
		
		let mailOptions = {
			from: params.from,
			to: params.to,
			replyTo: params.from,
			subject: subject,
			html: html
		};
		//console.log(mailOptions);
		
		//пытаемся отправить письмо
		this.transporter().sendMail(mailOptions, (err)=>//, info
		{
			if(err)
				return callback(err);
			
			//успешная отправка
			process.nextTick(()=>
			{
				callback(null);
			});
		});
	});
};

module.exports = Mailer;
