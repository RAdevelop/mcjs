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
	/*constructor(driver, config = {})
	{
		this.config = config;
	}

	set config(config)
	{
		this._config = Object.assign(defaultConfig, config);
		return this;
	}

	get config()
	{
		return this._config;
	}*/

	static conn(driver = null, config = {})
	{
		if (!Drivers[driver])
		{
			driver = 'mariasql';
		}

		if (Object.keys(config).length == 0)
			config = AppConfig.db[driver];
		else
			config = Object.assign(AppConfig.db[driver], config);

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

	/**
	 *
	 * выполнение sql запроса типа "select ..."
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 */
	s(sql, sqlData = [], cb = null)
	{

	}

	/**
	 *
	 * выполнение sql запроса типа "select ..." (prepared statements)
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 */
	ps(sql, sqlData = [], cb = null)
	{

	}

	/**
	 *
	 * выполнение sql запроса типа "UPDATE ..."
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 */
	upd(sql, sqlData = [], cb = null)
	{

	}


	/**
	 *
	 * выполнение sql запроса типа "INSERT ..."
	 * в случае успешного выполнения, объект типа:
	 * {
	 *  numRows: '0',
	 *  affectedRows: '1',
	 *  insertId: '0',
	 *  metadata: undefined
	 * }
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 */
	ins(sql, sqlData = [], cb = null)
	{

	}
}

module.exports = DB;