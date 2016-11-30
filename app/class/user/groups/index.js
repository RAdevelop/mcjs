"use strict";

//const Errors = require('app/lib/errors');
//const Promise = require("bluebird");
const Base = require('app/lib/class');

class UserGroups extends Base
{
	getAll()
	{
		return this.model('user/groups').getAll();
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

}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserGroups;