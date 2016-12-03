"use strict";

//const Errors = require('app/lib/errors');
//const Promise = require("bluebird");
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
	 * @param c_id
	 * @returns {Promise}
	 */
	getControllerMethods(c_id)
	{
		return this.model('controller').getControllerMethods(c_id);
	}

	updById(c_id, c_pid, c_after_id, c_path, c_name, c_desc)
	{
		return this.model('controller').updById(c_id, c_pid, c_after_id, c_path, c_name, c_desc);
	}

	add(c_pid, c_after_id, c_path, c_name, c_desc)
	{
		return this.model('controller').add(c_pid, c_after_id, c_path, c_name, c_desc);
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

	/**
	 * редактируем метод
	 *
	 * @param cm_id
	 * @param cm_method
	 */
	updateMethod(cm_id, cm_method)
	{
		return this.model('controller').updateMethod(cm_id, cm_method);
	}

	/**
	 * удаляем метод
	 *
	 * @param cm_id
	 * @param c_id
	 */
	deleteMethod(cm_id, c_id)
	{
		return this.model('controller').deleteMethod(cm_id, c_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Controller;