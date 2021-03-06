"use strict";

//const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Events extends BaseModel
{
	/**
	 * добавляем новое событие
	 *
	 * @param i_u_id
	 * @param s_e_title
	 * @param e_alias
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
	 * @returns {Promise}
	 */
	add(i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts)
	{
		let e_start_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let e_end_ts    = Moment(dd_end_ts, "DD-MM-YYYY").unix();

		let now_ts = Moment().unix();
		let sqlData = [i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, now_ts, now_ts, e_start_ts, e_end_ts, gps_lat, gps_lng];

		let i_e_id;

		let sql =
			`INSERT INTO events_list (u_id, e_title, e_alias, e_notice, e_text, e_address, e_latitude, e_longitude, e_location_id
			, e_create_ts, e_update_ts, e_start_ts, e_end_ts, e_gps_lat, e_gps_lng) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		return this.constructor.conn().ins(sql, sqlData)
			.then((res) =>
			{
				i_e_id = parseInt(res["insertId"], 10);

				sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?;`;
				i_location_id = parseInt(i_location_id, 10);
				return this.constructor.conn().sRow(sql, [i_location_id]);
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
				let sqlIns = [], sqlData = [i_e_id], pids = [];
				res.forEach((item) => {
					sqlIns.push("(?, ?)");
					sqlData.push(i_e_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = `DELETE FROM events_locations WHERE e_id = ?;
					INSERT INTO events_locations (e_id, l_id) VALUES ${sqlIns.join(',')}
					ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);
					UPDATE events_list SET e_location_pids = ? WHERE e_id = ?;`;

				sqlData.push(pids.join(','), i_e_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(() => 
			{
				return this.getById(i_e_id);
			});
	}

	/**
	 * редактируем событие
	 *
	 * @param i_e_id
	 * @param i_u_id
	 * @param s_e_title
	 * @param e_alias
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
	 * @returns {Promise}
	 */
	edit(i_e_id, i_u_id, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address, f_e_lat, f_e_lng, i_location_id, gps_lat, gps_lng, dd_start_ts, dd_end_ts)
	{
		let sql = `UPDATE events_list SET e_update_ts = ?, e_start_ts = ?, e_end_ts = ?, e_title = ?, e_alias = ?, 
			e_notice = ?, e_text = ?, e_address = ?, e_location_id = ?, e_latitude = ?, e_longitude = ?, e_gps_lat = ?, 
			e_gps_lng = ?, u_id = ? 
			WHERE e_id = ?`;

		let e_start_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let e_end_ts    = Moment(dd_end_ts, "DD-MM-YYYY").unix();

		let now_ts = Moment().unix();

		i_e_id = parseInt(i_e_id, 10);

		let sqlData = [now_ts, e_start_ts, e_end_ts, s_e_title, e_alias, t_e_notice, t_e_text, s_e_address
			, i_location_id, f_e_lat, f_e_lng, gps_lat, gps_lng, i_u_id, i_e_id];

		return this.constructor.conn().upd(sql, sqlData)
			.then(() =>
			{
				sql = `SELECT l_lk, l_rk FROM location WHERE l_id = ?;`;
				i_location_id = parseInt(i_location_id, 10);
				return this.constructor.conn().sRow(sql, [i_location_id]);
			})
			.then((res) =>
			{
				let {l_lk, l_rk} = res;

				sql = `SELECT l_id FROM location WHERE l_lk <= ? AND l_rk >= ? ORDER BY l_lk;`;
				l_lk = parseInt(l_lk, 10);
				l_rk = parseInt(l_rk, 10);
				return this.constructor.conn().s(sql, [l_lk, l_rk]);
			})
			.then((res) =>
			{
				let sqlIns = [], sqlData = [i_e_id], pids = [];

				res.forEach((item) =>
				{
					sqlIns.push("(?, ?)");
					sqlData.push(i_e_id, item["l_id"]);
					pids.push(item["l_id"]);
				});

				sql = `DELETE FROM events_locations WHERE e_id = ?;
					INSERT INTO events_locations (e_id, l_id) 
					VALUES ${sqlIns.join(',')} ON DUPLICATE KEY UPDATE l_id=VALUES(l_id);
					UPDATE events_list SET e_location_pids = ? WHERE e_id = ?;`;

				sqlData.push(pids.join(','), i_e_id);

				return this.constructor.conn().multis(sql, sqlData);
			})
			.then(() =>
			{
				return Promise.resolve(i_e_id);
			});
	}

	/**
	 * данные события по его id
	 *
	 * @param e_id
	 * @returns {Promise}
	 */
	getById(e_id)
	{
		e_id = parseInt(e_id, 10)||0;
		
		if (!!e_id === false)
			return Promise.resolve(null);
		
		let sql = `SELECT e_id, e_create_ts, e_update_ts, e_start_ts, e_end_ts, e_title, e_alias, 
		e_notice, e_text, e_address, e_location_id, e_latitude, e_longitude, e_gps_lat, e_gps_lng, e_location_pids, 
		u_id, file_cnt
		, FROM_UNIXTIME(e_start_ts, "%d-%m-%Y") AS dd_start_ts
		, FROM_UNIXTIME(e_end_ts, "%d-%m-%Y") AS dd_end_ts
		FROM events_list
		WHERE e_id = ?`;
		
		return this.constructor.conn().sRow(sql, [e_id]);
	}
	
	/**
	 * список локаций, к которым привязаны события (включая родительские районы, города, страны..)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id
	 * @returns {Promise}
	 */
	getLocations(start_ts, end_ts, l_id = null)
	{
		l_id = null; //нужен ли тут l_id?
		
		//let kinds = ['country','province','locality'];
		let kinds = ['country','province','locality'];
		let sqlData = [];
		l_id = parseInt(l_id, 10);

		start_ts = parseInt(start_ts, 10);
		end_ts = parseInt(end_ts, 10);
		//end_ts = Moment(end_ts*1000).add(1,'day').unix();

		sqlData.unshift(start_ts, end_ts);

		let on_events_locations = (l_id ? ` el.l_id = ? AND ` : ``);

		l_id = parseInt(l_id, 10);
		if (l_id > 0)
			sqlData.push(l_id);

		sqlData = sqlData.concat(kinds);

		let sql =
			`SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk
			, ln.l_kind, ln.l_name, ln.l_full_name, ln.l_latitude , ln.l_longitude
			, IF(l.l_rk - l.l_lk = 0, 0, 1) AS l_has_child
			, IF(ln.l_kind = 'country', 0, IF(ln.l_kind = 'province', 1, IF(ln.l_kind = 'locality' AND l.l_level < 3, 1, 2))) AS l_e_level
			 FROM (SELECT NULL) AS z
			 JOIN events_list AS e ON(e.e_end_ts >= ? AND e.e_start_ts < ?)
			 JOIN events_locations AS el ON(${on_events_locations} el.e_id = e.e_id )
			 JOIN location_names AS ln ON(el.l_id = ln.l_id AND ln.l_kind IN(${this.constructor.placeHoldersForIn(kinds)}))
			 JOIN location AS l ON(l.l_id = ln.l_id AND l.l_level IN(1,2))
			 GROUP BY el.l_id
			 ORDER BY l.l_lk`;//, ln.l_name

		//console.log(sql, sqlData);

		return this.constructor.conn().s(sql, sqlData);
	}

	/**
	 * список событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {Promise}
	 */
	getEvents(start_ts, end_ts, l_id = null)
	{
		start_ts = parseInt(start_ts, 10);
		end_ts = parseInt(end_ts, 10);

		let sqlData = [start_ts, end_ts];
		let sql =
			`SELECT e.e_id, e.e_create_ts, e.e_update_ts, e.e_start_ts, e.e_end_ts, e.e_title, e.e_alias, 
			e.e_notice, e.e_address
			, FROM_UNIXTIME(e.e_start_ts, "%d-%m-%Y") AS dd_start_ts
			, FROM_UNIXTIME(e.e_end_ts, "%d-%m-%Y") AS dd_end_ts
			, e.e_location_id, e.e_latitude, e.e_longitude, e.e_gps_lat, e.e_gps_lng, e.e_location_pids
			, e.u_id, ei.f_id, ei.f_latitude, ei.f_longitude, ei.f_dir, ei.f_pos, ei.f_name, ei.f_type
			FROM (SELECT NULL) AS z
			JOIN events_list AS e ON(e.e_end_ts >= ? AND e.e_start_ts <= ?)
			LEFT JOIN events_file AS ei ON(ei.e_id = e.e_id AND ei.f_pos = 0 AND ei.f_type = 'image')`;
		
		if (l_id > 0)
		{
			sql += `
			JOIN events_locations AS el ON(el.e_id = e.e_id AND el.l_id = ?)
			GROUP BY e.e_id`;
			l_id = parseInt(l_id, 10);
			sqlData.push(l_id);
		}
		
		sql += `
		ORDER BY e.e_start_ts DESC`;

		/*console.log('\n');
		console.log(sql);
		console.log(sqlData);
		console.log('\n');*/
		
		return this.constructor.conn().ps(sql, sqlData);
	}
	
	getEventsByIds(e_ids)
	{
		if (!!e_ids.length === false)
			return Promise.resolve(null);
		
		let sql =
			`SELECT e.e_id, e.e_create_ts, e.e_update_ts, e.e_start_ts, e.e_end_ts, e.e_title, e.e_alias, 
			e.e_notice, e.e_address
			, FROM_UNIXTIME(e.e_start_ts, "%d-%m-%Y") AS dd_start_ts
			, FROM_UNIXTIME(e.e_end_ts, "%d-%m-%Y") AS dd_end_ts
			, e.e_location_id, e.e_latitude, e.e_longitude, e.e_gps_lat, e.e_gps_lng, e.e_location_pids
			, e.u_id, ei.f_id, ei.f_latitude, ei.f_longitude, ei.f_dir, ei.f_pos, ei.f_name, ei.f_type
			FROM (SELECT NULL) AS z
			JOIN events_list AS e ON(e.e_id IN(${this.constructor.placeHoldersForIn(e_ids)}))
			LEFT JOIN events_file AS ei ON(ei.e_id = e.e_id AND ei.f_pos = 0 AND ei.f_type = 'image')
			ORDER BY e.e_start_ts DESC`;
		
		/*console.log(sql);
		console.log(e_ids);
		console.log('\n');*/
		
		return this.constructor.conn().ps(sql, e_ids);
	}

	/**
	 * список дат событий за указанный интервал дат (в формете timestamp)
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id - id месторасположения
	 *
	 * @returns {Promise}
	 */
	getEventsDate(start_ts, end_ts, l_id = null)
	{
		start_ts = parseInt(start_ts, 10);
		end_ts = parseInt(end_ts, 10);

		let sqlData = [start_ts, end_ts];
		let sql =
			`SELECT e.e_id, e.e_start_ts, e.e_end_ts
			FROM (SELECT NULL) AS z
			JOIN events_list AS e ON(e.e_end_ts >= ? AND e.e_start_ts < ?)`;

		if (l_id > 0)
		{
			sql +=
				`JOIN events_locations AS el ON(el.e_id = e.e_id AND el.l_id = ?)
				GROUP BY e.e_id`;
			l_id = parseInt(l_id, 10);
			sqlData.push(l_id);
		}

		return this.constructor.conn().s(sql, sqlData);
	}

	/**
	 * вставка записи о фто в БД
	 *
	 * @private
	 *
	 * @param e_id
	 * @returns {Promise}
	 * @private
	 */
	_insImage(e_id)
	{
		let now_ts = Moment().unix();
		let sql =
			`INSERT INTO events_file (e_id, f_create_ts, f_update_ts)
			VALUES (?, ?, ?);`;

		return this.constructor.conn().ins(sql, [e_id, now_ts, now_ts]);
	}

	/**
	 * добавление фото в БД
	 *
	 * @param u_id
	 * @param fileData
	 * @returns {Promise}
	 */
	addPhoto(u_id, fileData)
	{
		return this._insImage(fileData["e_id"])
			.then((res) => {
				fileData["u_id"] = u_id;
				fileData["f_pos"] = "0";
				fileData["f_id"] = res['insertId'];
				return Promise.resolve(fileData);
			});
	}

	/**
	 * обновление данных о фото после его загрузки на сервер
	 *
	 * @param e_id
	 * @param f_id
	 * @param f_latitude
	 * @param f_longitude
	 * @param f_dir
	 * @param f_name
	 * @param f_type
	 * @param posUpd
	 * @returns {Promise}
	 */
	updImage(e_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd = true)
	{
		posUpd = (posUpd ? 1 : 0);
		let sql = "CALL events_file_update(?, ?, ?, ?, ?, ?, ?, ?)";
		let sqlData = [e_id, f_id, f_latitude, f_longitude, f_dir, f_name, f_type, posUpd];

		return this.constructor.conn().call(sql, sqlData)
			.then(() => {
				return Promise.resolve(f_id);
			});
	}

	/**
	 * удаление фото из БД
	 *
	 * @param e_id
	 * @param f_id
	 * @returns {Promise}
	 */
	delImage(e_id, f_id)
	{
		let sql = "CALL events_file_delete(?, ?, @is_del); SELECT @is_del AS is_del FROM DUAL;";

		return this.constructor.conn().multis(sql, [e_id, f_id])
			.then((res) => {
				let is_del = (res[1] && res[1]["is_del"] ? res[1]["is_del"] : 0);

				return Promise.resolve(is_del);
			});
	}

	/***
	 * получаем данные для указанной фотографии
	 *
	 * @param f_id
	 */
	getImage(f_id)
	{
		let sql = `SELECT ei.f_id, ei.e_id, ei.f_create_ts, ei.f_update_ts, ei.f_latitude, ei.f_longitude, 
		ei.f_dir, ei.f_pos, ei.f_name, ei.f_type
		FROM events_file AS ei
		WHERE ei.f_id = ?`;
		
		f_id = parseInt(f_id, 10)||0;
		
		return this.constructor.conn().sRow(sql, [f_id]);
	}

	/***
	 * получаем фотографии для указанного события
	 *
	 * @param e_id
	 */
	getImageList(e_id)
	{
		let sql = `SELECT ei.f_id, ei.e_id, ei.f_create_ts, ei.f_update_ts, ei.f_latitude, ei.f_longitude, 
			ei.f_dir, ei.f_pos, ei.f_name, ei.f_type
			FROM events_file AS ei
			WHERE ei.e_id = ?
			-- GROUP BY ei.f_pos, ei.f_type
			ORDER BY ei.f_type, ei.f_pos`;
		
		e_id = parseInt(e_id, 10)||0;
		return this.constructor.conn().s(sql, [e_id]);
	}

	/**
	 * кол-вл фоток в событии
	 *
	 * @param e_id
	 * @returns {Promise}
	 */
	countAlbumImages(e_id)
	{
		let sql = "SELECT COUNT(f_id) AS cnt FROM events_file WHERE e_id = ?;";

		e_id = parseInt(e_id, 10);
		return this.constructor.conn().sRow(sql, [e_id])
			.then((res) => {
				return Promise.resolve(res["cnt"]);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param e_id
	 * @param file_pos - id фоток
	 * @returns {Promise}
	 */
	updSortImg(e_id, file_pos = [])
	{
		return this.countAlbumImages(e_id)
			.then((cnt) => {
				cnt = parseInt(cnt, 10)||0;
				cnt = (!cnt ? 0 : cnt);
				
				if (!cnt || !file_pos.length || cnt < file_pos.length)
					return Promise.resolve(true);
				
				let setOrdi = [];
				let setData = [];
				
				file_pos.forEach((f_id, i) =>
				{
					setOrdi.push("IF(f_id = ?, ? ");
					setData.push(f_id, i);
				});
				
				let sql = "UPDATE events_file SET f_pos = " + setOrdi.join(',') + ', f_pos' +')'.repeat(setOrdi.length) +
					" WHERE e_id = ? ";
				
				e_id = parseInt(e_id, 10)||0;
				setData.push(e_id);
				
				//return Promise.resolve();
				return this.constructor.conn().upd(sql, setData);
			});
	}

	/**
	 * удаляем указанное событие
	 *
	 * @param e_id
	 * @returns {Promise}
	 */
	delEvent(e_id)
	{
		let sql = `DELETE FROM events_file WHERE e_id = ?;
		DELETE FROM events_locations WHERE e_id = ?;
		DELETE FROM events_list WHERE e_id = ?;
		`;
		e_id = parseInt(e_id, 10);
		return this.constructor.conn().multis(sql, [e_id, e_id, e_id]);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;