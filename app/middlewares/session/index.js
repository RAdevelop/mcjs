/**
 * Created by RA on 01.12.2015.
 */
"use strict";
const Config = require('app/config');
const ExpressSession = require('express-session');
const RedisStore = require('connect-redis')(ExpressSession);
const IORedis = require('app/lib/ioredis');
const Logger = require('app/lib/logger');

module.exports = function(){

    const redisClient = new IORedis();

    redisClient.on('error', function(err)
    {
        Logger.error(err);

    });

    Config.session.store = new RedisStore({
        client: redisClient
        , prefix: Config.redisClient.prefix
        //, ttl: 86400 //in sec  (= 60*60*24 = 24 ч) //TODO
    });

    return ExpressSession(Config.session);
};