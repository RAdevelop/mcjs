/**
 * Created by RA on 29.11.2015.
 */
var Config = require('app/config');
var Session = require('app/lib/session')();
//var Async = require('async');
var logger = require('app/lib/logger')();
//var Errors = require('app/lib/errors');
var msgpack = require('msgpack-js');

//var Redis = require('redis').createClient;
var IORedis = require('ioredis');
//var readerRedis = new Redis(Config.redis.port, Config.redis.host, { return_buffers: true, prefix: "chat" });
var readerRedis = new IORedis(Config.redis.port, Config.redis.host, { keyPrefix: "chat" });
readerRedis.on('error', function(err){
    console.log('readerRedis Client', err);
});

//var writerRedis = new Redis(Config.redis.port, Config.redis.host, {prefix:"chat"});
var writerRedis = new IORedis(Config.redis.port, Config.redis.host, {keyPrefix:"chat"});
writerRedis.on('error', function(err){
    console.log('writerRedis Client', err);
});
//TODO
var chanel = 'chat';

module.exports = function(http, app){
    var io = require('socket.io')(http);

    //TODO io.origins('192.168.0.91:*')
    io.origins('*:*')
        .use(function(socket, next) {
            Session(socket.handshake, {}, next);
        })
        .use(function(socket, next){
            //next(new Error('not authorized')

            //console.log('socket.handshake.session:');
            //console.log(socket.handshake.session);

            /*if(!socket.handshake.session.user)
             {
             var error = new Error('error:authentication');
             next(error);
             return;
             }*/
            next();
        });

    io.on('error', function(err){
            console.log(err);
        })
        .on('disconnect', function(socket) {

            //show disconnect from session
            console.log(socket);
            console.log('Socket  disconnected');

        });

    io.on('connection', function(socket){
        socket.on('disconnect', function(){ });
    });

    //io.on('connection', function(socket){
    var nsp = io.of('/chat')
        .on('connection', function(socket){

            socket.on('disconnect', function(){ });

            console.log('');
            console.log('connection event on the Server');
            console.log('');

            socket.on('error', function(err){
                console.log(err);
            });

            socket.on('chat:error:auth', function(data, cb){
                console.log('chat:error:auth');
                console.log(data);
                cb && cb();
            });

            socket.on('chat:msg:send', function (data, cb) {
                /*
                 TODO название канала/комнаты chanel/room надо будет передавать в сообщении?!
                 перед publish сообщения проверять права пользователя, может ли он сюда писать... и так далее...
                 */
                writerRedis.publish(chanel, msgpack.encode(data));
                cb(true);
            });

            /*
             TODO надо взять за привычку, названия событий чата писать, например, так chat:ready\
             или по сути события chat:user:connected
             */
            socket.on('chat:user:connected', function (data) {
                console.log( '');
                console.log( '');
                console.log( 'socket.on ready');
                console.log( '');
                console.log( '');
                readerRedis.subscribe(chanel, function(err){
                    if (err) socket.emit('error', err);
                });
                
                writerRedis.publish(chanel, msgpack.encode(data));
            });

            //readerRedis.on('message', function (channel, message) {
            readerRedis.on('messageBuffer', function (channel, message) {
                var msg = msgpack.decode(message);
                console.log('');
                console.log('');
                console.log('channel: %s', channel);
                console.log(msg);
                socket.emit('chat:msg:get', msg);
            });
        });
    return io;
};