"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

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
		return new Promise((resolve, reject) => {

			this.model("user").getById(u_id, (err, uData) => {

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
			userAva:        this.getClass('user/photo/profile').getUserAva(u_id)
			//,userGroups:     this.getClass('user/groups').getUsersGroups(u_id)
		})
			.then((props) =>
			{
				let user = Object.assign({}, props.userAva, props.userLocation, props.userData, props.user);
					user['u_display_name'] = User.userDisplayName(user);

				//TODO данные о группах пользователья нельзя сохранять в сессию
				//так как, если удалить пользователя из группы, то он все равно может в ней остаться по данным сессии
				//то есть, пока сессия не удалится...

				//user['u_groups'] = props.userGroups;
				//user['u_is_root'] = (user['u_groups']['root'] ? true : false);
				//user['u_is_admin'] = (user['u_groups']['admin']||user['u_is_root'] ? true : false);

				//console.log(user);

				return Promise.resolve(user);
			});
	}

	/**
	 * обновляем данные сессии текущего пользователя
	 * @param u_id
	 * @returns {Promise}
	 */
	updateUserSessionData(u_id)
	{
		if (!u_id || !this.session.user || !this.session.user.u_id || this.session.user.u_id != u_id)
			return Promise.resolve();

		return this.getUser(u_id)
			.then((user) => {
				if (!user)
					return Promise.resolve();

				this.session.user = user;
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
			.then((users_cnt) =>
			{
				Pages.setTotal(users_cnt);

				let usersData = {"users":null, "users_cnt":users_cnt, "Pages":Pages};

				if (!users_cnt)
					return Promise.resolve(usersData);

				if (Pages.limitExceeded())
					return Promise.reject(new Errors.HttpError(404));

				return this.model('user').getUsers(Pages.getOffset(), Pages.getLimit())
					.spread((users, users_ids) => {//собираем аватарки

						return this.getClass('user/photo/profile').getUsersAva(users_ids)
							.then((usersAva) =>
							{
								users.forEach((user, uI, users) =>
								{
									user['u_display_name'] = User.userDisplayName(user);
									users[uI] = Object.assign({}, user, usersAva[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread((users, users_ids) => {//собираем данные о населенных пунктах юзеров

						return this.getClass('user').getUsersLocation(users_ids)
							.then((usersLocation) =>
							{
								users.forEach((user, uI, users) =>
								{
									users[uI] = Object.assign({}, user, usersLocation[user["u_id"]]);
								});

								return [users, users_ids];
							});
					})
					.spread((users) =>
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

	/**
	 * получаем список пользователей по указанным id
	 * @param u_ids
	 * @param list - некий массив данных, к которому надо будет добавить данные пользователей по их u_id
	 * @returns {Promise}
	 */
	getUserListById(u_ids = [], list = [])
	{
		if (u_ids.length == 0)
			return Promise.resolve([]);

		return Promise.props({
			users: this.model('user').getUserListById(u_ids),
			usersAva: this.getClass('user/photo/profile').getUsersAva(u_ids),
			usersLocation: this.getClass('user').getUsersLocation(u_ids)
		})
			.then((props)=>
			{
				let users = props.users.map((user)=>
				{
					if (props.usersAva.hasOwnProperty(user['u_id']))
						Object.assign(user, props.usersAva[user['u_id']]);

					if (props.usersLocation.hasOwnProperty(user['u_id']))
						Object.assign(user, props.usersLocation[user['u_id']]);

					user['u_display_name'] = User.userDisplayName(user);
					
					return user;
				});

				if (list.length > 0)
				{
					users.forEach((user)=>
					{
						list.forEach((item, i)=>
						{
							if (item.hasOwnProperty('u_id') && item['u_id'] == user['u_id'])
							{
								list[i]['user'] = user;
							}
						});
					});
				}
				props = null;

				return Promise.resolve([users, list]);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
