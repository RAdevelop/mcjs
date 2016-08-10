/**
 * Created by RA on 16.02.2016.
 */
"use strict";
const logger = require('app/lib/logger')();
const Errors = require('app/lib/errors');
const Mail = require('app/lib/mail');
const Template = require('app/lib/template');

//module.exports = function(app, Classes, Template)
module.exports = function(app, Classes)
{
	return function(err, req, res, next)
	{
		//Classes.modelEnd();
		/*if(app.get('env') === 'dev')
		{
			logger.debug(err);
			if((err.status >= 500) == false)
				logger.error('%s, %s, %j', err.message, err.status, err.stack);
		}*/

		err.status = err.status || 500;

		if (err.status >= 500)
		{
			logger.error('%s, %s, %j', err.message, err.status, err.stack);

			const Mailer = new Mail('gmail');
			let sendParams = {
				to: 'roalexey@yandex.ru',
				subject: 'Ошибка ' + (err.status || 500),
				tplName: 'errors/error',
				tplData: {error: err}
			};

			Mailer.send(sendParams, function (err)
			{
				if (err)
				{
					let error = new Errors.AppMailError('Ошибка при отправке письма', err);
					logger.error('%s, %s, %j', error.message, error.status, error.stack);
				}
			});
		}
		let error = err;

		if(app.get('env') === 'dev')
			error.stack = '';

		let tplData = {
			error: error,
			title: error.message
		};

		res.status(err.status || 500);

		const View = new Template(req, res, next);
		View.setTplData("error", tplData);
		View.render(false);
	}
};