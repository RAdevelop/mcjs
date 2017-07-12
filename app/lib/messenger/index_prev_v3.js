/**
 * Created by RA on 29.11.2015.
 */
"use strict";

const AppConfig = require('app/config');
const Promise = require("bluebird");
const Session = require('app/middlewares/session');
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const SioRedis = require('socket.io-redis');

//TODO проверить работу StringDecoder https://nodejs.org/dist/latest-v4.x/docs/api/string_decoder.html
const msgpack = require('msgpack-js');


const IORedis = require('app/lib/ioredis');

//для операций, не связанныхс pub/sub
const Rediska = IORedis(AppConfig.redis);
Rediska.on('error', (err)=>
{
	Logger.error(err);
});


/*
 https://socket.io/docs/emit-cheatsheet/
 */

//TODO
//let chanel = 'rooms';
let chanel = 'chats';
chanel = '';

module.exports = function(http, app)
{
	const io = require('socket.io')(http);
	
	//	return io;
	let opts =  {
		"force new connection" : true,
		"reconnection": true,
		"reconnectionDelay": 2000,                  //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
		"reconnectionDelayMax" : 60000,             //1 minute maximum delay between connections
		"reconnectionAttempts": "Infinity",         //to prevent dead clients, having the user to having to manually reconnect after a server restart.
		"timeout" : 10000                         //before connect_error and connect_timeout are emitted.
		,"transports" : ['polling', 'websocket']                //forces the transport to be only websocket. Server needs to be setup as well/
	};
	
	let writerRedisOpts = {keyPrefix:"chat", connectionName: `writer`};
	writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);
	
	let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: `reader`};
	readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);
	
	io
	.adapter(SioRedis({
		host: AppConfig.redis.host, port: AppConfig.redis.port
		, pubClient: IORedis(readerRedisOts)
		, subClient: IORedis(writerRedisOpts)
	}))
	.origins('*:*', opts).of('/'+chanel, (socket)=>
	{
		console.log('----------------');
		console.log('on connect! socket.id = ', socket.id);
	})
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
			return next(new Errors.HttpError(401));
		}
		
		//socket._user = socket.handshake.session['user'];
		Logger.info(socket._user);
		return next();
	})
	.on('error', (err)=>
	{
		console.log('io on error');
		Logger.error(err);
	})
	.on('connect', onConnect)
	.on('connection', onConnection)
	;
	
	function onConnect(socket)
	{
		Logger.info('onConnect');
		// sending to the client
		socket.emit('message', 'can you hear me?', 1, 2, 'abc');
		
		//sending to all clients except sender
		//socket.broadcast.emit('broadcast', 'hello friends!');
	}
	
	function onConnection(socket)
	{
		Logger.info('onConnection');
		return;
		io.of('/').adapter.clients(function (err, clients)
		{
			console.log('--------');
			if (err)
				Logger.error(err);
			
			Logger.info('an array containing all connected socket ids'); 
			Logger.info(clients);
			
		});
		
		io.of('/').adapter.clients(['room1', 'room2'], function (err, clients)
		{
			console.log('--------');
			if (err)
				Logger.error(err);
			
			Logger.info("an array containing socket ids in 'room1' and/or 'room2'");
			Logger.info(clients);
		});
		
		io.in('room3').clients(function (err, clients)
		{
			console.log('--------');
			if (err)
				Logger.error(err);
			
			Logger.info("an array containing socket ids in 'room3'");
			Logger.info(clients);
		});
		
		io.of('/').adapter.clientRooms(socket.id, function (err, rooms)
		{
			console.log('--------');
			if (err)
				Logger.error(err);
			
			Logger.info('an array containing every room a given id has joined');
			Logger.info(rooms);
		});
		
		io.of('/').adapter.allRooms(function (err, rooms)
		{
			console.log('-------');
			if (err)
				Logger.error(err);
			
			Logger.info('an array containing all rooms (accross every node)');
			Logger.info(rooms);
		});
		
		io.of('/').adapter.remoteJoin(socket.id, 'room1', function (err) 
		{
			console.log('-------');
			if (err)
				Logger.error(err);
			
			Logger.info('success remoteJoin');
		});
		
		io.of('/').adapter.remoteLeave(socket.id, 'room1', function (err) 
		{
			console.log('-------');
			if (err)
				Logger.error(err);
			
			Logger.info('success remoteLeave');
		});
		
		/*io.of('/').adapter.remoteDisconnect(socket.id, true, function (err)
		{
			console.log('-------');
			if (err)
				Logger.error(err);
			
			//Logger.info(socket.id);
			Logger.info('success remoteDisconnect');
		});*/
		
		
		
		// on every node
		io.of('/').adapter.customHook = function (data, cb)
		{
			cb('hello ' + data);
		};
		
		// then
		io.of('/').adapter.customRequest('john', function(err, replies)
		{
			console.log('-------');
			if (err)
				Logger.error(err);
			
			Logger.info("an array ['hello john', ...] with one element per node");
			Logger.info(replies);
		});
	}
	
	return io;
};