/**
 * Created by RA on 01.12.2015.
 */
"use strict";
const Config = require('app/config');
const ExpressSession = require('express-session');
const RedisStore = require('connect-redis')(ExpressSession);
const IORedis = require('ioredis');

module.exports = function(){

    const redisClient = new IORedis(Config.redis);

    redisClient.on('error', function(err){

        console.log(err);

    });

    Config.session.store = new RedisStore({client: redisClient, prefix: Config.redisClient.prefix});

    return ExpressSession(Config.session);
};