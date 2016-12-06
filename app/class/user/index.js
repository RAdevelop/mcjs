"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/class');

class User extends Base
{
	static userDisplayName(user)
	{
		return (user["u_login"] ? user["u_login"] : (user["u_name"] || user["u_surname"] ? [user["u_name"]||'', user["u_surname"]||''].join(' ') : ''))
	}

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
	 * @returns {Promise}
	 */
	getUser(u_id)
	{
		return Promise.props({
			user:           this.getById(u_id),
			userData:       this.getUserData(u_id),
			userLocation:   this.getUserLocation(u_id),
			userAva:        this.getClass('user/photo/profile').getUserAva(u_id),
			userGroups:     this.getClass('user/groups').getUsersGroups(u_id)
		})
			.then(function(props)
			{
				let user = Object.assign({}, props.userAva, props.userLocation, props.userData, props.user);
					user['u_display_name'] = User.userDisplayName(user);

				//TODO данные о группах пользователья нельзя сохранять в сессию
				//так как, если удалить пользователя из группы, то он все равно может в ней остаться по данным сессии
				//то есть, пока сессия не удалится...
				/*
				 TODO а так же надо обновлять данные сесси по пользователю, если он редактирует свои данные.
				так как при текущих улосвиях данные в сессии не обновляются...
				возможно сотот проверить в контроллере вызов
				this.
				 */

					user['u_groups'] = props.userGroups;
					user['u_is_root'] = (user['u_groups']['root'] ? true : false);
					user['u_is_admin'] = (user['u_groups']['admin']||user['u_is_root'] ? true : false);

				//console.log(user);

				return Promise.resolve(user);
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
	 * @returns {Promise} [users, users_cnt, Pages]
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
					return Promise.reject(new Errors.HttpError(404));

				return this.model('user').getUsers(Pages.getOffset(), Pages.getLimit())
					.bind(this)
					.spread(function (users, users_ids)//собираем аватарки
					{
						return this.getClass('user/photo/profile').getUsersAva(users_ids)
							.then(function (usersAva)
							{
								users.forEach(function (user, uI, users)
								{
									user['u_display_name'] = User.userDisplayName(user);
									users[uI] = Object.assign({}, user, usersAva[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread(function (users, users_ids)//собираем данные о населенных пунктах юзеров
					{
						return this.getClass('user').getUsersLocation(users_ids)
							.then(function (usersLocation)
							{
								users.forEach(function (user, uI, users)
								{
									users[uI] = Object.assign({}, user, usersLocation[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread(function (users)
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
