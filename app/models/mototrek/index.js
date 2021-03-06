"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

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
	 * @param location_id
	 * @param gps_lat,
	 * @param gps_lng
	 * @returns {Promise}
	 */
	add(s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id, gps_lat, gps_lng)
	{
		let sql = `INSERT INTO moto_track (mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones
		, mtt_latitude, mtt_longitude, mtt_location_id
		, mtt_create_ts, mtt_update_ts
		, mtt_gps_lat, mtt_gps_lng
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		let now_ts = Moment().unix();
		let sqlData = [s_mtt_name, s_mtt_website, s_mtt_address, t_mtt_descrip, m_mtt_email, s_mtt_phones,
			f_mtt_lat, f_mtt_lng, location_id, now_ts, now_ts, gps_lat, gps_lng];
		let i_mtt_id;

		return this.constructor.conn().ins(sql, sqlData)
			.then((res) =>
			{
				i_mtt_id = res["insertId"];
				i_mtt_id = parseInt(i_mtt_id, 10);
				sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?;`;

				location_id = parseInt(location_id, 10);
				return this.constructor.conn().sRow(sql, [location_id]);
			})
			.then((res) =>
			{
				let {l_lk, l_rk} = res;
				l_lk = parseInt(l_lk, 10);
				l_rk = parseInt(l_rk, 10);
				sql = "SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;";
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then((res) =>
			{
				let sqlIns = [], sqlData = [i_mtt_id], pids = [];
				res.forEach((item) => 
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_mtt_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = `DELETE FROM moto_track_locations WHERE mtt_id = ?;`;

				sql += `INSERT INTO moto_track_locations (mtt_id, l_id)
				VALUES ${sqlIns.join(',')}
				ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);`;

				sql += `UPDATE moto_track SET mtt_location_pids = ? WHERE mtt_id = ?;`;
				sqlData.push(pids.join(','), i_mtt_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(() => {
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
	 * @param location_id
	 * @param gps_lat
	 * @param gps_lng
	 * @returns {Promise} i_mtt_id
	 */
	edit(i_mtt_id, s_mtt_name, t_mtt_descrip, s_mtt_website, m_mtt_email, s_mtt_phones, s_mtt_address, f_mtt_lat, f_mtt_lng, location_id, gps_lat, gps_lng)
	{
		let sql = `UPDATE moto_track SET
			mtt_name = ?,
			mtt_website = ?,
			mtt_address = ?,
			mtt_descrip = ?,
			mtt_email = ?,
			mtt_phones = ?,
			mtt_latitude = ?,
			mtt_longitude = ?,
			mtt_location_id = ?,
			mtt_update_ts = ?,
			mtt_gps_lat = ?,
			mtt_gps_lng = ?
			WHERE mtt_id = ?`;

		let now_ts = Moment().unix();
		i_mtt_id = parseInt(i_mtt_id, 10);
		location_id = parseInt(location_id, 10);

		let sqlData = [s_mtt_name, s_mtt_website, s_mtt_address, t_mtt_descrip, m_mtt_email, s_mtt_phones, f_mtt_lat, f_mtt_lng, location_id,
			now_ts, gps_lat, gps_lng, i_mtt_id];

		return this.constructor.conn().upd(sql, sqlData)
			.then(() =>
			{
				sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?;`;

				return this.constructor.conn().sRow(sql, [location_id]);
			})
			.then((res) =>
			{
				let {l_lk, l_rk} = res;
				l_lk = parseInt(l_lk, 10);
				l_rk = parseInt(l_rk, 10);
				sql = `SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;`;
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then((res) =>
			{
				let sqlIns = [], sqlData = [i_mtt_id], pids = [];
				res.forEach((item) => {
					sqlIns.push("(?, ?)");
					sqlData.push(i_mtt_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = `DELETE FROM moto_track_locations WHERE mtt_id = ?;`;

				sql += `INSERT INTO moto_track_locations (mtt_id, l_id)
				VALUES ${sqlIns.join(',')}
				ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);`;

				sql += `UPDATE moto_track SET mtt_location_pids = ? WHERE mtt_id = ?;`;
				sqlData.push(pids.join(','), i_mtt_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(() => 
			{
				return Promise.resolve(i_mtt_id);
			});
	}

	/**
	 * данные трека по его id
	 *
	 * @param mtt_id
	 * @returns {Promise}
	 */
	getById(mtt_id)
	{
		let sql = `SELECT mtt_id, mtt_name, mtt_website, mtt_address, mtt_descrip, mtt_email, mtt_phones
		, mtt_latitude, mtt_longitude, mtt_location_id
		, mtt_create_ts, mtt_update_ts, mtt_location_pids, mtt_gps_lat, mtt_gps_lng
		FROM moto_track
		WHERE mtt_id = ?`;
		
		mtt_id = parseInt(mtt_id, 10)||0;
		return this.constructor.conn().sRow(sql, [mtt_id]);
	}

	/**
	 * список локаций, к которым привязан трек (включая родительские районы, города, страны..)
	 *
	 * @returns {Promise}
	 */
	getLocations()
	{
		let kinds = ['country','province','locality'];
		let mttPlaceHolders = this.constructor.placeHoldersForIn(kinds);

		let sql = `SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk
		, ln.l_kind, ln.l_name, ln.l_full_name, ln.l_latitude, ln.l_longitude
		, IF(l.l_rk - l.l_lk = 0, 0, 1) AS l_has_child
		, IF(ln.l_kind = 'country', 0, IF(ln.l_kind = 'province', 1, IF(ln.l_kind = 'locality' AND l.l_level < 3, 1, 2))) AS l_mtt_level
		 FROM moto_track_locations AS mtl
		 JOIN location_names AS ln ON(mtl.l_id = ln.l_id AND ln.l_kind IN (${mttPlaceHolders}))
		 JOIN location AS l ON(l.l_id = ln.l_id)
		 GROUP BY mtl.l_id
		 ORDER BY l.l_lk`;//, ln.l_name

		return this.constructor.conn().s(sql, kinds);
	}

	/**
	 * список всех треков
	 *
	 * @returns {Promise}
	 */
	getAll()
	{
		let sql = `SELECT mtt_id, mtt_name, mtt_website, mtt_address, mtt_email, mtt_phones
		, mtt_latitude, mtt_longitude, mtt_location_id, mtt_location_pids
		, mtt_create_ts, mtt_update_ts, mtt_gps_lat, mtt_gps_lng
		FROM moto_track;`;

		return this.constructor.conn().s(sql);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototrek;