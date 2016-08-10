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
		const self = this;
		
		return new Promise(function(resolve, reject)
		{
			self.model("user").getUserData(u_id, function(err, uData)
			{
				if (err) return reject(err);
				
				return resolve(uData);
			});
		});
	}
	
	/**
	 * данные о населенном пунккте пользователя
	 *
	 * @param u_id
	 * @returns {bluebird|exports|module.exports}
	 */
	getUserLocation(u_id)
	{
		const self = this;

		return new Promise(function(resolve, reject)
		{
			self.model("user").getUserLocation(u_id, function(err, uData)
			{
				if (err) return reject(err);
				
				return resolve(uData);
			});
		});
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
			userAva: this.getClass('user/profile').getUserAva(u_id)
		})
			.then(function(props)
			{
				return Promise.resolve(Object.assign(props.user, props.userData, props.userLocation, props.userAva));
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
