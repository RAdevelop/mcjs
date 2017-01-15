"use strict";

const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Mail = require('app/lib/mail');

const CtrlMain = require('app/lib/controller');

class Home extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			}
			,"feedback": {
				'^\/?$': null
			}
		};
	}

	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		return this.getUser(this.getUserId())
			.then((userData) =>
			{
				this.view.setTplData("home", {});
				this.view.addPartialData("user/left", {user: userData});
				this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(Errors.NotFoundError, () =>
			{
				throw new Errors.HttpError(404);
			});
	}

	feedbackActionPost()
	{
		let tplData = this.getParsedBody();
		//console.log('feedbackActionPost = ', tplData);

		let tplFile = 'empty.ejs';

		return this._feedback(tplData)
			.then((tplData) =>
			{ //если валидация успешна
				//tplData.formError.error = false;
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch(Errors.FormError, (err) =>
			{
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			});
	}

	_feedback(tplData)
	{
		/*if (!tplData["i_u_id"] || tplData["i_u_id"] != this.getUserId())
			throw new Errors.HttpError(400);*/

		tplData = CtrlMain.stripTags(tplData, ["m_email, s_feedback_subject", "t_feedback_text"]);

		tplData["s_feedback_subject"] = CtrlMain.cheerio(tplData["s_feedback_subject"]).root().cleanTagEvents().html();
		tplData["t_feedback_text"] = CtrlMain.cheerio(tplData["t_feedback_text"]).root().cleanTagEvents().html();
		tplData["t_feedback_text"] = CtrlMain.helpers.nl2br(tplData["t_feedback_text"]);

		return this.getUser(tplData["ui_u_id"])
			.then((user)=>
			{
				if (user['u_mail'])
					tplData["m_email"] = user['u_mail'];

				return Promise.resolve(tplData);
			})
			.then((tplData)=>
			{
				let errors = {};

				if (!tplData["m_email"])
					errors["m_email"] = 'Укажите свой e-mail';

				if (tplData["s_feedback_subject"] == '')
					errors["s_feedback_subject"] = 'Укажите тему сообщения';

				if (tplData["t_feedback_text"] == '')
					errors["t_feedback_text"] = 'Укажите текст сообщения';

				return Promise.resolve(errors)
					.then((errors) =>
					{
						if (this.parseFormErrors(tplData, errors, 'Ошибка при отправке письма'))
						return Promise.resolve(tplData);
					});
			})
			.then((tplData)=>
			{
				let title = 'Обратная связь www.MotoCommunity.ru: ' + tplData['s_feedback_subject'];
				let sendParams = {
					//to:         '',
					mailFrom:   tplData["m_email"],
					subject:    title,
					tplName:    'feedback/feedback',
					tplData: {
						title: title,
						links: 'https://'+this.getHostPort(),
						link: 'http://'+this.getHostPort(),
						feedback_text: tplData['t_feedback_text']
					}
				};

				return new Promise((resolve, reject)=>
				{
					const Mailer = new Mail('gmail');
					Mailer.send(sendParams,  (err) =>
					{
						if(err)
						{
							let error = new Errors.AppMailError('Ошибка при отправке письма', err);
							Logger.error(error);

							return reject(error);
						}
						return resolve(tplData);
					});
				});
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Home;
