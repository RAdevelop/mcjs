"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class UserGroups extends Base
{
	/**
	 * список групп
	 * @param ug_ids - массив id групп
	 * @returns {Promise}
	 */
	getAll(ug_ids = [])
	{
		return this.model('user/groups').getAll(ug_ids);
	}

	add(ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register)
	{
		return this.model('user/groups').add(ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register);
	}

	getById(ug_id)
	{
		return this.model('user/groups').getById(ug_id);
	}

	updById(ug_id, ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register)
	{
		return this.model('user/groups').updById(ug_id, ug_pid, ug_after_id, ug_path, ug_name, ug_desc, ug_on_register);
	}

	/**
	 * список прав (по сути - методов) для указанной группы
	 * @param ug_id - id группы
	 * @param m_id - id меню
	 * @param allMethods - true все методы (права), включая те, что не прияызаны; false - только привязанные
	 * @returns {*}
	 */
	getRights(ug_id, m_id, allMethods = false)
	{
		return this.model('user/groups').getRights(ug_id, m_id, allMethods);
	}

	/**
	 * сохраняем права группы пользователей для выбранного пункта меню
	 *
	 * @param ug_id - id группы
	 * @param m_id - id меню
	 * @param c_id  - id контроллера
	 * @param cm_ids - массив id методов
	 * @returns {Promise}
	 */
	saveRights(ug_id, m_id, c_id, cm_ids = [])
	{
		return this.model('user/groups').saveRights(ug_id, m_id, c_id, cm_ids);
	}

	/**
	 * проверка прав для указанного пользователя
	 *
	 * @param m_id - id меню
	 * @param ug_ids - id групп пользователя
	 * @returns {Promise}
	 */
	getUserRights(m_id, ug_ids)
	{
		return this.model('user/groups').getUserRights(m_id, ug_ids);
	}

	/**
	 * проверяем права доступа для пользователя в указанный пункт меню
	 *
	 * @param m_id
	 * @param ug_ids
	 * @returns {Promise}
	 */
	checkAccessToMenu(m_id, ug_ids)
	{
		return Promise.resolve(ug_ids)
			.then((ug_ids) =>
			{
				if (!ug_ids.length)
					return this.model('user/groups').getGroupRightsByPathAndMenu(m_id, 'guest');
				
				return this.getUserRights(m_id, ug_ids);
			});
	}

	/**
	 * добавляем пользователя в указанные группы
	 * @param u_id
	 * @param ug_ids
	 * @returns {Promise}
	 */
	addUserToGroups(u_id, ug_ids = [])
	{
		return this.model('user/groups').addUserToGroups(u_id, ug_ids);
	}

	/**
	 * список групп пользователей, которые назначаются при регистрации
	 * @returns {Promise}
	 */
	getGroupsOnRegister()
	{
		return this.model('user/groups').getGroupsOnRegister();
	}

	/**
	 * список групп, в которых состоит пользователь
	 *
	 * @param u_id
	 * @returns {Promise}
	 */
	getUsersGroups(u_id)
	{
		return this.model('user/groups').getUsersGroups(u_id)
			.then((g_list) => {

				let groups = {};

				g_list.forEach((g) => {
					groups[g.ug_path] = g;
				});

				return Promise.resolve(groups);
			});
	}

	isRootAdmin(u_id)
	{
		return this.getClass('user/groups').getUsersGroups(u_id)
			.then((userGroups)=>
			{
				//console.log('userGroups =', userGroups);

				return Promise.resolve((userGroups['root'] || userGroups['admin']));
			});
	}
	
	isRoot(u_id)
	{
		return this.getClass('user/groups').getUsersGroups(u_id)
			.then((userGroups)=>
			{
				//console.log('userGroups =', userGroups);

				return Promise.resolve((userGroups['root'] || false));
			});
	}

	isAdmin(u_id)
	{
		return this.getClass('user/groups').getUsersGroups(u_id)
			.then((userGroups)=>
			{
				//console.log('userGroups =', userGroups);

				return Promise.resolve((userGroups['admin'] || false));
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserGroups;