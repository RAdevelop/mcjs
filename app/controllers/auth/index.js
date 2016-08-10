"use strict";

//const Errors = require('app/lib/errors');
//const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Auth extends Base
{
	
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Auth;



/*********************************************** OLD VERSION
const logger = require('app/lib/logger')();
const Errors = require('app/lib/errors');

const Models = require('app/models');
const Template = require('app/lib/template');
const Mail = require('app/lib/mail');
const Async = require('async');
const _ = require('lodash');

function defaultData()
{
	let  tplData = {m_email:'', s_password:'', b_remember: true, userData: null, mailError: false, back: '/'};

	tplData.formError = {
		message: '',
		error: false,
		fields: {
			m_email: null,
			s_password: null
		}
	};
	return tplData;
}


/**
 * показываем страницу регистрациии
 * @param req
 * @param res
 * @param next
 *
exports.regGet = function(req, res, next){
	if(req._user) return res.redirect('back');

	var tplData = defaultData();
		tplData.title = res.app.settings.title + ' | Registration page';
	
	var View = new Template(req, res, next, Models);
	View.render('auth/registration.ejs', tplData);
};



/*

 Для успешной защиты от подмены сессии необходимо регенерировать идентификатор в следующих случаях:

 в момент создания новой сессии;
 в момент изменения привилегий пользователя (например, авторизация пользователя).
 */
/**
 * пробуем зарегистрировать пользователя
 *
 * @param req
 * @param res
 * @param next
 *
exports.regPost = function(req, res, next)
{
	if(req._user) return res.redirect('back');

	var tplData = _.assign(defaultData(), req.body);
	tplData.title = res.app.settings.title + ' | Reg page';
	tplData._reqbody = req._reqbody;
	
	Async.waterfall([
		function(asyncCb)
		{
			auth_form_validation(tplData, function(err, tplData)
			{
				if (err) return asyncCb(err, tplData);
				
				return asyncCb(null, tplData);
			});
		},
		function(tplData, asyncCb) //регистрация пользователя 
		{
			Models.get('user').reg(tplData.m_email, tplData.s_password, function(err, userData)
			{
				tplData.userData = userData;
				
				if(err) return  asyncCb(err, tplData);

				req.session.regenerate(function(err)
				{
					if(err)
					{
						req.session.destroy();
						return asyncCb(err, tplData);
					}
					
					req.session.rtid = tplData.userData.u_id;
					return asyncCb(null, tplData);
				});
			});
		},
		function(tplData, asyncCb) {//отправка на почту уведомления о регистрации

			var Mailer = new Mail('gmail');

			var sendParams = {
				to:tplData.userData.u_mail,
				subject: 'Успешная регистрация на сайте www.MotoCommunity.ru',
				tplName:'auth/mail',
				tplData: {
					title: 'Успешная регистрация на сайте www.MotoCommunity.ru',
					link: 'http://www.MotoCommunity.ru'
				}
			};

			Mailer.send(sendParams, function (err)
			{
				//то, что письмо не отправилось, не повод "запрещать" пользователю быть авторизованным при регистрации
				var error = null;
				if(err)
				{
					tplData.mailError = true;
					error = new Errors.AppMailError('Ошибка при отправке письма', err);
					logger.error('%s, %s, %j',  error.message, error.status, error.stack);
				}

				return asyncCb(error, tplData);
			});
		}
	], function (err, tplData) 
	{
		/*
		 нужно проверять тип шибки. в зависимости от типа ошибки,
		 принимать решение,вызывать ли next(err) или обработать ситуацию
		 *
		if(err)
		{
			switch (err.name){
				default:
					return  next(err);
					break;

				case 'ValidationError':
				case 'AppMailError':
					//никуда не уходим, покажем ошибки
					break;

				case 'AlreadyInUseError':
					tplData.formError.error = true;
					tplData.formError.message = 'Такой пользователь уже зарегистрирован!';

					break;
			}
		}

		if(tplData.userData) res.locals.user = tplData.userData;

		tplData.s_password = '';

		var View = new Template(req, res, next, Models);
		View.render('auth/registration.ejs', tplData);
	});
};

/**
 * валидация формы
 * 
 * @param tplData
 * @param cb
 * @returns {*}
 *
function auth_form_validation(tplData, cb)
{	
	let errs = {};
	
	if(tplData.s_password.length < 6)
	{
		errs["s_password"] = 'короткий пароль';
	}
	if(!tplData._reqbody.m_email)
	{
		errs["m_email"] = 'e-mail указан неверно';
	}
	
	tplData.b_remember = tplData._reqbody.b_remember;
	
	let errKeys = Object.keys(errs);
	
	if (errKeys.length == 0)
	return cb(null, tplData);
	
	//на всякий случай чистим
	tplData.s_password = '';
	
	tplData.formError.error = true;
	tplData.formError.message = "Ошибка при заполнении фомры";
	
	for(let i in errs)
	{
		tplData.formError.fields[i] = errs[i];
	}
	//console.log(tplData);
	return cb(new Errors.ValidationError(tplData.formError.message), tplData);
}
*/