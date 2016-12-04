"use strict";

const Errors = require('app/lib/errors');
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
	 * список прав для указанного пользователя
	 * @param u_id - id пользователя
	 * @param m_id - id меню
	 * @returns {Promise}
	 */
	getUserRights(u_id, m_id)
	{
		return this.model('user/groups').getUserRights(u_id, m_id);
	}

	/**
	 * проверяем права доступа для пользователя в указанный пункт меню
	 *
	 * @param u_id
	 * @param m_id
	 * @param c_method - метод (пример: get_index, post_edit...)
	 * @returns {Promise}
	 */
	checkAccessToMenu(u_id, m_id, c_method)
	{
		return Promise.resolve(u_id)
			.bind(this)
			.then(function (u_id)
			{
				if (!u_id)
					return this.model('user/groups').getGroupRightsByPathAndMenu('guest', m_id);

				//иначе получить список групп пользователя...
				return this.getUserRights(u_id, m_id);
			})
			.then(function (rights)
			{
				if (!rights || !rights['info']['numRows'])
					throw new Errors.NotFoundError();

				let b_allowed = false;
				rights.forEach(function (item)
				{
					//if (item['m_id'] == m_id && item['cm_method'] == c_method)
					if (item['cm_method'] == c_method)
						b_allowed = true;
				});

				if (!b_allowed)
					throw new Errors.NotFoundError();

				return Promise.resolve();
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
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserGroups;