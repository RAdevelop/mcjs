"use strict";

const Logger = require('app/lib/logger');
const Moment = require('moment');
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const Mail = require('app/lib/mail');
const FileUpload = require('app/lib/file/upload');
const Pages = require('app/lib/pages');

//const FileErrors = require('app/lib/file/errors');
//const _ = require('lodash');

const CtrlMain = require('app/lib/controller');

class Profile extends CtrlMain 
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				"^\/?[1-9][0-9]*\/?$" : ['i_u_id'] //профиль пользователя
				,'^\/?$': null
			},
			"edit": {
				'^\/?$': null
			},
			//upload ava
			"ava": {
				'^\/?$': null
			},
			"change": {
				'^\/?mail\/[0-9A-Za-z]{32,255}\/?$': ['s_change_type', 's_key']
				,'^\/?$': null
			}
		};
	}

	/*
	TODO добавить провеки на то, что "редактирем" сами себя.
	то есть пользователь может менять данные только для своего u_id
	 */

	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 * 
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		let {i_u_id=this.getUserId()} = this.routeArgs;

		return this.getUser(i_u_id)
			.then((userData) =>
			{
				if (!userData || !userData.u_id)
					throw new Errors.HttpError(404);

				return this.getClass('user/photo')
					.getAlbumList(this.getUserId(), i_u_id, new Pages(1, 4))
					.spread((albums, Pages) =>
					{
						Pages = null;

						let tplFile = "user/profile/index.ejs";
						let tplData = {
							user: userData,
							albums: albums
						};
						this.view.setTplData(tplFile, tplData);
						this.view.addPartialData("user/left", {user: userData});
						//self.view.addPartialData("user/right", {}); //TODO

						return Promise.resolve(null);
					});
			})
			.catch((err) =>
			{
				throw err;
			});
	}
	
	/**
	 * обновляем данные пользователя (свою, или выбранного)
	 *
	 * @returns {Promise}
	 */
	/*indexActionPost()
	{
		if (!this.isAuthorized())
			throw new Errors.HttpStatusError(401, "Unauthorized");
		
		const self = this;
		let tplFile = 'user/index.ejs';
		let tplData = self.getUser();

		console.log('indexActionPost()');

		this.getClass("user").getUserData(tplData)
			.bind(this)
			.then(function(tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}*/
	
	/**
	 * профиль пользователя. формы редактирования данных
	 *
	 * @returns {Promise}
	 */
	editActionGet()
	{
		if (!this.isAuthorized())
			throw new Errors.HttpError(401);

		return this.getUser(this.getUserId())
			.then((userData) =>
			{

				let tplData = {};
				Object.assign(tplData, userData, FileUpload.createToken('user_ava', {"u_id": userData["u_id"]}) );

				let tplFile = 'user/profile/edit.ejs';
				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData('user/left', {user: userData});

				//экспрот данных в JS на клиента
				this.getRes().expose(userData, 'userLocation');
				this.getRes().expose(FileUpload.exposeUploadOptions('user_ava'), 'avaUploadOpts');

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}
	
	/**
	 * обновляем данные пользователя в ЛК
	 *
	 * @returns {Promise}
	 */
	editActionPost()
	{
		let tplFile = 'user/profile/edit.ejs';
		let tplData = this.getParsedBody();

		return this._formProfileValidation(tplData)
			.then((tplData) =>
			{ //если все ок

				return this.getClass('user')
					.updateUserSessionData(tplData['u_id']||tplData['i_u_id']||0)
					.then(() =>
					{
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch(Errors.FormError, Errors.AlreadyInUseError, (err) =>
			{
				//такие ошибки не уводят со страницы.
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				//this.getRes().expose();
				return Promise.resolve(true);
			})
			.catch((err) =>
			{
				throw err;
			});
	}
	
	/**
	 * обработка запросов по изменению данных (например, смена емейла...)
	 *
	 * @returns {Promise}
	 */
	changeActionGet()
	{
		let tplData = this.getReqBody();
		
		return this._changeConfirm(tplData)
			.then((tplData) =>
			{
				this.view.setTplData('user/profile/change_mail_confirm.ejs', tplData);
				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}
	
	_changeConfirm(tplData)
	{
		let {s_change_type, s_key} = this.routeArgs;

		switch (s_change_type)
		{
			default:
				throw new Errors.HttpError(404);
				break;
			
			case 'mail':

				return this._changeMailConfirm(tplData, s_key);
				break;
		}
	}
	
	_changeMailConfirm(tplData, key)
	{
		//let key = this.getArgs().shift();
		
		const self = this;
		
		return new Promise(function(resolve, reject)
		{
			self.model("user/profile")
				.confirmReqChangeMail(self.getUser().u_id, key, function(err, confirmed)
				{
					if (err)
						return reject(err);

					tplData.confirmed = confirmed;
					return resolve(tplData);
				});
		});
	}
	
	
	/**
	 * обший метод валидации форм проифля пользоваеля
	 *
	 * @param tplData - obj data for template
	 * @returns {Promise}
	 */
	_formProfileValidation(tplData)
	{
		if (!this.isTheSameUser(tplData.i_u_id))
			return Promise.reject(new Errors.HttpStatusError(403, "Forbidden"));

		if (!tplData["btn_save_profile"])
			return Promise.reject(new Errors.HttpStatusError(400, "Bad request"));

		//console.log(tplData);

		switch(tplData["btn_save_profile"])
		{
			default:
				tplData.formError.error = true;
				tplData.formError.message = 'Невереные данные';

				throw (new Errors.HttpError(400, tplData.formError.message));
				break;
			
			case 'login':
				return this._formProfileLoginValidation(tplData);
				break;
			
			case 'base':
				return this._formProfileBaseValidation(tplData);
				break;
			
			case 'email':
				return this._formChangeEmailValidation(tplData);
				break;
			
			case 'password':
				return this._formChangePasswordValidation(tplData);
				break;
			
			case 'location':
				return this._formLocationValidation(tplData);
				break;

			case 'crop_ava':
				return this._cropAva(tplData);
				break;
		}
	}

	_cropAva(tplData)
	{
		tplData["i_file_id"] = tplData["i_file_id"] || null;
		tplData["i_crop_x"] = tplData["i_crop_x"] || null;
		tplData["i_crop_y"] = tplData["i_crop_y"] || null;
		tplData["i_crop_width"] = tplData["i_crop_width"] || null;
		tplData["i_crop_height"] = tplData["i_crop_height"] || null;

		let errors = {};

		if (tplData["i_file_id"] == null ||
			tplData["i_crop_x"]  == null ||
			tplData["i_crop_y"]  == null ||
			tplData["i_crop_width"]  == null ||
			tplData["i_crop_height"] == null)
			errors["i_file_id"] = "Фотография не выбрана";

		return Promise.resolve(errors)
			.then((errors) => {
				if (this.parseFormErrors(tplData, errors, 'Ошибка при кадрировании фотографии'))
					return Promise.resolve(tplData);
			})
			.then((tplData) => {

				return this.getClass('user/photo/profile')
					.getUserAva(this.getUserId())
					.then((ava) =>
					{
						ava["cropSrc"] = ava["previews"]["1024_768"];
						ava["dir"] = ava["ai_dir"];

						return FileUpload.cropImage(ava, 'user_ava', tplData["i_crop_x"], tplData["i_crop_y"], tplData["i_crop_width"], tplData["i_crop_height"])
							.then((ava) => {
								return Promise.resolve(ava);
							});
					});
			});
	}
	
	/**
	 * обновляем данные о расположении пользователя
	 *
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formLocationValidation(tplData)
	{
		let errors = {};
		let s_location = tplData["s_location"];
		let f_lat = tplData["f_lat"];
		let f_lng = tplData["f_lng"];
		
		if (!s_location.length || !f_lat || !f_lng)
			errors["s_location"] = "Укажите свой населенный пункт";

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('location').geoCoder(s_location)
						.then((locationData) =>
						{
							return this.getClass('location').create(locationData);
						})
						.then((location_id) =>
						{
							return this.getClass('user')
								.updLocation(this.getUserId(), f_lat, f_lng, location_id)
								.then(() =>
								{
									return Promise.resolve(tplData);
								});
						});
				}
			})
			.catch(Errors.ValidationError, (err) => {
				tplData.formError.message = err.message;
				tplData.formError.fields["s_location"] = "Уточните название, или просто кликните по карте";
				throw err;
			});
	}
	
	/**
	 * обновляем логин пользователя
	 * 
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formProfileLoginValidation(tplData)
	{
		let errors = {};
		let s_login = tplData["s_login"] || '';
		
		if (s_login.length < 5 || s_login.length > 20)
			errors["s_login"] = "логин указан неверно (от 5 до 20 символов)";
		
		if (s_login.search(/[a-zA-Z]{1,20}/ig) == -1)
			errors["s_login"] = "логин указан неверно (латинские буквы обязательны)";
		
		if (s_login.search(/^[a-zA-Z\-_0-9]{5,20}$/ig) == -1)
			errors["s_login"] = "логин указан неверно";
		
		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.model("user/profile")
						.updLogin(tplData["i_u_id"], tplData["s_login"])
						.then(() => {
							return Promise.resolve(tplData);
						});
				}
			})
			.catch(Errors.AlreadyInUseError, (err) => {

				tplData.formError.message = 'Ошибки при заполнении формы';
				tplData.formError.fields["s_login"] = 'Такой логин уже занят';

				throw err;
			});
	}
	/**
	 * обновляем пароль пользователя
	 * 
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formChangePasswordValidation(tplData)
	{
		let errors = {};
		tplData.s_password = (tplData.s_password || '').trim();
		tplData.s_password2 = (tplData.s_password2 || '').trim();

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
			if (self.parseFormErrors(tplData, errors))
			{
				return new Promise(function(resolve, reject)
				{
					self.model("user/auth").updPassword(self.getUser().u_id, tplData["s_password"], function(err)
					{
						tplData.s_password = tplData.s_password2 = '';

						if (err) return reject(err);

						tplData.formError.message = 'Пароль успешно изменен';

						return resolve(tplData);
					});
				});
			}
		});
	}
	
	/**
	 * валидация формы с основными данными пользователя
	 * @param tplData
	 * @returns {Promise}
	 */
	_formProfileBaseValidation(tplData)
	{
		let errors = {};
		
		if (!tplData["i_u_id"])
			errors["i_u_id"] = "неверно указан id пользователя";
		
		/*if (this.getReq()._reqbody["s_nick"] == null || this.getReq()._reqbody["s_nick"].trim() == '')
			errors["s_nick"] = "неверно указан ник";
		*/
		if (!tplData["s_name"])
			errors["s_name"] = "неверно указано имя";
		
		if (!tplData["s_surname"])
			errors["s_surname"] = "неверно указано фамилия";
		
		if (!tplData["bd_birthday"])
			errors["bd_birthday"] = "неверно указан день рождения";
		
		if (!tplData["i_sex"] || (tplData["i_sex"] != 0 && tplData["i_sex"] != 1))
			errors["i_sex"] = "неверно указан пол";

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					let bd = Moment(tplData["bd_birthday"], "DD-MM-YYYY").unix();
					return this.model("user/profile")
						.updBaseInfo(tplData["i_u_id"], tplData["s_name"], tplData["s_surname"], tplData["i_sex"], bd)
						.then(() => {
							tplData.formError.message = 'Данные успешно сохранены';
							return Promise.resolve(tplData);
						});
				}
			});
	}
	
	/**
	 * авторизация на сайте
	 *
	 * @param tplData
	 * @private
	 * @returns {Promise}
	 */
	_formChangeEmailValidation(tplData)
	{
		let errors = {};
		
		if(!tplData.m_mail)
		{
			errors["m_mail"] = 'e-mail указан неверно';
		}
		
		const self = this;
		
		return Promise.resolve(errors)
			.then(function(errors)
		{
			if (self.parseFormErrors(tplData, errors))
			{
				tplData.sendMail = false;

				if (tplData.m_mail == self.getUser().u_mail)
				{
					tplData.formError.message = 'Данные успешно сохранены';
					return Promise.resolve(tplData);
				}

				return new Promise(function(resolve, reject)
				{
					self.model("user/profile")
						.createReqChangeMailKey(self.getUser(), tplData.m_mail, (err, userData)=>
						{
							if(err)
								return reject(err);

							tplData.userData = userData;
							tplData.sendMail = true;
							return resolve(tplData);
						});
				});
			}
		})
		.then(function(tplData)
		{
			if (tplData.sendMail == false)
			return Promise.resolve(tplData);
			
			const Mailer = new Mail('gmail');
						
			let title = 'Смена Вашего e-mail адреса на сайте www.MotoCommunity.ru';
			let sendParams = {
				to:         tplData.m_mail,
				subject:    title,
				tplName:    'user/change_email',
				tplData: {
					title: title,
					links: 'https://'+self.getHostPort(),
					link: 'http://'+self.getHostPort(),
					key: tplData.userData.u_req_key
				}
			};
			
			return new Promise(function(resolve, reject)
			{
				Mailer.send(sendParams, function (err)
				{
					if(err)
					{
						tplData.mailError = true;
						let error = new Errors.AppMailError('Ошибка при отправке письма', err);
						Logger.error(error);
						
						return reject(error);
					}
					
					tplData.formError.message = 'Вам отрпавлено письмо';
					tplData.formError.text = 'В целях безопасности смены e-mail в пиьсме отправлены дополнительные инструкции.';
					
					return resolve(tplData);
				});
			});
		})
		.catch(Errors.AlreadyInUseError, function(err)
		{
			tplData.formError.message = 'Ошибки при заполнении формы';
			tplData.formError.fields["m_mail"] = 'Такой e-mail уже занят';
			
			throw err;
		});
	}
	
	/**
	 * загружаем новую аву
	 *
	 * @returns {Promise}
	 */
	avaActionPost()
	{
		let tplFile = 'user/profile/edit.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) => {
			if (file["u_id"] && file["a_id"] && file["ai_id"])
				return this.getClass('user/photo').delImage(file["u_id"], file["a_id"], file["ai_id"], file);
		});

		return this.getClass('user/photo/profile')
			.uploadProfile(this.getUserId(), this.getReq(), this.getRes())
			.then((file) => {
				tplData = {
					a_id: file.a_id,
					ai_id: file.ai_id,
					ai_text: file.ai_text,
					ai_pos: file.ai_pos,
					ai_name: file.ai_name,
					ai_latitude: file.latitude,
					ai_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};

				return this.getClass('user')
					.updateUserSessionData(tplData['u_id']||tplData['i_u_id']||0)
					.then(() => {
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch((err) => {
				Logger.error(err);

				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Profile;