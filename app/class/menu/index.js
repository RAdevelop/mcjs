"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class Menu extends Base
{
	getAll()
	{
		const self = this;
		return new Promise(function (resolve, reject)
		{
			self.model('menu').getAll(function(err, menuList)
			{
				if (err)
					return reject(err);

				return resolve(menuList);
			});
		});
	}

	/**
	 * данные меню по id
	 * @param m_id
	 * @returns {*}
	 */
	getById(m_id)
	{
		return this.model('menu').getById(m_id);
	}

	/**
	 * обноваляем данные пункта меню
	 *
	 * @param menuId
	 * @param menuPid
	 * @param menuAfterId
	 * @param menuPath
	 * @param menuName
	 * @param menuTitle
	 * @param menuH1
	 * @param menuDesc
	 * @param menuControllerId
	 */
	updById(menuId, menuPid, menuAfterId, menuPath, menuName, menuTitle, menuH1, menuDesc, menuControllerId)
	{
		return this.model('menu').updById(menuId, menuPid, menuAfterId, menuPath, menuName, menuTitle, menuH1, menuDesc, menuControllerId);
	}

}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Menu;