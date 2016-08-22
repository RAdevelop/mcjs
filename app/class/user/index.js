"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/class');

class User extends Base
{
	/**
	 * данные пользователя (имя, фамилия, пол, ДР...)
	 *
	 * @param u_id
	 * @returns {bluebird|exports|module.exports}
	 */
	getUserData(u_id)
	{
		return this.model("user").getUserData(u_id);
	}
	
	/**
	 * данные о населенном пунккте пользователя
	 *
	 * @param u_id
	 * @returns {bluebird|exports|module.exports}
	 */
	getUserLocation(u_id)
	{
		return this.model("user").getUserLocation(u_id);
	}

	getById(u_id)
	{
		const self = this;

		return new Promise(function(resolve, reject)
		{
			self.model("user").getById(u_id, function(err, uData)
			{
				if (err && err.name != 'NotFoundError')
					return reject(err);

				return resolve(uData);
			});
		});
	}

	/**
	 * данные пользователя
	 *
	 * @param u_id
	 * @returns {Promise.<TResult>|*}
	 */
	getUser(u_id)
	{
		return Promise.props({
			user: this.getById(u_id),
			userData: this.getUserData(u_id),
			userLocation: this.getUserLocation(u_id),
			userAva: this.getClass('user/photo/profile').getUserAva(u_id)
		})
			.then(function(props)
			{
				/*console.log('props');
				console.log(props);
				console.log('props\n');*/
				return Promise.resolve(Object.assign(props.userAva, props.userLocation, props.userData, props.user));
			});
	}

	/**
	 * подсчет кол-ва всех пользователей
	 */
	countUsers()
	{
		return this.model('user').countUsers();
	}

	/**
	 * список пользователей
	 *
	 * @param Pages
	 * @returns {Promise.<TResult>|*} [users, users_cnt, Pages]
	 */
	getUsers(Pages)
	{
		return this.model('user/photo').countUsers()
			.bind(this)
			.then(function (users_cnt)
			{
				Pages.setTotal(users_cnt);

				if (!users_cnt)
					return Promise.resolve({"users":null, "users_cnt":users_cnt, "Pages":Pages});//[null, users_cnt, Pages];

				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpStatusError(404, "Not found"));

				return this.model('user/photo').getUsers(Pages.getOffset(), Pages.getLimit())
					.then(function (users)
					{
						/*let sizeParams = FileUpload.getUploadConfig('user_ava').sizeParams;

						users.forEach(function (user)
						{
							users = Object.assign(users, UserPhoto.previews(sizeParams, users)["obj"]);
						});*/
						return Promise.resolve({"users":users, "users_cnt":users_cnt, "Pages":Pages});
					});
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
