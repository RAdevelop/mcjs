/**
 * Created by RA on 19.11.2015.
 *
 * Пишем свои типы ошибки на основе require('common-errors')
 *
 * Все свои "Ошибки" именуем так [AppName]Error.
 * Например: AppMailError
 * чтобы можно было отличить от common-errors, и в будущем сучайно не пересечься в именованиях...
 */
"use strict";
const errors = require('common-errors');

/**
 * Ошибка при отправке почты....
 */
errors.AppMailError = errors.helpers.generateClass("AppMailError", {
	extends: errors.ConnectionError,
	globalize: true,
	args: ['message','inner_error'],
	generateMessage: function(){
		return this.message;
	}
});

/**
 * Ошибка при работе с Redis....
 */
errors.AppRedisError = errors.helpers.generateClass("AppRedisError", {
	extends: errors.ConnectionError,
	globalize: true,
	args: ['message','inner_error'],
	generateMessage: function(){
		return this.message;
	}
});

errors.AppRegistrationNotConfirmed = errors.helpers.generateClass("AppRegistrationNotConfirmed", {
	extends: errors.ConnectionError,
	globalize: true,
	args: ['message','inner_error'],
	generateMessage: function(){
		return this.message;
	}
});

errors.AppSqlError = errors.helpers.generateClass("AppSqlError", {
	extends: errors.data.SQLError,
	globalize: true,
	args: ['message', 'sqlCode', 'inner_error'],
	generateMessage: function(){
		return this.message;
	}
});

errors.FormError = errors.helpers.generateClass("FormError", {
	extends: errors.ValidationError,
	globalize: true,
	args: ['message', 'data', 'inner_error'],
	generateMessage: function(){
		return this.message;
	}
});

errors.LimitExceeded = errors.helpers.generateClass("LimitExceeded", {
	//extends: Error,
	globalize: true,
	args: ['message', 'inner_error'],
	generateMessage: function(){
		return 'Превышен лимит.'+ (this.message ? ' '+ this.message : '');
	}
});


//HTTP ERRORS

errors.HttpError = errors.helpers.generateClass("HttpError", {
	//extends: errors.HttpStatusError,
	globalize: true,
	args: ['status_code','message'],
	generateMessage: function(){

		this.status = (this.status_code ? this.status_code : 500);

		let message = 'Internal Server Error'; //внутренняя ошибка сервера;
		switch (this.status)
		{
			default:
			case 500:
				break;

			//4xx
			case 400:
				message = 'Bad request';
				break;

			case 401:
				message = 'Unauthorized';
				break;

			case 403:
				message = 'Forbidden';
				break;

			case 404:
				message = 'Not found';
				break;

			//5xx
			case 501:
				message = 'Not Implemented';// не реализовано
				break;
			case 502:
				message = 'Bad Gateway';// плохой, ошибочный шлюз
				break;
			case 503:
				message = 'Service Unavailable';//сервис недоступен
				break;
			case 504:
				message = 'Gateway Timeout';//шлюз не отвечает
				break;
			case 505:
				message = 'HTTP Version Not Supported';//версия HTTP не поддерживается
				break;
			case 506:
				message = 'Variant Also Negotiates';//вариант тоже проводит согласование
				break;
			case 507:
				message = 'Insufficient Storage';//переполнение хранилища.
				break;
			case 508:
				message = 'Loop Detected';//обнаружено бесконечное перенаправление
				break;
			case 509:
				message = 'Bandwidth Limit Exceeded';//исчерпана пропускная ширина канала.
				break;
			case 510:
				message = 'Not Extended';//не расширено.
				break;
			case 511:
				message = 'Network Authentication Required';//требуется сетевая аутентификация
				break;
		}

		if (!this.message)
			this.message = message;

		return this.message;
	}
});

//END HTTP ERRORS


module.exports = errors;