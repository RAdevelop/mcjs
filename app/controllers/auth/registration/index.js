"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Mail = require('app/lib/mail');
const Logger = require('app/lib/logger');
const Base = require('app/lib/controller');

class Registration extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			},
			"confirm": {
				'^\/?$': null,
				'^\/?[0-9A-Za-z]{32,255}\/?$': ['s_key'],
			}
		}
	}

	/**
	 *
	 * форма регистрации
	 *
	 * @returns {*}
	 */
	indexActionGet()
	{
		/*if (this.getUserId())
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
		
		let tplData = {
			m_email: '',
			s_password: '',
			s_password2: ''
		};
		
		this.view.setTplData("auth/registration", tplData);
		return Promise.resolve(null);
	}
	
	/**
	 * 
	 * отправка запроса на регисистрацию
	 *
	 * @returns {*}
	 */
	indexActionPost()
	{
		if (this.getReq()._user)
			return this.getRes().redirect('back');

		let tplFile = "auth/registration";

		let tplData = {
			m_email: '',
			s_password: '',
			s_password2: ''
		};
		tplData = this.getReqBody();

		const self = this;
		
		return self._formRegValidation(tplData)
		.then(function(tplData) //если регистрация успешна
		{
			self.view.setTplData(tplFile, tplData);
			return Promise.resolve(null);
		})
		.catch(Errors.ValidationError, Errors.AlreadyInUseError, Errors.AppMailError, function(err)
		{
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			self.view.setTplData(tplFile, tplData);

			return Promise.resolve(null);
		})
		.catch(function(err)
		{
			throw err;
		});
	}
	/**
	 * регистрация на сайте
	 *
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formRegValidation(tplData)
	{
		let errors = {};
		
		tplData.s_password = tplData.s_password.trim();
		tplData.s_password2 = tplData.s_password2.trim();
		
		if(!this.getReq()._reqbody.m_email)
		{
			errors["m_email"] = 'e-mail указан неверно';
		}
		
		if(tplData.s_password.length < 6)
		{
			errors["s_password"] = 'короткий пароль';
		}
		else if(tplData.s_password != tplData.s_password2 || tplData.s_password2 == '')
		{
			errors["s_password"] = 'пароли не совпадают';
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
				self.model("user/auth").reg(tplData.m_email, tplData.s_password, function(err, userData)
				{
					tplData.s_password = '';
					tplData.s_password2 = '';

					if(err) return reject(err);

					tplData.userData = userData;

					return resolve(tplData);
				});
			});
		})
		.then(function(tplData)
		{
			//отправка почты
			return new Promise(function(resolve, reject)
			{
				const Mailer = new Mail('gmail');
				
				tplData.formError.message = 'Успешная регистрация на сайте';
				tplData.formError.text = 'Проверьте свою почту <a href="https://'+(tplData.m_email.substr(tplData.m_email.indexOf('@')))+'" target="_blank">'+tplData.m_email+'</a>';
				
				let sendParams = {
					to:         tplData.m_email,
					subject:    'Успешная регистрация на сайте www.MotoCommunity.ru',
					tplName:    'auth/registration',
					tplData: {
						title: 'Успешная регистрация на сайте www.MotoCommunity.ru',
						links: 'https://'+self.getHostPort(),//'https://www.MotoCommunity.ru',
						link: 'http://'+self.getHostPort(),//'http://www.MotoCommunity.ru',
						key: tplData.userData.u_req_key
					}
				};
				
				Mailer.send(sendParams, function (err)
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
		})
		.catch(Errors.AlreadyInUseError, function(err)
		{
			tplData.formError.message = 'Такой пользователь уже существует';

			throw err;
		});
	}

	confirmed(tplData, u_id, key)
	{
		const self = this;

		return new Promise(function(resolve, reject)
		{
			if (!u_id)
				return reject(new Errors.HttpStatusError(404, "Not Found"));

			self.model("user/auth").regConfirm(u_id, key, function(err, valid)
			{
				if (err) return reject(err);

				tplData.confirmed = valid;
				return resolve(tplData);
			});
		});
	}

	/**
	 * страница подтверждения регистрации
	 *
	 * @returns {*}
	 */
	confirmActionGet()
	{
		if (this.getUserId())
			return this.getRes().redirect('/');
		
		/*if (this.getArgs().length > 1)
			throw new Errors.HttpStatusError(404, "Not Found");*/

		const self = this;

		let {s_key} = this.routeArgs;
		let u_id = s_key.substr(32);
		let tplData = {confirmed: false};

		return self.confirmed(tplData, u_id, s_key)
		.then(function(tplData)
		{
			self.view.setTplData('auth/confirm', tplData);
			return Promise.resolve(null);
		})
		.catch(function(err)
		{
			throw err;
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Registration;
