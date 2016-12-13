"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class Menu extends Base
{
	getAll(m_type = null, all = true)
	{
		return new Promise((resolve, reject) => {
			this.model('menu').getAll(m_type, all, (err, menuList) => {
				if (err)
					return reject(err);

				return resolve(menuList);
			});
		});
	}

	/**
	 * данные меню по id
	 * @param m_id
	 * @returns {Promise}
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

	/**
	 * добавляем в БД пункт меню
	 * 
	 * @param mPid
	 * @param mAfterId
	 * @param mPath
	 * @param mName
	 * @param mTitle
	 * @param mH1
	 * @param mDesc
	 * @param mCId
	 * @throws
	 *  DbError
	 *
	 */
	add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId)
	{
		return this.model('menu').add(mPid, mAfterId, mPath, mName, mTitle, mH1, mDesc, mCId);
	}

}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Menu;