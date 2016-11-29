/**
 * Created by RA on 29.11.2015.
 */
"use strict";
	
const AppConfig = require('app/config');
const Session = require('app/middlewares/session')();
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');

//TODO проверить работу StringDecoder https://nodejs.org/dist/latest-v4.x/docs/api/string_decoder.html
const msgpack = require('msgpack-js');

/*//var Redis = require('redis').createClient;
const IORedis = require('app/lib/ioredis');
//var readerRedis = new Redis(Config.redis.port, Config.redis.host, { return_buffers: true, prefix: "chat" });
const readerRedis = new IORedis({ keyPrefix: "chat", password: AppConfig.redis.password });
readerRedis.on('error', function(err)
{
	Logger.error('readerRedis Client', err);
});

//var writerRedis = new Redis(Config.redis.port, Config.redis.host, {prefix:"chat"});
const writerRedis = new IORedis({keyPrefix:"chat", password: AppConfig.redis.password});
writerRedis.on('error', function(err){
	Logger.error('writerRedis Client', err);
});*/

const IORedis = require('app/lib/ioredis');
let writerRedisOpts = {keyPrefix:"chat", password: AppConfig.redis.password};
let readerRedisOts = {keyPrefix:"chat", password: AppConfig.redis.password, return_buffers: true};
//TODO
//let chanel = 'rooms';
let chanel = 'chats';

module.exports = function(http, app)
{
	const io = require('socket.io')(http);

	//TODO io.origins('192.168.0.91:*')
	/*io.origins('*:*')
		.use(function(socket, next)
		{
			Session(socket.handshake, {}, next);
		})
	.use(function(socket, next)
	{
		//TODO обработать ситуацию здесь, и еще при получении сообщений от клиента!!!
		if (app.get(AppConfig.server_closing))
		{
			let error = new Error('error:serverShutingDown');
			return next(error);
		}
		return next();
	})
	.use(function(socket, next)
	{
		return next();

		//return next(new Error('error:authentication'));

		console.log('socket.handshake.session:');
		Logger.debug(socket.handshake.session);
		console.log('END socket.handshake.session:');

		if(!socket.handshake.session.rtid)
		{
			let error = new Error('error:authentication');

			return next(error);

		}
		return next();
	}).on('error', function(err)
	{
		Logger.debug('RA');
		Logger.error(err);
	})
	.on('disconnect', function(socket)
	{
		//show disconnect from session
		Logger.debug(socket);
		Logger.info('Socket  disconnected from "/"');

	});*/

	/*io.on('connection', function(socket){

		console.log('someone connected to "/"');

		socket.on('disconnect', function(){ });
	});*/

//	return io;
	let opts =  {
		"force new connection" : true,
		"reconnection": true,
		"reconnectionDelay": 2000,                  //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
		"reconnectionDelayMax" : 60000,             //1 minute maximum delay between connections
		"reconnectionAttempts": "Infinity",         //to prevent dead clients, having the user to having to manually reconnect after a server restart.
		"timeout" : 10000,                           //before connect_error and connect_timeout are emitted.
		"transports" : ["websocket", 'polling']                //forces the transport to be only websocket. Server needs to be setup as well/
	};
	let nsp = io.origins('*:*', opts).of('/'+chanel);
	nsp
	.use(function(socket, next)
	{
		Session(socket.handshake, {}, next);
	})
	.use(function (socket, next)
	{
		console.log('.use(function (socket, next)');
		//console.log(socket);

		//return next(new Error('error:authentication'));

		//console.log('socket.handshake.session:');
		Logger.debug(socket.handshake.session);
		//console.log('END socket.handshake.session:');

		if(!socket.handshake.session.rtid)
		{
			//let error = new Error('error:authentication');
			let error = new Error('error:authentication');

			return next(error);

		}
		return next();
	});
	nsp.on('connection', function(socket){

		console.log('nsp.on connection');
		//console.log(socket);

		let readerRedis = new IORedis(readerRedisOts);
		readerRedis.on('error', function(err)
		{
			Logger.error('readerRedis Client', err);
		});

		let writerRedis = new IORedis(writerRedisOpts);
		writerRedis.on('error', function(err){
			Logger.error('writerRedis Client', err);
		});

		socket.on('error', function _socketOnError(err){

			//if (err) socket.emit('error', err);
			Logger.error(err);
		});
		
		socket.on('chat:error:auth', function(data, cb)
		{
			//ансабскрайб ?? от редиса
			Logger.debug('chat:error:auth');
			Logger.debug(data);
			cb && cb();
		});
		
		socket.on('disconnect', function(msg){

			console.log('msg =', msg);
			return readerRedis
				.unsubscribe(chanel)
				.then(function ()
				{
					readerRedis.removeListener('readerRedis', _messageBuffer);

					return readerRedis.quit()
					.then(function ()
					{
						Logger.info('readerRedis.unsubscribe ');

						Logger.info('Socket  disconnected from "/'+chanel+'"');//это срабатывает... может быть тут надо будет вызывать событие leave()...?
						return Promise.resolve();
					});
				})
				.then(function ()
				{
					return writerRedis.quit();
				})
				.catch(function (err)
				{
					if (err)
						Logger.error(err);
				});
		});

		socket.on('chat:user:connected', function (data)
		{
			console.log('someone connected to "/'+chanel+'"');
			Logger.info('chat:user:connected');
			console.log( '');

			//TODO можно ли проверять, что уже подписаны на канал?!!!
			readerRedis.subscribe(chanel, function(err, count)
			{
				if (err)
					return socket.emit('error', err);

				console.log('on readerRedis.subscribe count = ', count);
				writerRedis.publish(chanel, msgpack.encode(data));

				console.log({rooms: socket.rooms, socket_id: socket.id});
				/*

				{ rooms: { '/chats#gaYP1QcXV3jfS3B1AAAA': '/chats#gaYP1QcXV3jfS3B1AAAA' },
					socket_id: '/chats#gaYP1QcXV3jfS3B1AAAA' }


				*/

			});
			
			//writerRedis.publish(chanel, msgpack.encode(data));
		});

		//отправили сообщение в чате
		socket.on('chat:msg:send', function (data, cb)
		{
			/*
			 TODO название канала/комнаты chanel/room надо будет передавать в сообщении?!
			 перед publish сообщения проверять права пользователя, может ли он сюда писать... и так далее...
			 */
			writerRedis.publish(chanel, msgpack.encode(data));
			cb(true);
		});

		function _messageBuffer(channel, message)
		{
			//переслали сообщение в чат (канал) через редис потом на клиента
			let msg = msgpack.decode(message);
			console.log('');
			console.info('channel: %s, msg: %j', channel, msg);
			//Logger.info(msg);
			socket.emit('chat:msg:get', msg);
		}
		//readerRedis.on('message', function (channel, message) {
		//readerRedis.on('messageBuffer', _messageBuffer);
		readerRedis.addListener('messageBuffer', _messageBuffer);
	})
	.on('error', function (err)
	{
		Logger.info("nsp.on('error'");
		Logger.debug(err);
	});
	
	/*
	 sub.subscribe(prefix + '#' + nsp.name + '#', function(err){
	 if (err) self.emit('error', err);
	 });
	*/
	
	//nsp.emit('hi', 'everyone!');
	return io;
};