/**
 * Created by RA on 07.02.2016.
 */
"use strict";
const Config = require('app/config');
const IORedis = require('ioredis');

module.exports = function(options)
{
	options = options || {};
	options = Object.assign(Config.redis, options);

	return IORedis(Config.redis.port, Config.redis.host, options);
};