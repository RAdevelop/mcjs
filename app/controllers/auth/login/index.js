"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Cookie = require('app/lib/cookie');
const bcrypt = require('bcrypt');
const Mail = require('app/lib/mail');
const Logger = require('app/lib/logger')();

//const _ = require('lodash');

const Base = require('app/lib/controller');

class Login extends Base
{
	/**
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		if(this.getUserId())
			return this.getRes().redirect('back');
		
		if (this.getArgs().length > 0)
			return cb(new Errors.HttpStatusError(404, "Not Found"));
		
		let tplData = {
			m_mail:'',
			s_password:'',
			b_remember: 1
		};

		this.view.setTplData("auth/login", tplData);

		return cb(null);
	}
	
	/**
	 * авторизация
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionPost(cb)
	{
		//if(this.getUser()) return this.getRes().redirect('back');
		
		const self = this;
		
		let tplData = this.getReqBody();

		switch(this.getReq()._reqbody["btn_action"].toLowerCase())
		{
			default:
				self.view.setTplData("auth/login", tplData);
				return cb(new Errors.HttpStatusError(400, "Bad Request"));
			break;
			
			case 'login':
				return self._formLoginValidation(tplData, cb);
			break;
			
			case 'reset':
				return self._formResetValidation(tplData, cb);
			break;
		}
	}
	
	/**
	 *
	 * @param cb
	 * @returns {*}
	 */
	resetActionGet(cb)
	{
		if(this.getUserId()) return this.getRes().redirect('back');

		const self = this;
		
		let key = this.getArgs().shift().trim();
		
		let tplData = {
			s_password:'',
			s_password2:'',
			s_key: key
		};
		
		self.model("user").issetChangeRequest('pass_reset_confirm', key, function(err, isset)
		{
			if (err) return cb(err);

			if (!isset) tplData.s_key = null;

			self.view.setTplData("auth/reset", tplData);

			return cb(null);
		});
	}
	
	resetActionPost(cb)
	{
		let tplData = this.getReqBody();

		this._formPassUpdate(tplData, cb);
	}
	
	_formPassUpdate(tplData, cb)
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
			let errKeys = Object.keys(errors);
			
			if (errKeys.length)
			{
				tplData.formError.message = 'Ошибки при заполнении формы';
				tplData.formError.error = true;
				
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});
				
				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user/auth").updPassword(u_id, tplData["s_password"], function(err)
				{
					tplData.s_password = tplData.s_password2 = tplData.s_key = '';
					
					if (err) return reject(err);
					
					tplData.formError.message = 'Пароль успешно изменен';
					tplData.formError.text = 'Вы можете войти с новым паролем.';

					self.model("user").clearUserChangeRequest(u_id, 'pass_reset_confirm', function (err)
					{
						if (err) return reject(err);

						return resolve(tplData);
					});
				});
			});
		})
		.then(function(tplData)
		{
			self.view.setTplData("auth/reset", tplData);
			return cb(null);
		})
		.catch(Errors.ValidationError, function(err)
		{
			tplData.formError.errorName = err.name;
			self.view.setTplData("auth/reset", tplData);
			return cb(null);
		})
		.catch(function(err)
		{
			tplData.formError.errorName = err.name;
			return cb(err);
		});
	}
	
	/**
	 * 
	 * @param tplData
	 * @param cb
	 * @private
	 */
	_formResetValidation(tplData, cb)
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
			let errKeys = Object.keys(errors);
			
			if (errKeys.length)
			{
				tplData.s_password = '';
				tplData.formError.message = 'Ошибки при заполнении формы';
				
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});

				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user").getByEmail(tplData.m_email, function(err, userData)
				{
					if(err) return reject(err);
					
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
		.catch(Errors.ValidationError, Errors.NotFoundError, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;
			self.view.setTplData("auth/login", tplData);
			return cb(null);
		})
		.then(function(tplData)
		{
			tplData.formError.message = 'Вам отправлено письмо';
			tplData.formError.text = 'Проверьте свою почту <a href="https://'+(tplData.m_email.substr(tplData.m_email.indexOf('@')))+'" target="_blank">'+tplData.m_email+'</a>';

			tplData.formError.error = false;
			
			self.view.setTplData("auth/login", tplData);

			self.model("user/auth").createPassResetConfirmKey(tplData.userData, function(err, user)
			{
				if (err)
					return cb(error);
				
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
						Logger.error('%s, %s, %j',  error.message, error.status, error.stack);
					}
					
					return cb(error);
				});
			});
		})
		.catch(function(err)
		{
			return cb(err);
		});
	}
	
	
	/**
	 * авторизация на сайте
	 *
	 * @param tplData
	 * @param cb - ф-ция
	 * @private
	 * @returns {Promise}
	 */
	_formLoginValidation(tplData, cb)
	{
		let errors = {};
		
		tplData.s_password = tplData.s_password.trim();
		tplData.m_email = tplData.m_email.trim();
		
		if(tplData.s_password.length < 6)
		{
			errors["s_password"] = 'короткий пароль';
		}
		if(!this.getReq()._reqbody.m_email)
		{
			errors["m_email"] = 'e-mail указан неверно';
		}
		
		tplData.b_remember = this.getReq()._reqbody.b_remember;
		
		const self = this;

		return Promise.resolve(errors).then(function(errors)
		{
			let errKeys = Object.keys(errors);
			if (errKeys.length)
			{
				tplData.s_password = '';
				tplData.formError.message = 'Ошибки при заполнении формы';
				
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});

				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
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
						if(err) return reject(err);
						
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
			self.getReq().session.regenerate(function(err)
			{
				if(err)
				{
					self.getReq().session.destroy();
					
					if(self.getReq().signedCookies.rtid)
						Cookie.clearUserId(self.getReq(), self.getRes());

					return cb(err);
				}

				//наличие этой куки потом проверять в req.signedCookies.rtid
				// remember the ID
				if(tplData.b_remember)
					Cookie.setUserId(self.getRes(), tplData.userData.u_id);
				
				self.getReq().session.rtid = tplData.userData.u_id;
				
				self.view.setTplData("auth/login", tplData);
				return cb(null);
			});
		})
		.catch(Errors.ValidationError, Errors.NotFoundError, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;
			self.view.setTplData("auth/login", tplData);
			return cb(null);
		})
		.catch(Errors.AppRegistrationNotConfirmed, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			self.view.setTplData("auth/login", tplData);

			self.model("user/auth").createReqConfirmKey(tplData.userData, function(err, user)
			{
				if (err)
					return cb(err);
				
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
						Logger.error('%s, %s, %j',  error.message, error.status, error.stack);
					}
					
					return cb(error);
				});
			});
		})
		.catch(function(err)
		{
			return cb(err);
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Login;
