"use strict";

const Errors = require('app/lib/errors');
const Moment = require('moment'); //работа со временем
//const Promise = require("bluebird");

const BaseModel = require('app/lib/db');

class Location extends BaseModel
{
	/**
	 * получаем список расположений (страна - область - населенный пункт)
	 */
	locationList(cb)
	{
		//nl.l_name AS value для автокомплиттеров на клиенте
		let sql = "SELECT l.l_id, l.l_pid, l.l_level, l.l_lk, l.l_rk, nl.l_name, nl.l_name AS value " +
			"FROM `location` AS l " +
			"JOIN `location_names` AS nl ON (nl.l_id = l.l_id) " +
			"ORDER BY l.l_lk";
		
		let self = this;
		self.constructor.conn().s(sql, [], function(err, res)
		{
			if(err) return cb(err, []);
			
			//не нашли
			if(res["info"]["numRows"] == 0) return cb(null, []);
			
			let list = JSON.parse(JSON.stringify(res));
			
			cb(null, list);
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Location;