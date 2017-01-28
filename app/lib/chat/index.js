/**
 * Created by RA on 29.11.2015.
 */
"use strict";
	
const AppConfig = require('app/config');
const Promise = require("bluebird");
const Session = require('app/middlewares/session');
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');

//TODO проверить работу StringDecoder https://nodejs.org/dist/latest-v4.x/docs/api/string_decoder.html
const msgpack = require('msgpack-js');


const IORedis = require('app/lib/ioredis');

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
	nsp._users = new WeakMap();
	nsp
	.use((socket, next)=>
	{
		Session(socket.handshake, {}, next);
	})
	.use((socket, next)=>
	{
		//console.log('.use(function (socket, next)');
		//console.log(socket);

		//return next(new Error('error:authentication'));

		//console.log('socket.handshake.session:');
		//Logger.debug(socket.handshake.session);
		//console.log('END socket.handshake.session:');

		if(!socket.handshake.session.rtid || !socket.handshake.session.hasOwnProperty('user') || !socket.handshake.session['user']['u_id'])
		{
			//let error = new Error('error:authentication');
			let error = new Error('error:authentication');

			return next(error);
		}
		socket._user = socket.handshake.session['user'];
		//let user = socket.handshake.session['user'];

		let writerRedisOpts = {keyPrefix:"chat", connectionName: 'ChatWriter'};
		writerRedisOpts.connectionName += `[user_${socket._user['u_id']}]`;
		writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);

		let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: 'ChatReader'};
		readerRedisOts.connectionName += `[user_${socket._user['u_id']}]`;
		readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);

		if (!nsp._users.has(socket._user))
		nsp._users.set(socket._user, {reader: IORedis(readerRedisOts), writer: IORedis(writerRedisOpts)});

		return next();
	});
	nsp.getReader = function(user)
	{
		return nsp._users.get(user).reader;
	};
	nsp.getWriter = function(user)
	{
		return nsp._users.get(user).writer;
	};
	nsp.on('connection', (socket)=>
	{
		function _messageBuffer(channel, message)
		{
			//переслали сообщение в чат (канал) через редис потом на клиента
			let msg = {};
			msg['text'] = msgpack.decode(message);

			//TODO переделать, брать не из socket._user, а из хранилища (Редис или БД по u_id)
			//а в вызовы .publish добавить передачу u_id. и на клиенте тоже - надо с клюента сюда передавать u_id
			msg['from'] = {user: socket._user};

			socket.emit('chat:msg:get', msg);
		}

		//console.log('nsp.on connection, socket.id = ', socket.id);
		//console.log(socket);

		//readerRedis.on('message', function (channel, message) {
		//readerRedis.on('messageBuffer', _messageBuffer);
		nsp.getReader(socket._user).addListener('messageBuffer', _messageBuffer);

		socket.on('error', function _socketOnError(err)
		{
			if (err) socket.emit('error', err);

			console.log("socket.on('error', function _socketOnError(err)");
			Logger.error(err);
			console.log("END socket.on('error', function _socketOnError(err)");
		});
		
		socket.on('chat:error:auth', (data, cb)=>
		{
			//ансабскрайб ?? от редиса
			Logger.debug('chat:error:auth');
			Logger.debug(data);
			cb && cb();
		});
		
		socket.on('disconnect', (msg)=>
		{
			console.log('msg =', msg);

			return nsp.getReader(socket._user).unsubscribe(chanel)
				.then(()=>
				{
					return nsp.getReader(socket._user).quit()
					.then(()=>
					{
						Logger.info('readerRedis.unsubscribe ');

						//это срабатывает... может быть тут надо будет вызывать событие leave()...?
						Logger.info('Socket  disconnected from "/'+chanel+'"');
						return Promise.resolve();
					});
				})
				.then(()=>
				{
					nsp.getReader(socket._user).removeListener('messageBuffer', _messageBuffer);
					nsp.getWriter(socket._user).quit();

					socket._user = null;
					return Promise.resolve();
				})
				.catch((err)=>
				{
					Logger.debug('START on disconnect error');
					Logger.error(err);
					Logger.debug('END on disconnect error');
				});
		});

		socket.on('chat:user:connected', (data)=>
		{
			console.log('someone connected to "/'+chanel+'"');
			//console.log('data: ', data);
			//console.log( '');

			//TODO можно ли проверять, что уже подписаны на канал?!!!

			//return readerRedis.subscribe(chanel)
			return nsp.getReader(socket._user).subscribe(chanel)
				.then((count)=>
				{
					//console.log('on readerRedis.subscribe count = ', count);
					return nsp.getWriter(socket._user)
						.publish(chanel, msgpack.encode('connected'));

					//console.log({rooms: socket.rooms, socket_id: socket.id});
				})
				.catch((err)=>
				{
					socket.emit('error', err);
					console.log('error on return readerRedis.subscribe(chanel)');
					Logger.error(err);
				});
		});

		//отправили сообщение в чате
		socket.on('chat:msg:send', (data, cb)=>
		{
			/*
			 TODO название канала/комнаты chanel/room надо будет передавать в сообщении?!
			 перед publish сообщения проверять права пользователя, может ли он сюда писать... и так далее...
			 */
			nsp.getWriter(socket._user).publish(chanel, msgpack.encode(data));
			cb(true);
		});
	})
	.on('error', (err)=>
	{
		Logger.debug("nsp.on('error'");
		Logger.error(err);
	});
	
	/*
	 sub.subscribe(prefix + '#' + nsp.name + '#', function(err){
	 if (err) self.emit('error', err);
	 });
	*/
	
	//nsp.emit('hi', 'everyone!');
	return io;
};