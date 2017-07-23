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
const SocketIO = require('socket.io');

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

class Messenger extends SocketIO
{
	onConnect(socket)
	{
		Logger.info('---------------- onConnect');
		Logger.info('on connect! socket.id = ', socket.id);
		
		socket.on('disconnect', ()=>
		{
			Logger.info('---------------- onDisconnect socket');
			//Logger.info(arguments);
			Logger.info('socket.id = ', socket.id);
		});
		
		socket.on('error', (err)=>
		{
			Logger.error(err);
			
			//this.to(socket.id).emit('error', err);
			socket.to(socket.id).emit('error', err);
			//socket.disconnect();
		});
		
		/*
		 TODO пока закрою - одно соединение контролирую на клиенте
		 let rtid = CookieParser.signedCookie(socket.id, AppConfig.session.secret);
		 
		 //Logger.info({'rtid': rtid});
		 
		 if (!rtid)
		 socket.emit('error', new Errors.HttpError(401));*/
	}
	onConnection(socket)
	{
		Logger.info('---------------- onConnection');
		
		// sending to the client
		socket.emit('message', 'can you hear me?', 1, 2, 'abc');
		
		//sending to all clients except sender
		//socket.broadcast.emit('broadcast', 'hello friends!');
		
		//FIXME это просто для треинировки
		socket.emit(`room:list`, rooms);
		
		//socket.join();
		
		/**
		 * получам сообщение от клиента
		 * отправляем остальным
		 * 
		 * TODO надо делать или на комантах или на неймспейсах + комнаты
		 */
		socket.on('userMessage', (data, cb)=>
		{
			Logger.info('socket.on userMessage, ', data);
			cb && cb(true);
			
			//отправили сообщение всем в NSP ('/') кроме отправителя
			socket.broadcast.emit('userMessage', data);
		});
		
		this.of('/').adapter.clients((err, clients) =>
		{
			console.log('adapter.clients: ', clients); // an array containing all connected socket ids
		});
	}
	appLogout(sid)
	{
		let socketId= [];
		for (let i in this.sockets.sockets)
		{
			if (this.sockets.sockets[i].handshake.sessionID != sid)
				continue;
			
			socketId.push(i);
		}
		
		//Logger.info({'socketId': socketId});
		if (!socketId.length)
			return;
		
		//потому что при открытии в новой вкладке создается новое подключение - новоый сокет ид
		socketId.forEach((id)=>
		{
			//Logger.info( `in ${__filename}: socketId =`, id);
			this.to(id).emit('app_logout');
		});
	}
}

module.exports = function(httpServer)
{
	let opts =  {
		//"force new connection" : true,
		'forceNew': false, //will create one for all connections
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
	
	const Msgr = new Messenger(httpServer);
	
	Msgr.adapter(SioRedis({
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
	.on('connect', Msgr.onConnect.bind(Msgr))
	.on('connection', Msgr.onConnection.bind(Msgr))
	;
	
	/*Msgr.of('/').adapter.on('error', function onErrorIoOf_Adapter()
	{
		console.log('onErrorIoOf_Adapter on error');
		Logger.error(err);
	});*/
	
	/*
	 TODO пока закрою - одно соединение контролирую на клиенте
	Msgr.engine.generateId = (req) => 
	{
		//Logger.info('---------------- Msgr.engine.generateId');
		
		let rtid = Cookie.parse(req.headers.cookie)['rtid']||0;
		//rtid = ''; //для тестов
		return rtid; // custom id must be unique
	};*/
	
	return Msgr;
};