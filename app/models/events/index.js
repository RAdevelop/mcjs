"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
//const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Events extends BaseModel
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
	 * @param gps_lat
	 * @param gps_lng
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {Promise.<TResult>}
	 */
	add(i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts)
	{
		let e_start_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let e_end_ts    = Moment(dd_end_ts, "DD-MM-YYYY").unix();

		let now_ts = Moment().unix();
		let sqlData = [i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, now_ts, now_ts, e_start_ts, e_end_ts, gps_lat, gps_lng];

		let i_e_id;

		let sql = "INSERT INTO `events` (u_id, e_title, e_notice, e_text, e_address" +
			", e_latitude, e_longitude, e_location_id" +
			", e_create_ts, e_update_ts, e_start_ts, e_end_ts" +
			", e_gps_lat, e_gps_lng" +
			") " +
			" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

		return this.constructor.conn().ins(sql, sqlData)
			.bind(this)
			.then(function (res)
			{
				i_e_id = res["insertId"];

				sql = "SELECT l_lk, l_rk FROM location WHERE l_id = ?;";

				return this.constructor.conn().sRow(sql, [i_location_id]);
			})
			.then(function (res)
			{
				let {l_lk, l_rk} = res;

				sql = "SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;";
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then(function (res)
			{
				let sqlIns = [], sqlData = [i_e_id], pids = [];
				res.forEach(function (item)
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_e_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = "DELETE FROM `events_locations` WHERE e_id = ?;";

				sql += "INSERT INTO `events_locations` (e_id, l_id) " +
					"VALUES " +sqlIns.join(',')+ "" +
					" ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);";

				sql += "UPDATE `events` SET e_location_pids = ? WHERE e_id = ?;";
				sqlData.push(pids.join(','), i_e_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(function ()
			{
				return Promise.resolve(i_e_id);
			});
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
	 * @param gps_lat
	 * @param gps_lng
	 * @param dd_start_ts
	 * @param dd_end_ts
	 * @returns {Promise.<TResult>}
	 */
	edit(i_e_id, i_u_id, s_e_title, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts)
	{
		let sql = "UPDATE `events` SET " +
			"e_update_ts = ?, " +
			"e_start_ts = ?, " +
			"e_end_ts = ?, " +
			"e_title = ?, " +
			"e_notice = ?, " +
			"e_text = ?, " +
			"e_address = ?, " +
			"e_location_id = ?, " +
			"e_latitude = ?," +
			"e_longitude = ?, " +
			"e_gps_lat = ?, " +
			"e_gps_lng = ?, " +
			"u_id = ? " +
			" WHERE e_id = ?";

		let e_start_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let e_end_ts    = Moment(dd_end_ts, "DD-MM-YYYY").unix();

		let now_ts = Moment().unix();
		let sqlData = [now_ts, e_start_ts, e_end_ts, s_e_title, t_e_notice, t_e_text, s_e_address, i_location_id, f_e_lat, f_e_lng
			, gps_lat, gps_lng, i_u_id, i_e_id];

		return this.constructor.conn().upd(sql, sqlData)
			.bind(this)
			.then(function ()
			{
				sql = "SELECT l_lk, l_rk FROM location WHERE l_id = ?;";

				return this.constructor.conn().sRow(sql, [i_location_id]);
			})
			.then(function (res)
			{
				let {l_lk, l_rk} = res;

				sql = "SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;";
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then(function (res)
			{
				let sqlIns = [], sqlData = [i_e_id], pids = [];
				res.forEach(function (item)
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_e_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = "DELETE FROM events_locations WHERE e_id = ?;";

				sql += "INSERT INTO events_locations (e_id, l_id) " +
					"VALUES " +sqlIns.join(',')+ "" +
					" ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);";

				sql += "UPDATE `events` SET e_location_pids = ? WHERE e_id = ?;";
				sqlData.push(pids.join(','), i_e_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(function ()
			{
				return Promise.resolve(i_e_id);
			});
	}

	/**
	 * данные события по его id
	 *
	 * @param e_id
	 * @returns {*}
	 */
	getById(e_id)
	{
		let sql = "SELECT e_id, e_create_ts, e_update_ts, e_start_ts, e_end_ts, e_title, e_notice, e_text, e_address, " +
			"e_location_id, e_latitude, e_longitude, e_gps_lat, e_gps_lng, e_location_pids, u_id" +
			" FROM `events`" +
			" WHERE e_id = ?";

		return this.constructor.conn().sRow(sql, [e_id])
			.then(function (event)
			{
				if (event)
				{
					event['dd_start_ts'] = (event && event['e_start_ts'] > 0 ? Moment.unix(event['e_start_ts']).format("DD-MM-YYYY") : '');
					event['dd_end_ts'] = (event && event['e_end_ts'] > 0 ? Moment.unix(event['e_end_ts']).format("DD-MM-YYYY") : '');
				}

				return Promise.resolve(event);
			});
	}

	/**
	 * список локаций, к которым привязано событие (включая родительские районы, города, страны..)
	 *
	 * @returns {*}
	 */
	getLocations()
	{
		let kinds = ['country','province','locality'];

		let sql = "SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk" +
			", ln.l_kind, ln.l_name, ln.l_full_name, ln.l_latitude , ln.l_longitude" +
			", IF(l.l_rk - l.l_lk = 0, 0, 1) AS l_has_child" +
			", IF(ln.l_kind = 'country', 0, IF(ln.l_kind = 'province', 1, IF(ln.l_kind = 'locality' AND l.l_level < 3, 1, 2))) AS l_e_level" +
			" FROM events_locations AS el" +
			" JOIN location_names AS ln ON(el.l_id = ln.l_id  AND ln.l_kind IN ("+(new Array(kinds.length)).fill('?').join(',')+"))" +
			" JOIN location AS l ON(l.l_id = ln.l_id)" +
			" GROUP BY el.l_id" +
			" ORDER BY l.l_lk";//, ln.l_name

		return this.constructor.conn().s(sql, kinds);
	}

	/**
	 * список всех событий
	 *
	 * @returns {Promise.<TResult>|*}
	 */
	getAll()
	{
		let sql = "SELECT e_id, mtt_name, mtt_website, mtt_address, mtt_email, mtt_phones" +
			", mtt_latitude, mtt_longitude, mtt_location_id, mtt_location_pids" +
			", mtt_create_ts, mtt_update_ts, mtt_gps_lat, mtt_gps_lng" +
			" FROM moto_track;";

		return this.constructor.conn().s(sql);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;