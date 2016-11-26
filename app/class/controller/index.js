"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class Controller extends Base
{
	getAll()
	{
		return this.model('controller').getAll();
	}

	getById(c_id)
	{
		return this.model('controller').getById(c_id);
	}
	
	/**
	 * получаем список пользовательских методов, достыпных для контроллера
	 *
	 * @param сId
	 * @returns {Promise.<TResult>}
	 */
	getAllMethods(c_id)
	{
		return this.model('controller').getAllMethods(c_id);
	}

	updById(c_id, c_pid, c_after_id, c_path, c_name, c_desc)
	{
		return this.model('controller').updById(c_id, c_pid, c_after_id, c_path, c_name, c_desc);
	}

	/**
	 * добавляем метод в общий список, и привязываем его к указанному контроллеру
	 *
	 * @param c_id
	 * @param cm_method
	 */
	addMethod(c_id, cm_method)
	{
		return this.model('controller').addMethod(c_id, cm_method);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Controller;