/**
 * Created by ra on 20.07.16.
 */
"use strict";

//const MariaSQL = require("mariasql");
//const Promise = require("bluebird");

const AppConfig = require('app/config');

/*const AppConfig = {
	db:   {
		mariasql: {
			host: 'localhost',
			user: 'mc',
			password: 'mcjs',
			db: 'mcjs',
			charset: 'utf8'
			//, keepQueries: true
		}
	}
};*/

const Drivers = {};

for(let d in AppConfig.db)
{
	Drivers[d] = require('./'+d);
}
class DB
{
	static conn(driver = null, config = {})
	{
		if (!Drivers[driver])
			driver = 'mariasql';
		
		if (Object.keys(config).length == 0)
			config = AppConfig.db[driver];
		else
			config = Object.assign({}, AppConfig.db[driver], config);
		
		return new (Drivers[driver])(config);
	}
	
	/**
	 * возвращает строку вида ?,?,?,...
	 *
	 * @param arr
	 * @returns {string}
	 */
	static placeHoldersForIn(arr)
	{
		return (new Array(arr.length)).fill('?').join(',');
	}
}

module.exports = DB;