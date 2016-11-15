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
	 * @param u_id
	 * @param mts_show
	 * @param mts_name
	 * @param mts_alias
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	add(u_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip)
	{
		let sql = `INSERT INTO motoshop (mts_u_id_add, mts_u_id_edit, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip, mts_create_ts, mts_update_ts)
		VALUES(?,?,?,?,?,?,?,?,?,?)`;

		//let now_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let now_ts = Moment().unix();

		let sqlData = [u_id, u_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip, now_ts, now_ts];
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
	 * @param show
	 * @returns {*}
	 */
	getMotoshop(mts_id, show = null)
	{
		let sql = `SELECT mts_u_id_add, mts_u_id_edit, mts_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip, mts_create_ts, mts_update_ts
		FROM motoshop
		WHERE mts_id = ?`;

		let sqlData = [mts_id];
		if (show)
		{
			sqlData.push(show);
			sql += ` AND mts_show = ?`;
		}

		return this.constructor.conn().sRow(sql, sqlData);
	}

	/**
	 * редактируем мотосалон
	 *
	 * @param u_id
	 * @param mts_id
	 * @param mts_show
	 * @param mts_name
	 * @param mts_alias
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	edit(u_id, mts_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip)
	{
		let sql = `UPDATE motoshop SET mts_u_id_edit = ?, mts_show = ?, mts_name = ?, mts_alias = ?, mts_website = ?, 
		mts_email = ?, mts_descrip = ?, mts_update_ts = ?
		WHERE mts_id = ?`;

		//let now_ts  = Moment(dd_start_ts, "DD-MM-YYYY").unix();
		let now_ts = Moment().unix();

		let sqlData = [u_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip, now_ts, mts_id];

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
	 * @param mts_address_show
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
	addAddress(mts_id, mts_address_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id)
	{
		let sql = `INSERT INTO motoshop_address (mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, 
		mts_address_latitude, mts_address_longitude, mts_address_gps_lat, mts_address_gps_lng, mts_address_location_id, 
		mts_address_create_ts, mts_address_update_ts, mts_address_show)
		VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		let now_ts = Moment().unix();
		let sqlData = [
			mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat,
			mts_address_lng, gps_lat, gps_lng, location_id, now_ts, now_ts, mts_address_show
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
	}

	/**
	 * редактируем адрес
	 *
	 * @param mts_address_id
	 * @param mts_address_show
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
	editAddress(mts_address_id, mts_address_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id)
	{
		let sql = `UPDATE motoshop_address SET mts_address_show = ?, mts_address_website = ?, mts_address_email = ?, mts_address_phones = ?, 
		mts_address = ?, mts_address_latitude = ?, mts_address_longitude = ?, mts_address_gps_lat = ?, mts_address_gps_lng = ?, 
		mts_address_location_id = ?, mts_address_update_ts = ?
		WHERE mts_address_id = ?`;

		let now_ts = Moment().unix();
		let sqlData = [
			mts_address_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat,
			mts_address_lng, gps_lat, gps_lng, location_id, now_ts, mts_address_id
		];

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
	}

	/**
	 * список адресов для указанного (-ых) салона
	 *
	 * @param mts_id
	 * @returns {*}
	 */
	getMotoshopAddressList(mts_id, show = null, location_id = null)
	{
		if (!mts_id.map)
			mts_id = [mts_id];

		if (mts_id.length == 0)
			return Promise.resolve(null);

		let inMtsIds = this.constructor.placeHoldersForIn(mts_id);

		let sql = `SELECT mtsa.mts_address_id, mtsa.mts_id, mtsa.mts_address_website, mtsa.mts_address_email, 
		mtsa.mts_address_phones, mtsa.mts_address, mtsa.mts_address_latitude, mtsa.mts_address_longitude, 
		mtsa.mts_address_gps_lat, mtsa.mts_address_gps_lng, mtsa.mts_address_location_id, mtsa.mts_address_location_pids, 
		mtsa.mts_address_create_ts, mtsa.mts_address_update_ts, mts_address_show
		FROM motoshop_address AS mtsa
		JOIN motoshop_address_locations AS mal ON(mal.mts_address_id = mtsa.mts_address_id)
		WHERE mtsa.mts_id IN(${inMtsIds})`;

		let sqlData = [];
		sqlData = sqlData.concat(mts_id);

		if (show)
		{
			sqlData.push(show);
			sql += ` AND mtsa.mts_address_show = ?`;
		}
		if (location_id)
		{
			sqlData.push(location_id);
			sql += ` AND mal.l_id = ?`;
		}

		sql += ` GROUP BY mtsa.mts_address_id`;

		/*console.log(sql);
		console.log(sqlData);*/

		return this.constructor.conn().s(sql, sqlData);
	}

	/**
	 * удаляем мотосалон
	 *
	 * @param mts_id
	 * @returns {*|Promise.<*>}
	 */
	delMotoshop(mts_id)
	{
		return this.getMotoshopAddressList(mts_id)
			.bind(this)
			.then(function(address_list){

				let mtsAids = [];
				if (address_list.length)
				{
					address_list.forEach(function (item)
					{
						mtsAids.push(item["mts_address_id"]);
					});
				}

				let sqlData = [];
				let sql = ``;
				if (mtsAids.length)
				{
					sqlData = sqlData.concat(mtsAids);
					sqlData.push(mts_id);
					sqlData = sqlData.concat(mtsAids);

					let inMtsAids = this.constructor.placeHoldersForIn(mtsAids);
					sql = `DELETE FROM motoshop_address WHERE mts_address_id IN(${inMtsAids}) AND mts_id = ?;
					DELETE FROM motoshop_address_locations WHERE mts_address_id IN(${inMtsAids});`;
				}

				sqlData.push(mts_id);
				sql += `DELETE FROM motoshop WHERE mts_id = ?;`;

				return this.constructor.conn().multis(sql, sqlData)
					.then(function ()
					{
						return Promise.resolve(mts_id);
					});


				/*START TRANSACTION;
				DELETE FROM  myTable where date = '2014-07-23';
				INSERT INTO myTable (date,device_type,software_version,operation,bucket,bucket_count,metric_count)
				values ('2014-07-23','XXXXX1','13.4.1.0','Discharge','1','1','2'),('2014-07-23','XXXXX2','14.4.1.0','Discharge2','0','1','1');
				commit ;*/

			});
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
		let sql = `DELETE FROM motoshop_address WHERE mts_address_id = ? AND mts_id = ? ;
		DELETE FROM motoshop_address_locations WHERE mts_address_id = ?;`;

		return this.constructor.conn().multis(sql, [mts_address_id, mts_id, mts_address_id]);
	}

	/**
	 * список локаций, к которым привязан мотосалон (включая родительские районы, города, страны..)
	 *
	 * @returns {*}
	 */
	getMotoshopLocations(show)
	{
		let kinds = ['country','province','locality'];

		let inIds = this.constructor.placeHoldersForIn(kinds)

		let sqlData = [show, show];
		sqlData = sqlData.concat(kinds);

		let sql = `SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk,
			ln.l_kind, ln.l_name, ln.l_full_name, ln.l_latitude , ln.l_longitude,
			IF(l.l_rk - l.l_lk = 0, 0, 1) AS l_has_child,
			IF(ln.l_kind = 'country', 0, IF(ln.l_kind = 'province', 1, IF(ln.l_kind = 'locality' AND l.l_level < 3, 1, 2))) AS l_mts_level
			FROM (SELECT NULL) AS z 
			JOIN motoshop AS mts ON (mts.mts_show = ?)
			JOIN motoshop_address AS mtsa ON (mtsa.mts_id = mts.mts_id AND mtsa.mts_address_show = ?)
			JOIN motoshop_address_locations AS mtsal ON (mtsa.mts_address_id = mtsal.mts_address_id)
			JOIN location_names AS ln ON(mtsal.l_id = ln.l_id  AND ln.l_kind IN(${inIds}))
			JOIN location AS l ON(l.l_id = ln.l_id)
			GROUP BY mtsal.l_id
			ORDER BY l.l_lk`;//, ln.l_name

		/*console.log(sql);
		console.log(sqlData);*/

		return this.constructor.conn().s(sql, sqlData);
	}

	/**
	 * список мотосалонов
	 *
	 * @returns {Promise.<TResult>|*}
	 */
	getAllMotoshop(show)
	{
		let sql = `SELECT mts_u_id_add, mts_u_id_edit, mts_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip, mts_create_ts, mts_update_ts
		FROM motoshop
		WHERE mts_show = ?`;

		let sqlData = [show];

		return this.constructor.conn().s(sql, sqlData);
	}

	countMotoshopByLocId(loc_id, mts_show)
	{
		let sql = `SELECT COUNT(mts_id) AS cnt
			FROM (SELECT NULL) AS z
			JOIN motoshop AS mts ON(mts.mts_show = ? 
				AND EXISTS (
				SELECT 1 FROM motoshop_address_locations AS mal
                JOIN motoshop_address AS ma ON(mal.l_id = ? AND ma.mts_address_id = mal.mts_address_id)
		        WHERE mts.mts_id = ma.mts_id AND ma.mts_address_show = ?
		        )
		    )`;
		let sqlData = [mts_show, loc_id, mts_show];

		/*console.log(sql);
		 console.log(sqlData);*/

		return this.constructor.conn().sRow(sql, sqlData)
			.then(function (res)
			{
				return Promise.resolve(res["cnt"] || 0);
			});
	}

	/**
	 * список мотосалонов для указанной локации
	 * @param i_loc_id
	 * @param mts_show
	 * @returns {*|Promise.<TResult>|{then, fail}}
	 */
	getMotoshopListByLocId(loc_id, mts_show, limit = 20, offset = 0)
	{
		let sql = `SELECT mts.mts_u_id_add, mts.mts_u_id_edit, mts.mts_id, mts.mts_name, mts.mts_alias, mts.mts_website,
		    mts.mts_email, mts.mts_show
			FROM (SELECT NULL) AS z
			JOIN motoshop AS mts ON(mts.mts_show = ? 
				AND EXISTS (
				SELECT 1 FROM motoshop_address_locations AS mal
                JOIN motoshop_address AS ma ON(mal.l_id = ? AND ma.mts_address_id = mal.mts_address_id)
		        WHERE mts.mts_id = ma.mts_id AND ma.mts_address_show = ?
		        )
			)
			ORDER BY mts.mts_name
			LIMIT ${limit} OFFSET ${offset}`;

		let sqlData = [mts_show, loc_id, mts_show];

		return this.constructor.conn().s(sql, sqlData)
			.then(function (res)
			{
				if (res['info']['numRows'] == '0')
					return Promise.resolve(null);

				return Promise.resolve(res);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;