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
			user:           this.getById(u_id),
			userData:       this.getUserData(u_id),
			userLocation:   this.getUserLocation(u_id),
			userAva:        this.getClass('user/photo/profile').getUserAva(u_id)
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
		return this.model('user').countUsers()
			.bind(this)
			.then(function (users_cnt)
			{
				Pages.setTotal(users_cnt);

				let usersData = {"users":null, "users_cnt":users_cnt, "Pages":Pages};

				if (!users_cnt)
					return Promise.resolve(usersData);

				if (Pages.limitExceeded())
					return Promise.reject(new Errors.HttpStatusError(404, "Not found"));

				return this.model('user').getUsers(Pages.getOffset(), Pages.getLimit())
					.bind(this)
					.spread(function (users, users_ids)//собираем аватарки
					{

						return this.getClass('user/photo/profile').getUsersAva(users_ids)
							.then(function (usersAva)
							{
								users.forEach(function (user)
								{
									Object.assign(user, usersAva[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread(function (users, users_ids)//собираем данные о населенных пунктах юзеров
					{
						return this.getClass('user').getUsersLocation(users_ids)
							.then(function (usersLocation)
							{
								users.forEach(function (user)
								{
									Object.assign(user, usersLocation[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread(function (users, users_ids)
					{
						/*console.log('\nusers_ids');
						console.log(users);
						console.log('=======\n');*/

						usersData.users = users;

						return Promise.resolve(usersData);
					});
			});
	}

	/**
	 * получаем данные по населенному пункту указанных юзеров
	 *
	 * @param user_ids
	 * @returns {usersLocation = {u_id:{ocationData}}}
	 */
	getUsersLocation(user_ids = [])
	{
		return this.model('user').getUsersLocation(user_ids);
	}

	updLocation(u_id, f_lat, f_lng, location_id)
	{
		return this.model('user/profile').updLocation(u_id, f_lat, f_lng, location_id);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
