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
const CookieParser = require('cookie-parser'); //AppConfig.session.secret
const Cookie = require('cookie'); //AppConfig.session.secret

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

//TODO список комнат/чатов потом перенести в БД и редис
let rooms = [
	{
		id: 1,
		name: `room1`,
		user_count: 0
	},
	{
		id: 2,
		name: `room2`,
		user_count: 0
	},
	{
		id: 3,
		name: `room3`,
		user_count: 0
	}
];

function loadSession(socket, cb)
{
	//console.log(socket);
	
	//console.log('socket.handshake.session:');
	//Logger.debug(socket.handshake.session);
	//console.log('END socket.handshake.session:');
	
	//TODO сделать проверку, что пользователь разлогинился. см видео Илья Контор!
	/*Session(socket.handshake, {}, function(err, data)
	{
		Logger.debug({});
		Logger.info({data: data});
		
		cb && cb();
	});*/
	if(!socket.handshake.session.rtid || !socket.handshake.session.hasOwnProperty('user') || !socket.handshake.session['user']['u_id'])
	{
		return cb(new Errors.HttpError(401));
	}
	
	socket._user = socket.handshake.session['user'];
	Logger.info(socket.handshake.session);
	return cb();
}

module.exports = function(httpServer, app)
{
	let opts =  {
		//"force new connection" : true,
		'forceNew': false,
		'reconnection': true,
		'reconnectionDelay': 2000,                  //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
		'reconnectionDelayMax' : 60000,             //1 minute maximum delay between connections
		//'reconnectionAttempts': 'Infinity',         //to prevent dead clients, having the user to having to manually reconnect after a server restart.
		'timeout' : 10000                           //before connect_error and connect_timeout are emitted.
		,'transports' : ['polling', 'websocket']                //forces the transport to be only websocket. Server needs to be setup as well/
	};
	
	let writerRedisOpts = {keyPrefix:"chat", connectionName: `writer`};
	writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);
	
	let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: `reader`};
	readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);
	
	const io = require('socket.io')(httpServer);
	
	io.adapter(SioRedis({
		host: AppConfig.redis.host
		, port: AppConfig.redis.port
		, pubClient: IORedis(readerRedisOts)
		, subClient: IORedis(writerRedisOpts)
	}))
	.origins('*:*', opts)
	/*.of('/', (socket)=>
	{
		console.log('---------------- .of /, socket');
		console.log('on connect! socket.id = ', socket.id);
	})*/
	.use(function(socket, next)
	{
		Session(socket.handshake, {}, next);
	})
	.use(function(socket, next)
	{
		if(!socket.handshake.session || !socket.handshake.session.hasOwnProperty('rtid') || !socket.handshake.session.hasOwnProperty('user') || !socket.handshake.session['user']['u_id'])
		{
			//если тут вызвать:
			//socket.disconnect();
			// то будет сообщение на клиентской части "failed: WebSocket is closed before the connection is established"
			return next(new Errors.HttpError(401));
		}
		
		socket._user = socket.handshake.session['user'];
		//Logger.info(socket._user);
		Logger.info({'socket.handshake.session.id':socket.handshake.session.id});
		return next();
	})
	.on('error', function(err)
	{
		console.log('io on error');
		Logger.error(err);
	})
	.on('connect', onConnect)
	.on('connection', onConnection)
	;
	
	io.of('/').adapter.on('error', function onErrorIoOf_Adapter()
	{
		console.log('onErrorIoOf_Adapter on error');
		Logger.error(err);
	});
	
	/*
	 TODO пока закрою - одно соединение контролирую на клиенте
	io.engine.generateId = (req) => 
	{
		//Logger.info('---------------- io.engine.generateId');
		
		let rtid = Cookie.parse(req.headers.cookie)['rtid']||0;
		//rtid = ''; //для тестов
		return rtid; // custom id must be unique
	};*/
	
	function onConnect(socket)
	{
		Logger.info('---------------- onConnect');
		Logger.info('on connect! socket.id = ', socket.id);
		
		socket.on('disconnect', function onDisconnect()
		{
			Logger.info('---------------- onDisconnect socket');
			Logger.info(arguments);
			Logger.info('socket.id = ', socket.id);
		});
		
		socket.on('error', function _socketOnError(err)
		{
			Logger.error(err);
			
			io.to(socket.id).emit('error', err);
			//socket.disconnect();
		});
		
		/*
		TODO пока закрою - одно соединение контролирую на клиенте
		let rtid = CookieParser.signedCookie(socket.id, AppConfig.session.secret);
		
		//Logger.info({'rtid': rtid});
		
		if (!rtid)
			socket.emit('error', new Errors.HttpError(401));*/
	}
	
	function onConnection(socket)
	{
		Logger.info('---------------- onConnection');
		
		// sending to the client
		socket.emit('message', 'can you hear me?', 1, 2, 'abc');
		
		//sending to all clients except sender
		//socket.broadcast.emit('broadcast', 'hello friends!');
		
		
		//это просто для треинировки
		socket.emit(`room:list`, rooms);
		
		//socket.join();
		
		socket.on('roomMessage', function _onRoomMessage(data, cb)
		{
			Logger.info('socket.on roomMessage, ', data);
			cb && cb(true);
		});
		
		/*socket.on('logout', function onLogout(args)
		{
			Logger.info('socket.on logout');
			Logger.info(arguments);
		});*/
		
		/*socket.on('disconnect', function onDisconnect()
		{
			Logger.info('socket.on disconnect');
			Logger.info(arguments);
		});*/
	}
	
	return io;
};