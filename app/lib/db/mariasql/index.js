/**
 * Created by ra on 20.07.16.
 */
"use strict";

const DbErrors = require('app/lib/db/error');
const Maria = require("mariasql");
const Promise = require("bluebird");

function onReady()
{
	//console.log('DB Client connected');
}

function onError(err)
{
	//console.log('DB error %j', err);
}

function onEnd()
{
	//console.log('DB Clients End');
}

function onClose()
{
	//console.log('DB Clients closed');
}

class MariaSQL
{
	constructor(config = {})
	{
		this.config = config;
	}

	set config(config)
	{
		this._config = config;
		return this;
	}

	get config()
	{
		return this._config;
	}

	conn()
	{
		return Promise.resolve(new Maria(this.config))
			.then(function (client)
			{
				client.on("ready",  onReady);
				client.on("error",  onError);
				client.on("end",    onEnd);
				client.on("close",  onClose);

				return Promise.promisifyAll(client);
			})
			.disposer(function(client)
			{
				client.end();
			});
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
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('SELECT') != 0) return Promise.reject(DbErrors(new Error("не select запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false });
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	sRow(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('SELECT') != 0) return Promise.reject(DbErrors(new Error("не select запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false });
				});
			})
			.then(function (res)
			{
				res = res[0] || null;
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
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
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('SELECT') != 0) return Promise.reject(DbErrors(new Error("не select запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					let prep = conn.prepare(sql);

					return conn.queryAsync(prep(sqlData), { useArray: true });
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	psRow(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('SELECT') != 0) return Promise.reject(DbErrors(new Error("не select запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					let prep = conn.prepare(sql);

					return conn.queryAsync(prep(sqlData), { useArray: true });
				});
			})
			.then(function (res)
			{
				res = res[0] || null;
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	/**
	 *
	 * выполнение sql запроса типа "UPDATE ..."
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 * {
	 *  numRows: '0',
	 *  affectedRows: '1',
	 *  insertId: '0',
	 *  metadata: undefined
	 * }
	 */
	upd(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('UPDATE') != 0) return Promise.reject(DbErrors(new Error("не UPDATE запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false })
						.then(function (res)
						{
							return Promise.resolve(res["info"]);
						});
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	/**
	 *
	 * выполнение sql запроса типа "DELETE ..."
	 *
	 * @param sql - строка запроса
	 * @param sqlData - массив данных для запроса
	 * @param cb - колбэк ф-ция (если указана, вызывается она, иначе врзвращается {Promise})
	 * @returns {Promise}
	 */
	del(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('DELETE') != 0) return Promise.reject(DbErrors(new Error("не DELETE запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false })
						.then(function (res)
						{
							return Promise.resolve(res["info"]);
						});
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
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
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('INSERT') != 0) return Promise.reject(DbErrors(new Error("не INSERT запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false })
						.then(function (res)
						{
							/*console.log("conn.lastInsertId() = " + conn.lastInsertId());

							 if (conn.lastInsertId() > 0)
							 return Promise.resolve(conn.lastInsertId());*/

							res["info"]["insertId"] = parseInt(res["info"]["insertId"], 10);
							return Promise.resolve(res["info"]);
						});
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	/**
	 *
	 * выполнение sql запроса типа "CALL ..."
	 *
	 * @param sql
	 * @param sqlData
	 * @param cb
	 * @returns {Promise}
	 */
	call(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				if (sql.indexOf('CALL') != 0) return Promise.reject(DbErrors(new Error("не CALL запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false });
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}

	/**
	 *
	 * выполнение multiple sql запроса типа "SELECT 1; SELECT 2; ..."
	 *
	 * @param sql
	 * @param sqlData
	 * @param cb
	 * @returns {Promise}
	 */
	multis(sql, sqlData = [], cb = null)
	{
		return Promise.resolve(sql).bind(this)
			.then(function (sql)
			{
				//if (sql.indexOf('SELECT') != 0) return Promise.reject(DbErrors(new Error("не select запрос")));

				return Promise.using(this.conn(), function (conn)
				{
					return conn.queryAsync(sql, sqlData, { useArray: false });
				});
			})
			.then(function (res)
			{
				if (cb) return cb(null, res);

				return Promise.resolve(res);
			})
			.catch(function (err)
			{
				if (cb) return cb(DbErrors(err));

				throw DbErrors(err);
			});
	}
}

module.exports = MariaSQL;