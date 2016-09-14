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
		let sql = "SELECT e_id, e_create_ts, e_update_ts, e_start_ts, e_end_ts, e_title, e_notice, e_text, e_address, " +
			"e_location_id, e_latitude, e_longitude, e_gps_lat, e_gps_lng, e_location_pids, u_id" +
			" FROM `events`";

		return this.constructor.conn().s(sql);
	}

	/**
	 * вставка записи о фто в БД
	 *
	 * @private
	 *
	 * @param e_id
	 * @returns {Promise.<TResult>}
	 * @private
	 */
	_insImage(e_id)
	{
		let now_ts = Moment().unix();
		let sql = 'INSERT INTO events_image (e_id, ei_create_ts, ei_update_ts)' +
			'VALUES (?, ?, ?);';

		return this.constructor.conn().ins(sql, [e_id, now_ts, now_ts]);
	}

	/**
	 * добавление фото в БД
	 *
	 * @param u_id
	 * @param fileData
	 * @returns {Promise.<TResult>|*}
	 */
	addPhoto(u_id, fileData)
	{
		return this._insImage(fileData["e_id"])
			.then(function (res)
			{
				fileData["u_id"] = u_id;
				fileData["ei_pos"] = "0";
				fileData["ei_id"] = res['insertId'];
				return Promise.resolve(fileData);
			});
	}

	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param e_id
	 * @param ei_id
	 * @param ei_latitude
	 * @param ei_longitude
	 * @param ei_dir
	 * @param ei_name
	 * @param posUpd
	 * @returns {Promise.<TResult>|*}
	 */
	updImage(e_id, ei_id, ei_latitude, ei_longitude, ei_dir, ei_name, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL events_image_update(?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [e_id, ei_id, ei_latitude, ei_longitude, ei_dir, ei_name, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(function ()
			{
				return Promise.resolve(ei_id);
			});
	}

	/**
	 * удаление фото из БД
	 *
	 * @param e_id
	 * @param ei_id
	 * @returns {Promise.<TResult>}
	 */
	delImage(e_id, ei_id)
	{
		let sql = "CALL events_image_delete(?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";

		return this.constructor.conn().multis(sql, [e_id, ei_id])
			.then(function (res)
			{
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);

				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии пользователя
	 *
	 * @param ai_id
	 */
	getImage(ei_id)
	{
		let sql = "SELECT * " +
			" FROM events_image AS ei" +
			" JOIN `events` AS e ON (e.e_id = ei.e_id)" +
			" WHERE ei.ei_id = ?";

		return this.constructor.conn().sRow(sql, [ei_id]);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;