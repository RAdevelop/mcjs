"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const FileUpload = require('app/lib/file/upload');
//const Path = require('path');

const Base = require('app/lib/class');

class Events extends Base
{
	/**
	 * добавляем новое событие
	 *
	 * @param i_u_id
	 * @param s_e_title
	 * @param t_e_notice
	 * @param t_e_text
	 * @param s_e_address
	 * @param f_e_lat
	 * @param f_e_lng
	 * @param i_location_id
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {*}
	 */
	add(i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);

		return this.model('events').add(i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
	}

	/**
	 * редактируем событие
	 *
	 * @param i_e_id
	 * @param i_u_id
	 * @param s_e_title
	 * @param t_e_notice
	 * @param t_e_text
	 * @param s_e_address
	 * @param f_e_lat
	 * @param f_e_lng
	 * @param i_location_id
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {Promise.<TResult>}
	 */
	edit(i_e_id, i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, dd_start_ts, dd_end_ts)
	{
		let {gps_lat, gps_lng} = this.getClass('location').coordConvert(f_e_lat, f_e_lng);

		return this.model('events').edit(i_e_id, i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts);
	}

	/**
	 * данные события по его id
	 *
	 * @param e_id
	 * @returns {*}
	 */
	get(e_id)
	{
		return this.model('events').getById(e_id);
	}

	/**
	 * список всех событий
	 *
	 * @returns {Promise.<TResult>|*}
	 */
	getAll()
	{
		return this.model('events').getAll();
	}

	/**
	 * список локаций, к которым привязаны события (включая родительские районы, города, страны..)
	 *
	 * @returns {*}
	 */
	getLocations()
	{
		return this.model('events').getLocations();
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;