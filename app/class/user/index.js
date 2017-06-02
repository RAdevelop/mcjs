"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

const Base = require('app/lib/class');

class User extends Base
{
	static get uploadAvaConfigName()
	{
		return `user_ava`;
	}
	static get uploadPhotoConfigName()
	{
		return `user_photo`;
	}
	
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
		return this.model('user').getUserData(u_id);
	}
	
	/**
	 * данные о населенном пунккте пользователя
	 *
	 * @param u_id
	 * @returns {bluebird|exports|module.exports}
	 */
	getUserLocation(u_id)
	{
		return this.model('user').getUserLocation(u_id);
	}

	getById(u_id, check_state = false)
	{
		return this.model('user').getById(u_id)
			.then((user)=>
			{
				if (check_state && user['u_state'] != this.model('user').constructor.USER_STATE_REG)
					//throw new Errors.NotFoundError();
					throw new Errors.HttpError(404);
				
				return Promise.resolve(user);
			});
		
		/*return new Promise((resolve, reject) =>
		{
			this.model('user').getById(u_id, (err, uData) =>
			{
				//console.log('err = ', err);
				//console.log('userData = ', uData);
				if (err && err.name != 'NotFoundError')
					return reject(err);
				
				return resolve(uData);
			});
		});*/
	}

	/**
	 * данные пользователя
	 *
	 * @param u_id
	 * @param check_state
	 * @returns {Promise}
	 */
	getUser(u_id, check_state = false)
	{
		return this.getById(u_id, check_state)
		.then((user)=>
		{
			if (!user['u_id'])
				return Promise.resolve(user);
			
			return Promise.props({
				userData:       this.getUserData(u_id),
				userLocation:   this.getUserLocation(u_id),
				userAva:        this.getClass('user/photo/profile').getUserAva(u_id)
				//,userGroups:     this.getClass('user/groups').getUsersGroups(u_id)
			})
			.then((props) =>
			{
				user = Object.assign({}, props.userAva, props.userLocation, props.userData, user);
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
			.then((user) =>
			{
				if (!user)
					return Promise.resolve();

				this.session.user = user;
				return Promise.resolve(user);
			});
	}

	/**
	 * подсчет кол-ва всех пользователей
	 * @param loc_ids - массив с id locations
	 * @param s_name
	 * @param b_check_state
	 */
	countUsers(loc_ids = [], s_name = '', b_check_state = true)
	{
		return this.model('user').countUsers(loc_ids, s_name, b_check_state);
	}

	/**
	 * список пользователей
	 *
	 * @param Pages
	 * @param loc_ids - массив с id locations
	 * @param s_name
	 * @param b_check_state
	 * @returns {Promise} [users, users_cnt, Pages]
	 */
	getUsers(Pages, loc_ids = [], s_name = '', b_check_state = true)
	{
		return this.countUsers(loc_ids, s_name, b_check_state)
			.then((users_cnt) =>
			{
				Pages.setTotal(users_cnt);
				
				let usersData = {'users':null, 'users_cnt':users_cnt, 'Pages':Pages};
				
				if (!!users_cnt === false)
					return Promise.resolve(usersData);
				
				if (Pages.limitExceeded())
					throw (new Errors.HttpError(404));
				
				return this.model('user').getUsers(Pages.getOffset(), Pages.getLimit(), loc_ids, s_name, b_check_state)
					.spread((users, users_ids) =>
					{
						return Promise.all([
							this.getClass('user/photo/profile').getUsersAva(users_ids),
							this.getClass('user').getUsersLocation(users_ids)
						])
							.spread((usersAva, usersLocation)=>
							{
								users.forEach((user, uI, users) =>
								{
									users[uI]['u_display_name'] = User.userDisplayName(user);
									users[uI] = Object.assign({}, users[uI],
										usersAva[user['u_id']],
										usersLocation[user['u_id']]
									);
								});
								
								usersData.users = users;
								users_ids = null;
								return Promise.resolve(usersData);
							});
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
		
		return Promise.join(
			this.model('user').getUserListById(u_ids),
			this.getClass('user/photo/profile').getUsersAva(u_ids),
			this.getClass('user').getUsersLocation(u_ids)
			, (users, usersAva, usersLocation) =>
			{
				users.forEach((user)=>
				{
					if (usersAva.hasOwnProperty(user['u_id']))
						Object.assign(user, usersAva[user['u_id']]);
					
					if (usersLocation.hasOwnProperty(user['u_id']))
						Object.assign(user, usersLocation[user['u_id']]);
					
					user['u_display_name'] = User.userDisplayName(user);
					
					return user;
				});

				if (list.length > 0)
				{
					list.forEach((item, i)=>
					{
						users.forEach((user)=>
						{
							if (item.hasOwnProperty('u_id') && item['u_id'] == user['u_id'])
							{
								list[i]['user'] = user;
							}
						});
					});
				}

				return Promise.resolve([users, list]);
			});
	}

	/**
	 * список стран, к которым привязаны юзеры
	 * @params l_id
	 * @returns {*}
	 */
	getUsersCountryList(l_id = 0)
	{
		return this.model('user').getUsersCountryList()
			.then((list)=>
			{
				let selected = {};

				if (!list)
					return Promise.resolve({list: [], selected: selected});

				list.some((item)=>
				{
					if (item['l_id'] == l_id)
					{
						selected = item;
						return true;
					}
				});

				return Promise.resolve({list: list, selected: selected});
			});
	}

	getUsersCityList(ui_country_id, ui_city_id = 0)
	{
		return this.model('user').getUsersCityList(ui_country_id)
			.then((list)=>
			{
				let selected = {};

				if (!list)
					return Promise.resolve({list: [], selected: selected});

				list.some((item)=>
				{
					if (item['l_id'] == ui_city_id)
					{
						selected = item;
						return true;
					}
				});
				
				return Promise.resolve({list: list, selected: selected});
			});
	}
	
	getUserStateList()
	{
		return this.model('user').constructor.getUserStateList();
	}
	
	updUserState(u_id, u_state)
	{
		return this.model('user').updUserState(u_id, u_state);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = User;
