/**
 * Created by RA on 07.02.2016.
 */
"use strict";
const Config = require('app/config');
const Logger = require('app/lib/logger');
const IORedis = require('ioredis');

function Rediska(){}

Rediska._clients = new WeakMap();
Rediska.getClient = function (options)
{
	if (!this._clients.has(options))
	{
		//console.log(' -= SET ', options.connectionName);
		this._clients.set(options, IORedis(Config.redis.port, Config.redis.host, options));
		this._clients.get(options).on('error', (err)=>
		{
			//console.log(".clients.get(options).on('error'");
			Logger.error(err);
		});
	}
	return this._clients.get(options);
};

module.exports = function(options)
{
	return Rediska.getClient(options);
};

/*module.exports = function(options)
{
	options = options || {};
	options = Object.assign(Config.redis, options);

	return IORedis(Config.redis.port, Config.redis.host, options);
};*/