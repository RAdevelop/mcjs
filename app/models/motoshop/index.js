"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Motoshop extends BaseModel
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
		let sql = `INSERT INTO motoshop (mts_name, mts_website, mts_email, mts_descrip, mts_create_ts, mts_update_ts)
		VALUES(?,?,?,?,?,?)`;

		//let now_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let now_ts = Moment().unix();

		let sqlData = [mts_name, mts_website, mts_email, mts_descrip, now_ts, now_ts];
		return this.constructor.conn().ins(sql, sqlData)
			.then(function (res)
			{
				return Promise.resolve(res["insertId"]);
			});
	}

	/**
	 * данные мотосалона по его id
	 *
	 * @param mts_id
	 * @returns {*}
	 */
	getMotoshop(mts_id)
	{
		let sql = `SELECT mts_id, mts_name, mts_website, mts_email, mts_descrip, mts_create_ts, mts_update_ts
		FROM motoshop
		WHERE mts_id = ?`;

		return this.constructor.conn().sRow(sql, [mts_id]);
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
		let sql = `UPDATE motoshop SET mts_name = ?, mts_website = ?, mts_email = ?, mts_descrip = ?, mts_update_ts = ?
		WHERE mts_id = ?`;

		//let now_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let now_ts = Moment().unix();

		let sqlData = [mts_name, mts_website, mts_email, mts_descrip, now_ts, mts_id];

		return this.constructor.conn().upd(sql, sqlData)
			.then(function ()
			{
				return Promise.resolve(mts_id);
			});
	}

	/**
	 * добавляем адрес
	 * 
	 * @param mts_id
	 * @param mts_address_website
	 * @param mts_address_email
	 * @param mts_address_phones
	 * @param mts_address
	 * @param mts_address_lat
	 * @param mts_address_lng
	 * @param gps_lat
	 * @param gps_lng
	 * @param location_id
	 * @returns {Promise.<*>}
	 */
	addAddress(mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id)
	{
		console.log(mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id);

		return Promise.resolve(mts_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;