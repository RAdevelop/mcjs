/**
 * Created by RA on 01.12.2015.
 */
"use strict";
const Config = require('app/config');
const ExpressSession = require('express-session');
const RedisStore = require('connect-redis')(ExpressSession);
const IORedis = require('app/lib/ioredis');
//const Logger = require('app/lib/logger');

/*
module.exports = function(){

    const redisClient = new IORedis();

    redisClient.on('error', function(err)
    {
        Logger.error(err);

    });

    Config.session.store = new RedisStore({
        client: redisClient
        , prefix: Config.session.prefix
        , ttl: 86400 //in sec  (= 60*60*24 = 24 ч) //TODO
    });

    return ExpressSession(Config.session);
};*/


const Session = (function()
{
    let _instance;

    function init()
    {
        if (!_instance)
        {
            _instance = new Singleton();
        }
        return _instance;
    }


    // Конструктор
    function Singleton()
    {
        //const redisClient = new IORedis({connectionName : 'session'});
        let opt = {connectionName : 'session'};
        opt = Object.assign({}, Config.redis, opt);
        
        const redisClient = IORedis(opt);

        /*redisClient.on('error', function(err)
        {
            Logger.error(err);
        });*/

        Config.session.store = new RedisStore({
            client: redisClient
            , prefix: Config.session.prefix
            , ttl: 86400 //in sec  (= 60*60*24 = 24 ч) //TODO
        });

        return ExpressSession(Config.session);
    }
    return init();
})();

module.exports = Session;