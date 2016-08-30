"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const FileUpload = require('app/lib/file/upload');
//const Path = require('path');

const Base = require('app/lib/class');

class Mototrek extends Base
{
	/**
	 * добавляем новый трек
	 *
	 * @param s_mtt_name
	 * @param t_mtt_descrip
	 * @param s_mtt_website
	 * @param m_mtt_email
	 * @param s_mtt_phones
	 * @param s_mtt_address
	 * @param f_mtt_lat
	 * @param f_mtt_lng
	 * @param location_id
	 * @returns {*}
	 */
	add(s_mtt_name, t_mtt_descrip = '', s_mtt_website = '', m_mtt_email = '', s_mtt_phones = '', s_mtt_address, f_mtt_lat, f_mtt_lng, location_id)
	{
		return this.model('mototrek').add(s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id);
	}

	/**
	 * редактируем трек
	 *
	 * @param i_mtt_id
	 * @param s_mtt_name
	 * @param t_mtt_descrip
	 * @param s_mtt_website
	 * @param m_mtt_email
	 * @param s_mtt_phones
	 * @param s_mtt_address
	 * @param f_mtt_lat
	 * @param f_mtt_lng
	 * @param location_id
	 * @returns {*}
	 */
	edit(i_mtt_id, s_mtt_name, t_mtt_descrip = '', s_mtt_website = '', m_mtt_email = '', s_mtt_phones = '', s_mtt_address, f_mtt_lat, f_mtt_lng, location_id)
	{
		return this.model('mototrek').edit(i_mtt_id, s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id);
	}

	/**
	 * данные трека по его id
	 *
	 * @param mtt_id
	 * @returns {*}
	 */
	get(mtt_id)
	{
		return this.model('mototrek').getById(mtt_id)
			.then(function (trek)
			{
				if (!trek)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(trek);
			});
	}

	/**
	 * список всех треков
	 *
	 * @returns {Promise.<TResult>|*}
	 */
	getAll()
	{
		return this.model('mototrek').getAll();
	}

	/**
	 * список локаций, к которым привязан трек (включая родительские районы, города, страны..)
	 *
	 * @returns {*}
	 */
	getLocations()
	{
		return this.model('mototrek').getLocations();
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototrek;