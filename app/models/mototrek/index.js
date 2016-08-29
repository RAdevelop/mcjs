"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
//const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Mototrek extends BaseModel
{
	/**
	 * добавляем новый трек
	 *
	 * @param s_mtt_name
	 * @param s_mtt_descrip
	 * @param s_mtt_website
	 * @param m_mtt_email
	 * @param s_mtt_phones
	 * @param s_mtt_address
	 * @param f_mtt_lat
	 * @param f_mtt_lng
	 * @returns {*}
	 */
	add(s_mtt_name, s_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id)
	{
		let sql = "INSERT INTO moto_track (mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones" +
			", mtt_latitude, mtt_longitude, mtt_location_id" +
			", mtt_create_ts, mtt_update_ts) " +
			" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

		let now_ts = Moment().unix();
		let sqlData = [s_mtt_name, s_mtt_website, s_mtt_address, s_mtt_descrip, m_mtt_email, s_mtt_phones, f_mtt_lat, f_mtt_lng, location_id, now_ts, now_ts];

		return this.constructor.conn().ins(sql, sqlData)
			.then(function (res)
			{
				return Promise.resolve(res["insertId"]);
			});
	}

	/**
	 * данные трека по его id
	 *
	 * @param mtt_id
	 * @returns {*}
	 */
	getById(mtt_id)
	{
		let sql = "SELECT mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones" +
			", mtt_latitude, mtt_longitude, mtt_location_id" +
			", mtt_create_ts, mtt_update_ts" +
			" FROM moto_track" +
			" WHERE mtt_id = ?";

		return this.constructor.conn().sRow(sql, [mtt_id])
			.then(function (res)
			{
				return Promise.resolve(res);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototrek;