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
	 * @param t_mtt_descrip
	 * @param s_mtt_website
	 * @param m_mtt_email
	 * @param s_mtt_phones
	 * @param s_mtt_address
	 * @param f_mtt_lat
	 * @param f_mtt_lng
	 * @returns {*}
	 */
	add(s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id)
	{
		let sql = "INSERT INTO moto_track (mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones" +
			", mtt_latitude, mtt_longitude, mtt_location_id" +
			", mtt_create_ts, mtt_update_ts) " +
			" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

		let now_ts = Moment().unix();
		let sqlData = [s_mtt_name, s_mtt_website, s_mtt_address, t_mtt_descrip, m_mtt_email, s_mtt_phones, f_mtt_lat, f_mtt_lng, location_id, now_ts, now_ts];
		let i_mtt_id;

		return this.constructor.conn().ins(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				i_mtt_id = res["insertId"];

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
				let sqlIns = [], sqlData = [i_mtt_id];
				res.forEach(function (item)
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_mtt_id, item["l_id"]);
				});

				sql = "DELETE FROM moto_track_locations WHERE mtt_id = ?;" +
					"INSERT INTO moto_track_locations (mtt_id, l_id) " +
					"VALUES " +sqlIns.join(',')+ "" +
					" ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);";

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(function ()
			{
				return Promise.resolve(i_mtt_id);
			});
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
	 * @returns {*} i_mtt_id
	 */
	edit(i_mtt_id, s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id)
	{
		let sql = "UPDATE moto_track SET " +
			"mtt_name = ?, " +
			"mtt_website = ?, " +
			"mtt_address = ?, " +
			"mtt_descrip = ?, " +
			"mtt_email = ?, " +
			"mtt_phones = ?, " +
			"mtt_latitude = ?, " +
			"mtt_longitude = ?, " +
			"mtt_location_id = ?," +
			"mtt_update_ts = ? " +
			" WHERE mtt_id = ?";

		let now_ts = Moment().unix();
		let sqlData = [s_mtt_name, s_mtt_website, s_mtt_address, t_mtt_descrip, m_mtt_email, s_mtt_phones, f_mtt_lat, f_mtt_lng, location_id, now_ts, i_mtt_id];

		return this.constructor.conn().upd(sql, sqlData)
			.bind(this)
			.then(function ()
			{
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
				let sqlIns = [], sqlData = [i_mtt_id];
				res.forEach(function (item)
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_mtt_id, item["l_id"]);
				});

				sql = "DELETE FROM moto_track_locations WHERE mtt_id = ?;" +
					"INSERT INTO moto_track_locations (mtt_id, l_id) " +
					"VALUES " +sqlIns.join(',')+ "" +
					" ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);";

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(function ()
			{
				return Promise.resolve(i_mtt_id);
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
		let sql = "SELECT mtt_id, mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones" +
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