/**
 * Created by RA on 16.02.2016.
 */
"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Mail = require('app/lib/mail');
const Template = require('app/lib/template');

//module.exports = function(app, Classes)
module.exports = function(app)
{
	return function(err, req, res, next)
	{
		//Classes.modelEnd();
		/*if(app.get('env') === 'dev')
		{
			Logger.debug(err);
			if((err.status >= 500) == false)
				Logger.error(err);
		}*/

		err.status = err.status || 500;

		if (err.status >= 500)
		{
			Logger.error(err);

			const Mailer = new Mail('gmail');
			let sendParams = {
				to: 'roalexey@yandex.ru',
				subject: 'Ошибка ' + (err.status || 500),
				tplName: 'errors/error',
				tplData: {error: err}
			};

			Mailer.send(sendParams, (err)=>
			{
				if (err)
				{
					let error = new Errors.AppMailError('Ошибка при отправке письма', err);
					Logger.error(error);
				}
			});
		}

		if(app.get('env') === 'prod')
			err.stack = '';

		let tplData = {
			error: err,
			title: (err.status == 500 ? 'Internal Server Error' :err.message)
		};

		res.status(err.status);
		let tplFile = (err.status >=500 ? 'error500' : 'error');
		const View = new Template(req, res);
		View.setTplData(tplFile, tplData).render(false);
	}
};