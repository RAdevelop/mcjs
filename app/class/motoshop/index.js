/**
 * Created by ra on 25.10.16.
 */
"use strict";

const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class Motoshop extends Base
{
	/**
	 * добавляем новый мотосалон
	 *
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	add(mts_name, mts_website, mts_email, mts_descrip)
	{
		return this.model("motoshop").add(mts_name, mts_website, mts_email, mts_descrip);
	}
	
	/**
	 * данные мотосалона по его id
	 * 
	 * @param mts_id
	 * @returns {*}
	 */
	getMotoshop(mts_id)
	{
		return this.model("motoshop").getMotoshop(mts_id)
			.then(function (motoshop)
			{
				motoshop["address_list"] = [];
				return Promise.resolve(motoshop);
			});
	}

	/**
	 * редактируем мотосалон
	 *
	 * @param mts_id
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	edit(mts_id, mts_name, mts_website, mts_email, mts_descrip)
	{
		return this.model("motoshop").edit(mts_id, mts_name, mts_website, mts_email, mts_descrip);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;