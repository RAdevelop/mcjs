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
		let sql = `INSERT INTO motoshop_address (mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, 
		mts_address_latitude, mts_address_longitude, mts_address_gps_lat, mts_address_gps_lng, mts_address_location_id, 
		mts_address_create_ts, mts_address_update_ts) 
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		let now_ts = Moment().unix();
		let sqlData = [
			mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat,
			mts_address_lng, gps_lat, gps_lng, location_id, now_ts, now_ts
		];

		let mts_address_id;

		return this.constructor.conn().ins(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				mts_address_id = res["insertId"];

				sql = "SELECT l_lk, l_rk FROM location WHERE l_id = ?;";

				return this.constructor.conn().sRow(sql, [location_id]);
			})
			.then(function (res)
			{
				let {l_lk, l_rk} = res;

				sql = "SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;";
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then(function (res)
			{
				let sqlIns = [], sqlData = [mts_address_id], pids = [];
				res.forEach(function (item)
				{
					sqlIns.push("(?, ?)");
					sqlData.push(mts_address_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = "DELETE FROM motoshop_address_locations WHERE mts_address_id = ?;";

				sql += "INSERT INTO motoshop_address_locations (mts_address_id, l_id) " +
					"VALUES " +sqlIns.join(',')+ "" +
					" ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);";

				sql += "UPDATE motoshop_address SET mts_address_location_pids = ? WHERE mts_address_id = ?;";
				sqlData.push(pids.join(','), mts_address_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(function ()
			{
				return Promise.resolve(mts_address_id);
			});

		return Promise.resolve(mts_address_id);
	}

	/**
	 * список адресов для указанного салона
	 *
	 * @param mts_id
	 * @returns {*}
	 */
	getMotoshopAddressList(mts_id)
	{
		let sql = `SELECT mtsa.mts_address_id, mtsa.mts_id, mtsa.mts_address_website, mtsa.mts_address_email, 
		mtsa.mts_address_phones, mtsa.mts_address, mtsa.mts_address_latitude, mtsa.mts_address_longitude, 
		mtsa.mts_address_gps_lat, mtsa.mts_address_gps_lng, mtsa.mts_address_location_id, mtsa.mts_address_location_pids, 
		mtsa.mts_address_create_ts, mtsa.mts_address_update_ts
		FROM motoshop_address AS mtsa
		WHERE mtsa.mts_id = ?`;

		return this.constructor.conn().s(sql, [mts_id]);
	}

	/**
	 * удаляем адрес
	 *
	 * @param mts_id
	 * @param mts_address_id
	 * @returns {*|Promise.<*>}
	 */
	delAddress(mts_id, mts_address_id)
	{
		let sql = `DELETE FROM motoshop_address WHERE mts_address_id = ?  AND mts_id = ? ;
		DELETE FROM motoshop_address_locations WHERE mts_address_id = ?;
		`;

		return this.constructor.conn().multis(sql, [mts_address_id, mts_id, mts_address_id]);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;