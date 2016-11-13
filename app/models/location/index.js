"use strict";

//const Errors = require('app/lib/errors');
//const Moment = require('moment'); //работа со временем
const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Location extends BaseModel
{
	/**
	 * добавляем данные по локации
	 *
	 * @param inPid
	 * @param inName
	 * @param lat
	 * @param lng
	 * @param kind
	 * @param fullName
	 * @returns {Promise.<TResult>}
	 */
	addLocation(inPid = 0, inName, lat, lng, kind, fullName)
	{
		let sql = 'CALL location_create(?, ?, ?, ?, ?, ?, ?,  @last_ins_id); SELECT @last_ins_id AS last_ins_id FROM DUAL;';
		let sqlData = [inPid, 0, inName, lat, lng, kind, fullName];

		return this.constructor.conn().multis(sql, sqlData)
			.then(function (res)
			{
				return Promise.resolve(res[1][0]["last_ins_id"]);
			});
	}

	/**
	 * получаем данные локации по ее id
	 *
	 * @param loc_id
	 * @returns {*}
	 */
	getLocationById(loc_id)
	{
		let sql = `SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk, 
			ln.l_name, ln.l_latitude, ln.l_longitude, ln.l_full_name
			FROM location AS l
			JOIN location_names AS ln ON(ln.l_id = l.l_id)
			WHERE l.l_id = ?`;


		return this.constructor.conn().sRow(sql, [loc_id]);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Location;