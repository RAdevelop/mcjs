"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Mail = require('app/lib/mail');
const Logger = require('app/lib/logger');
const CtrlMain = require('app/lib/controller');

class Registration extends CtrlMain
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
			},
			"confirm": {
				'^\/?$': null,
				'^\/?[0-9A-Za-z]{32,255}\/?$': ['s_key']
			}
		}
	}

	/**
	 *
	 * форма регистрации
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		/*if (this.getUserId())
			return this.getRes().redirect('back');*/

		if(this.getUserId())
		{
			return Promise.resolve()
				.then(() => {
					return this.getRes().redirect('/');
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
	 * @returns {Promise}
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

		return this._formRegValidation(tplData)
		.then((tplData) =>
		{ //если регистрация успешна

			this.view.setTplData(tplFile, tplData);
			return Promise.resolve(null);
		})
		.catch(Errors.ValidationError, Errors.AlreadyInUseError, Errors.AppMailError, (err) => {
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			this.view.setTplData(tplFile, tplData);

			return Promise.resolve(null);
		})
		.catch((err) => {
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
		.then((errors)=>
		{
			if (self.parseFormErrors(tplData, errors))
				return Promise.resolve(tplData);
		})
		.then((tplData)=>
		{
			return new Promise((resolve, reject)=>
			{
				self.model("user/auth").reg(tplData.m_email, tplData.s_password, (err, userData)=>
				{
					tplData.s_password = '';
					tplData.s_password2 = '';

					if(err) return reject(err);

					tplData.userData = userData;

					return resolve(tplData);
				});
			})
				.then((tplData)=>
				{
					return self.getClass('user/groups').getGroupsOnRegister()
						.then((list)=>
						{
							let ug_ids = [];

							list.forEach((item)=>
							{
								ug_ids.push(item['ug_id']);
							});
							return Promise.resolve([tplData, ug_ids]);
						});
				})
				.spread((tplData, ug_ids)=>
				{
					return self.getClass('user/groups').addUserToGroups(tplData.userData.u_id, ug_ids)
						.then(()=>
						{
							return Promise.resolve(tplData);
						});
				});
		})
		.then((tplData)=>
		{
			//отправка почты
			return new Promise((resolve, reject)=>
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
				
				Mailer.send(sendParams, (err)=>
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
		.catch(Errors.AlreadyInUseError, (err)=>
		{
			tplData.formError.message = 'Такой пользователь уже существует';

			throw err;
		});
	}

	confirmed(tplData, u_id, key)
	{
		return new Promise((resolve, reject)=>
		{
			if (!u_id)
				return reject(new Errors.HttpError(404));

			this.model("user/auth").regConfirm(u_id, key, (err, valid)=>
			{
				if (err)
					return reject(err);

				tplData.confirmed = valid;

				if (valid)
				{
					process.nextTick(()=>
					{
						const Mailer = new Mail(CtrlMain.appConfig.mail.service);

						let title = 'Подтверждение регистрации на сайте www.MotoCommunity.ru';
						let sendParams = {
							//to:         '',
							subject:    title,
							tplName:    'auth/user/new',
							tplData: {
								title: title,
								links: 'https://'+this.getHostPort(),
								link: 'http://'+this.getHostPort(),
								u_id: u_id
							}
						};

						Mailer.send(sendParams,  (err) =>
						{
							if(err)
								Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
						});
					});
				}
				return resolve(tplData);
			});
		});
	}

	/**
	 * страница подтверждения регистрации
	 *
	 * @returns {Promise}
	 */
	confirmActionGet()
	{
		if (this.getUserId())
			return this.getRes().redirect('/');
		
		/*if (this.getArgs().length > 1)
			throw new Errors.HttpStatusError(404, "Not Found");*/

		let {s_key} = this.routeArgs;
		let u_id = s_key.substr(32);
		let tplData = {confirmed: false};

		return this.confirmed(tplData, u_id, s_key)
		.then((tplData)=>
		{
			this.view.setTplData('auth/confirm', tplData);
			return Promise.resolve(null);
		})
		.catch((err)=>
		{
			throw err;
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Registration;
