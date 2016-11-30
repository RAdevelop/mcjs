"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Cookie = require('app/lib/cookie');
const bcrypt = require('bcrypt');
const Mail = require('app/lib/mail');
const Logger = require('app/lib/logger');

//const _ = require('lodash');

const Base = require('app/lib/controller');

class Login extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': []
			},
			"reset": {
				'^\/?\\S{32,}\/?$': ['s_key']
			}
		}
	}

	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		/*if(this.getUserId())
			return this.getRes().redirect('back');*/

		if(this.getUserId())
		{
			return Promise.resolve()
				.bind(this)
				.then(function ()
				{
					return this.getRes().redirect('back');
				});
		}
		
		if (this.getArgs().length > 0)
			throw new Errors.HttpStatusError(404, "Not Found");
		
		let tplData = {
			m_mail:'',
			s_password:'',
			b_remember: 1
		};

		this.view.setTplData("auth/login", tplData);

		return Promise.resolve(null);
	}
	
	/**
	 * авторизация
	 *
	 * @returns {Promise}
	 */
	indexActionPost()
	{
		//if(this.getUser()) return this.getRes().redirect('back');

		let tplData = this.getParsedBody();

		switch(tplData["btn_action"])
		{
			default:
				this.view.setTplData("auth/login", tplData);
				throw new Errors.HttpStatusError(400, "Bad Request");
			break;
			
			case 'login':
				return this._formLoginValidation(tplData);
			break;
			
			case 'reset':
				return this._formResetValidation(tplData);
			break;
		}
	}
	
	/**
	 *
	 * @returns {Promise}
	 */
	resetActionGet()
	{
		if(this.getUserId())
			return this.getRes().redirect('back');

		const self = this;

		let {s_key} = this.routeArgs;

		let tplData = {
			s_password:'',
			s_password2:'',
			s_key: s_key
		};
		
		return new Promise(function (resolve, reject)
		{
			self.model("user").issetChangeRequest('pass_reset_confirm', s_key, function(err, isset)
			{
				if (err)
					return reject(err);

				if (!isset)
					tplData.s_key = null;

				self.view.setTplData("auth/reset", tplData);

				return resolve(null);
			});
		});
	}
	
	resetActionPost()
	{
		let tplData = this.getReqBody();

		return this._formPassUpdate(tplData);
	}
	
	_formPassUpdate(tplData)
	{
		const self = this;
		
		let errors = {};
		
		tplData.s_key = tplData.s_key.trim();
		tplData.s_password = tplData.s_password.trim();
		tplData.s_password2 = tplData.s_password2.trim();
		
		if(tplData.s_password.length < 6)
		{
			errors["s_password"] = 'короткий пароль';
		}
		else if(tplData.s_password != tplData.s_password2 || tplData.s_password2 == '')
		{
			errors["s_password"] = 'пароли не совпадают';
		}
		
		let u_id = tplData.s_key.substr(32);
		
		tplData = Object.assign(tplData, self.formError());
		
		return Promise.resolve(errors)
		.then(function(errors)
		{
			self.parseFormErrors(tplData, errors);
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user/auth").updPassword(u_id, tplData["s_password"], function(err)
				{
					tplData.s_password = tplData.s_password2 = tplData.s_key = '';
					
					if (err)
						return reject(err);
					
					tplData.formError.message = 'Пароль успешно изменен';
					tplData.formError.text = 'Вы можете войти с новым паролем.';

					self.model("user").clearUserChangeRequest(u_id, 'pass_reset_confirm', function (err)
					{
						if (err)
							return reject(err);

						return resolve(tplData);
					});
				});
			});
		})
		.then(function(tplData)
		{
			self.view.setTplData("auth/reset", tplData);
			return Promise.resolve(null);
		})
		.catch(Errors.ValidationError, function(err)
		{
			tplData.formError.errorName = err.name;
			self.view.setTplData("auth/reset", tplData);
			return Promise.resolve(null);
		})
		.catch(function(err)
		{
			throw err;
		});
	}
	
	/**
	 * 
	 * @param tplData
	 * @private
	 */
	_formResetValidation(tplData)
	{
		let errors = {};
		
		tplData.m_email = tplData.m_email.trim();
		
		if(!this.getReq()._reqbody.m_email)
		{
			errors["m_email"] = 'e-mail указан неверно';
		}

		const self = this;
		
		return Promise.resolve(errors)
		.then(function(errors)
		{
			self.parseFormErrors(tplData, errors);

			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user").getByEmail(tplData.m_email, function(err, userData)
				{
					if(err)
						return reject(err);
					
					tplData.userData = self.model("user").filterData(userData);
					
					return resolve(tplData);
				});
			});
		})
		.catch(Errors.NotFoundError, function(err)
		{
			tplData.formError.message = 'Ошибка';
			tplData.formError.text = 'Такого пользователя не существует.';

			throw err;
		})
		.then(function(tplData)
		{
			tplData.formError.message = 'Вам отправлено письмо';
			tplData.formError.text = 'Проверьте свою почту <a href="https://'+(tplData.m_email.substr(tplData.m_email.indexOf('@')))+'" target="_blank">'+tplData.m_email+'</a>';

			tplData.formError.error = false;
			
			self.view.setTplData("auth/login", tplData);

			return new Promise(function(resolve, reject)
			{
				self.model("user/auth").createPassResetConfirmKey(tplData.userData, function(err, user)
				{
					if (err)
						return reject(error);

					const Mailer = new Mail('gmail');

					let sendParams = {
						to:         tplData.m_email,
						subject:    'Запрос на смену пароля на сайте www.MotoCommunity.ru',
						tplName:    'auth/reset',
						tplData: {
							title: 'Запрос на смену пароля на сайте www.MotoCommunity.ru',
							links: 'https://'+self.getHostPort(),//'https://www.MotoCommunity.ru',
							link: 'http://'+self.getHostPort(),//'http://www.MotoCommunity.ru',
							key: user.u_req_key
						}
					};

					Mailer.send(sendParams, function (err)
					{
						let error = null;
						if(err)
						{
							error = new Errors.AppMailError('Ошибка при отправке письма', err);
							Logger.error(error);
						}

						if (error)
						return reject(error);

						return resolve(null);
					});
				});
			});
		})
		.catch(Errors.ValidationError, Errors.NotFoundError, function(err)
		{
			tplData.s_password = '';
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			self.view.setTplData("auth/login", tplData);

			return Promise.resolve(null);
		})
		.catch(function(err)
		{
			throw err;
		});
	}
	
	
	/**
	 * авторизация на сайте
	 *
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formLoginValidation(tplData)
	{
		let errors = {};
		
		tplData.s_password = tplData.s_password.trim();
		tplData.m_email = tplData.m_email.trim();
		
		if(tplData.s_password.length < 6)
		{
			errors["s_password"] = 'короткий пароль';
		}
		if(!tplData["m_email"])
		{
			errors["m_email"] = 'e-mail указан неверно';
		}
		
		tplData.b_remember = (tplData.b_remember ? tplData.b_remember : 0);
		
		const self = this;

		return Promise.resolve(errors).then(function(errors)
		{
			self.parseFormErrors(tplData, errors);
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user").getByEmail(tplData.m_email, function(err, userData)
				{
					if(err) return reject(err);
					
					bcrypt.hash(tplData.s_password, userData["u_salt"], function(err, hash)
					{
						if(err)
							return reject(err);
						
						if(userData["u_pass"] == hash)
						{
							tplData.userData = self.model("user").filterData(userData);
							tplData.s_password = '';
							
							if (tplData.userData["u_reg"] == 0)
							{
								return reject(new Errors.AppRegistrationNotConfirmed(""));
							}
							else
							return resolve(tplData);
							
						}//пароль неверный
						else return reject(new Errors.NotFoundError(""));
					});
				});
			});
		})
		.catch(Errors.AppRegistrationNotConfirmed, function(err)
		{
			tplData.s_password = '';
			tplData.formError.message = 'Вы не подтвердили регистрацию';
			tplData.formError.text = 'Проверьте свою почту <a href="https://'+(tplData.m_email.substr(tplData.m_email.indexOf('@')))+'" target="_blank">'+tplData.m_email+'</a>';
			
			throw err;
		})
		.catch(Errors.NotFoundError, function(err)
		{
			tplData.s_password = '';
			tplData.formError.message = 'Ошибка';
			tplData.formError.text = 'Такого пользователя не существует, или пароль указа неверно.';
			
			throw err;

		})
		.then(function(tplData) //если валидация успешна
		{
			//TODO надо return Promise
			return new Promise(function(resolve, reject)
			{
				self.getReq().session.regenerate(function(err)
				{
					if(err)
					{
						self.getReq().session.destroy();

						if(self.getReq().signedCookies.rtid)
							Cookie.clearUserId(self.getReq(), self.getRes());

						return reject(err);
					}

					//наличие этой куки потом проверять в req.signedCookies.rtid
					// remember the ID
					if(tplData.b_remember)
						Cookie.setUserId(self.getRes(), tplData.userData.u_id);

					self.getReq().session.rtid = tplData.userData.u_id;

					self.view.setTplData("auth/login", tplData);
					return resolve(null);
				});
			});
		})
		.catch(Errors.ValidationError, Errors.NotFoundError, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			self.view.setTplData("auth/login", tplData);

			return Promise.resolve(null);
		})
		.catch(Errors.AppRegistrationNotConfirmed, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			self.view.setTplData("auth/login", tplData);

			return new Promise(function(resolve, reject)
			{
				self.model("user/auth").createReqConfirmKey(tplData.userData, function(err, user)
				{
					if (err)
						return reject(err);

					const Mailer = new Mail('gmail');

					let sendParams = {
						to:         tplData.m_email,
						subject:    'Повторный запрос на подтверждение регистрации на сайте www.MotoCommunity.ru',
						tplName:    'auth/registration',
						tplData: {
							title: 'Повторный запрос на подтверждение регистрации на сайте www.MotoCommunity.ru',
							links: 'https://'+self.getHostPort(),//'https://www.MotoCommunity.ru',
							link: 'http://'+self.getHostPort(),//'http://www.MotoCommunity.ru',
							key: user.u_req_key
						}
					};

					Mailer.send(sendParams, function (err)
					{
						let error = null;
						if(err)
						{
							error = new Errors.AppMailError('Ошибка при отправке письма', err);
							Logger.error(error);
						}

						if (error)
						return reject(error);

						return resolve(null);
					});
				});
			});
		})
		.catch(function(err)
		{
			throw err;
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Login;
