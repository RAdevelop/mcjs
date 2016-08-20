/**
 * Created by RA on 29.11.2015.
 */
"use strict";
	
//const Config = require('app/config');
const Session = require('app/middlewares/session')();
const Logger = require('app/lib/logger');
//var Errors = require('app/lib/errors');

//TODO проверить работу StringDecoder https://nodejs.org/dist/latest-v4.x/docs/api/string_decoder.html
const msgpack = require('msgpack-js');

//var Redis = require('redis').createClient;
const IORedis = require('app/lib/ioredis');
//var readerRedis = new Redis(Config.redis.port, Config.redis.host, { return_buffers: true, prefix: "chat" });
const readerRedis = new IORedis({ keyPrefix: "chat" });
readerRedis.on('error', function(err){
	Logger().error('readerRedis Client', err);
});

//var writerRedis = new Redis(Config.redis.port, Config.redis.host, {prefix:"chat"});
const writerRedis = new IORedis({keyPrefix:"chat"});
writerRedis.on('error', function(err){
	Logger().error('writerRedis Client', err);
});
//TODO
var chanel = 'rooms';

module.exports = function(http, app)
{
	var io = require('socket.io')(http);

	//TODO io.origins('192.168.0.91:*')
	io.origins('*:*')
	.use(function(socket, next) {
		Session(socket.handshake, {}, next);
	})
	.use(function(socket, next){
		//next(new Error('not authorized')

		//console.log('socket.handshake.session:');
		Logger().debug(socket.handshake.session);

		/*if(!socket.handshake.session.rtid)
		{
			var error = new Error('error:authentication');
			next(error);
			return;
		}*/
		next();
	});

	io.on('error', function(err){
				Logger().error(err);
	})
	.on('disconnect', function(socket) {

		//show disconnect from session
		Logger().debug(socket);
		Logger().info('Socket  disconnected from "/"');

	});

	/*io.on('connection', function(socket){

		console.log('someone connected to "/"');

		socket.on('disconnect', function(){ });
	});*/

	var nsp = io.of('/'+chanel);
	nsp.on('connection', function(socket){
		
		socket.on('error', function(err){
			Logger().error(err);
		});
		
		socket.on('chat:error:auth', function(data, cb){
			Logger().debug('chat:error:auth');
			Logger().debug(data);
			cb && cb();
		});
		
		socket.on('disconnect', function(){
			Logger().info('Socket  disconnected from "/'+chanel+'"');//это срабатывает... может быть тут надо будет вызывать событие leave()...?
		});
		
		console.log('someone connected to "/'+chanel+'"');
		
		socket.on('chat:user:connected', function (data) {
			console.log( '');
			Logger().info('chat:user:connected');
			console.log( '');
			
			readerRedis.subscribe(chanel, function(err){
				if (err) socket.emit('error', err);
			});
			
			writerRedis.publish(chanel, msgpack.encode(data));
		});
		
		socket.on('chat:msg:send', function (data, cb) {
			/*
			 TODO название канала/комнаты chanel/room надо будет передавать в сообщении?!
			 перед publish сообщения проверять права пользователя, может ли он сюда писать... и так далее...
			 */
			writerRedis.publish(chanel, msgpack.encode(data));
			cb(true);
		});
		
		//readerRedis.on('message', function (channel, message) {
		readerRedis.on('messageBuffer', function (channel, message) {
			var msg = msgpack.decode(message);
			console.log('');
			Logger().debug('channel: %s', channel);
			Logger().info(msg);
			socket.emit('chat:msg:get', msg);
		});
	});
	
	/*
	 sub.subscribe(prefix + '#' + nsp.name + '#', function(err){
	 if (err) self.emit('error', err);
	 });
	*/
	
	//nsp.emit('hi', 'everyone!');
	return io;
};