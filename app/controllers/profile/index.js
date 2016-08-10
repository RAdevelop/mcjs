"use strict";
/*комментарий*/
const Logger = require('app/lib/logger')();
const Moment = require('moment');
const Promise = require("bluebird");
const Errors = require('app/lib/errors');
const Mail = require('app/lib/mail');
const MultiGeocoder = require('multi-geocoder');
const FileUpload = require('app/lib/file/upload');

//const FileErrors = require('app/lib/file/errors');
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Profile extends Base 
{
	/**
	 * показываем страницу пользователя (свою, или выбранного)
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));
		
		const self = this;
		let tplFile = 'user/profile/index.ejs';
		let tplData = self.getUser();
		
		self.getClass("user").getUser(self.getUserId())
		.then(function(userData)
		{
			tplData = Object.assign(tplData, userData);

			self.view.setTplData(tplFile, tplData);
			self.view.addPartialData('user/left', {user: userData});

			return cb(null);
		})
		.catch(function(err)
		{
			return cb(err);
		});
	}
	
	/**
	 * обновляем данные пользователя (свою, или выбранного)
	 * @param cb
	 * @returns {*}
	 */
	/*indexActionPost(cb)
	{
		if (!this.isAuthorized())
			return cb(new Errors.HttpStatusError(401, "Unauthorized"));
		
		const self = this;
		let tplFile = 'user/index.ejs';
		let tplData = self.getUser();

		console.log('indexActionPost(cb)');

		this.getClass("user").getUserData(tplData)
			.bind(this)
			.then(function(tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}*/
	
	/**
	 * проифль пользователя. формы редактирования данных
	 * 
	 * @param cb
	 * @returns {*}
	 */
	editActionGet(cb)
	{
		if (!this.isAuthorized())
		return cb(new Errors.HttpStatusError(401, "Unauthorized"));

		let tplFile = 'user/profile/edit.ejs';
		let tplData = this.getUser();

		this.getClass("user").getUser(this.getUserId())
			.bind(this)
		.then(function(userData)
		{
			tplData = Object.assign(tplData, userData, FileUpload.createToken('user_ava', tplData) );

			this.view.setTplData(tplFile, tplData);
			this.view.addPartialData('user/left', {user: userData});

			//экспрот данных в JS на клиента
			this.getRes().expose(userData, 'userLocation');
			this.getRes().expose(FileUpload.getUploadConfig('user_ava'), 'avaUploadOpts');

			return cb(null);
		})
		.catch(function(err)
		{
			return cb(err);
		});		
	}
	
	/**
	 * обновляем данные пользователя в ЛК
	 * 
	 * @param cb
	 * @returns {*}
	 */
	editActionPost(cb)
	{
		let tplFile = 'user/profile/edit.ejs';
		let tplData = this.getParsedBody();

		this._formProfileValidation(tplData)
			.bind(this)
		.then(function(tplData) //если валидация успешна
		{
			//tplData.formError.error = false;
			this.view.setTplData(tplFile, tplData);
			return cb(null);
		})
		.catch(Errors.ValidationError, Errors.AlreadyInUseError, function(err)
		{
			//такие ошибки не уводят со страницы.
			tplData.formError.error = true;
			tplData.formError.errorName = err.name;

			this.view.setTplData(tplFile, tplData);

			//this.getRes().expose();
			return cb(null);
		})
		.catch(function(err)
		{
			return cb(err);
		});
	}
	
	/**
	 * обработка запросов по изменению данных (например, смена емейла...)
	 * @param cb
	 * @returns {*}
	 */
	changeActionGet(cb)
	{
		//let self = this;
		
		let tplData = this.getReqBody();
		
		this._changeConfirm(tplData).bind(this)
		.then(function(tplData)
		{
			this.view.setTplData('user/profile/change_mail_confirm.ejs', tplData);
			return cb(null);
		})
		.catch(function(err)
		{
			return cb(err);
		});
	}
	
	_changeConfirm(tplData)
	{
		let changeType = this.getArgs().shift().toLowerCase();
		switch (changeType)
		{
			default:
				return Promise.reject(new Errors.HttpStatusError(404, "Not Found"));
				break;
			
			case 'mail':

				return this._changeMailConfirm(tplData);
				break;
		}
	}
	
	_changeMailConfirm(tplData)
	{
		let key = this.getArgs().shift();
		
		const self = this;
		
		return Promise.resolve(key)
		.then(function(key)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user/profile").confirmReqChangeMail(self.getUser().u_id, key, function(err, confirmed)
				{
					if (err) return reject(err);
					
					tplData.confirmed = confirmed;
					
					return resolve(tplData);
				});
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
		if (!this.isAuthorized())
			return Promise.reject(new Errors.HttpStatusError(401, "Unauthorized"));
		
		if (!this.isTheSameUser(tplData.i_u_id))
			return Promise.reject(new Errors.HttpStatusError(403, "Forbidden"));

		if (!tplData["btn_save_profile"])
			return Promise.reject(new Errors.HttpStatusError(400, "Bad request"));

		console.log(tplData);

		switch(tplData["btn_save_profile"])
		{
			default:
				tplData.formError.error = true;
				tplData.formError.message = 'Невереные данные';

				return Promise.reject(new Errors.HttpStatusError(400, tplData.formError.message));
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
		let errors = {};
		let ai_id = tplData["i_file_id"];
		let crop_x = parseInt((tplData["i_crop_x"] > 0 ? tplData["i_crop_x"] : 0), 10);
		let crop_y = parseInt((tplData["i_crop_y"] > 0 ? tplData["i_crop_y"] : 0), 10);

		let crop_width = parseInt(tplData["i_crop_width"], 10) || 50;
			crop_width = ((crop_width + crop_x) < 1024 ? crop_width : (1024 - crop_x));
			crop_width = (crop_width > 50 ? crop_width : 50);

		let crop_height = parseInt(tplData["i_crop_height"], 10) || 50;
			crop_height = ((crop_height + crop_y) < 768 ? crop_height : (768 - crop_y));
			crop_height = (crop_height > 50 ? crop_height : 50);

		if (!ai_id)
			errors["i_file_id"] = "Фотография не выбрана";

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				let errKeys = Object.keys(errors);

				if (errKeys.length)
				{
					errKeys.forEach(function(f)
					{
						tplData.formError.fields[f] = errors[f];
					});

					tplData.formError.message = 'Ошибка при кадрировании фотографии';
					return Promise.reject(new Errors.ValidationError(tplData.formError.message));
				}

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('user/profile').getUserAva(this.getUserId())
					.then(function (ava)
					{
						console.log(ava);
						ava["cropSrc"] = ava["previews"]["1024_768"];
						ava["dir"] = ava["ai_dir"];

						return FileUpload.cropImage(ava, 'user_ava', crop_x, crop_y, crop_width, crop_height)
							.then(function (ava)
							{
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
		
		const self = this;
		
		return Promise.resolve(errors)
			.then(function(errors)
			{
				let errKeys = Object.keys(errors);
				
				if (errKeys.length)
				{
					errKeys.forEach(function(f)
					{
						tplData.formError.fields[f] = errors[f];
					});

					tplData.formError.message = 'Ошибки при заполнении формы';
					return Promise.reject(new Errors.ValidationError(tplData.formError.message));
				}
				
				return Promise.resolve(tplData);
			})
			.then(function(tplData)
			{
				return new Promise(function(resolve, reject)
				{
					s_location = s_location.split(',').map(function(str){ return str.trim();}).join(',');
					let locationNames = s_location.split(',');
					let size = locationNames.length;
					let locationArr = [];
					
					for(let i = size; i > 0; i--)
					{
						locationArr.push( s_location.split(',', i).join(','));
					}
					locationArr = locationArr.reverse();
					
					//return resolve(tplData);
					
					let geocoder = new MultiGeocoder({ provider: 'yandex', coordorder: 'latlong', lang: 'ru-RU' });
					
					geocoder.geocode(locationArr,{lang: 'ru-RU'})
						.then(function (res)
						{
							//console.log(res["errors"]);
							
							if (res["errors"] == locationArr.length)
							{
								tplData.formError.message = 'Не удалось определить указанный населенный пункт';
								tplData.formError.error = true;
								tplData.formError.fields["s_location"] = "Уточните название, или просто кликните по карте";
								return reject(tplData);
							}
							
							let features = res["result"]["features"];
							let userLocationData = [];
							for(let i in features)
							{
								let GeocoderMetaData = features[i]["properties"]["metaDataProperty"]["GeocoderMetaData"];
								userLocationData.push({
									"coords": features[i]["geometry"]["coordinates"],
									"lat": features[i]["geometry"]["coordinates"][0],
									"lng": features[i]["geometry"]["coordinates"][1],
									"kind": GeocoderMetaData["kind"],
									"text": GeocoderMetaData["text"],
									"name": locationNames[i]
								});
								/*console.log('i ='+ i);
								
								console.log( features[i]["geometry"]["coordinates"]);
								console.log('data %j', features[i]["properties"]["metaDataProperty"]["GeocoderMetaData"]);*/
							}
							self.model("user/profile").updLocation(tplData["i_u_id"], f_lat, f_lng, userLocationData, function(err)
							{
								if (err) return reject(err);
								
								return resolve(tplData);
							});
						});
				});
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
		
		const self = this;
		
		return Promise.resolve(errors)
		.then(function(errors)
		{
			let errKeys = Object.keys(errors);
			
			if (errKeys.length)
			{
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});
				tplData.formError.message = 'Ошибки при заполнении формы';
				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			return new Promise(function(resolve, reject)
			{
				self.model("user/profile").updLogin(tplData["i_u_id"], tplData["s_login"], function(err)
				{
					if (err) return reject(err);
					
					tplData.formError.message = 'Логин успешно изменен';
					
					return resolve(tplData);
				});
			});
		}).catch(Errors.AlreadyInUseError, function(err)
		{
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
			let errKeys = Object.keys(errors);
			
			if (errKeys.length)
			{
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});

				tplData.formError.message = 'Ошибки при заполнении формы';

				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
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
		
		let errKeys = Object.keys(errors);
		
		const self = this;
		
		return Promise.resolve(errKeys)
		.then(function(errKeys)
		{
			if (errKeys.length)
			{
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});

				tplData.formError.message = 'Ошибки при заполнении формы';

				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
			return Promise.resolve(tplData);
			
		}).then(function(tplData)
		{
			let bd = Moment(tplData["bd_birthday"], "DD-MM-YYYY").unix();
			
			return new Promise(function(resolve, reject)
			{
				self.model("user/profile").updBaseInfo(tplData["i_u_id"], tplData["s_name"], tplData["s_surname"], tplData["i_sex"], bd, function(err)
				{
					if (err) return reject(err);
					
					tplData.formError.message = 'Данные успешно сохранены';
					return resolve(tplData);
				});
			});
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
		
		return Promise.resolve(errors).then(function(errors)
		{
			let errKeys = Object.keys(errors);
			
			if (errKeys.length)
			{
				tplData.s_password = '';
				
				errKeys.forEach(function(f)
				{
					tplData.formError.fields[f] = errors[f];
				});
				tplData.formError.message = 'Ошибки при заполнении формы';

				return Promise.reject(new Errors.ValidationError(tplData.formError.message));
			}
			
			return Promise.resolve(tplData);
		})
		.then(function(tplData)
		{
			tplData.sendMail = false;
			
			if (tplData.m_mail == self.getUser().u_mail)
			{
				tplData.formError.message = 'Данные успешно сохранены';
				return Promise.resolve(tplData);
			}
			
			return new Promise(function(resolve, reject)
			{
				self.model("user/profile").createReqChangeMailKey(self.getUser(), tplData.m_mail, function(err, userData)
				{
					if(err) return reject(err);
					
					tplData.userData = userData;
					tplData.sendMail = true;
					return resolve(tplData);
				});
			});
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
					links: 'https://'+self.getHostPort(),//'https://www.MotoCommunity.ru',
					link: 'http://'+self.getHostPort(),//'http://www.MotoCommunity.ru', //TODO
					key: tplData.userData.u_req_key
				}
			};
			
			return new Promise(function(resolve, reject)
			{
				Mailer.send(sendParams, function (err)
				{
					//то, что письмо не отправилось, не повод "запрещать" пользователю быть авторизованным при регистрации
					if(err)
					{
						tplData.mailError = true;
						let error = new Errors.AppMailError('Ошибка при отправке письма', err);
						Logger.error('%s, %s, %j',  error.message, error.status, error.stack);
						
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
	 * @param cb
	 * @returns {*}
	 */
	avaActionPost(cb)
	{
		let self = this;
		let tplFile = 'user/profile/edit.ejs';
		let tplData = self.getParsedBody();

		self.getClass('user/photo')
			.uploadProfile(this.getUserId(), this.getReq(), this.getRes())
			.then(function (file)
			{
				//console.log(file);
				tplData = {
					a_id: file.a_id,
					ai_id: file.ai_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(function (err)
			{
				console.log(err);

				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Profile;