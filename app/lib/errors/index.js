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
	args: ['status_code'],
	generateMessage: function(){
		this.status = (this.status_code ? this.status_code : 500);

		switch (this.status)
		{
			default:
				this.message = 'Internal Server Error';
				break;
			case 400:
				this.message = 'Bad request';
				break;

			case 401:
				this.message = 'Unauthorized';
				break;

			case 403:
				this.message = 'Forbidden';
				break;

			case 404:
				this.message = 'Not found';
				break;
		}

		return this.message;
	}
});

//END HTTP ERRORS


module.exports = errors;