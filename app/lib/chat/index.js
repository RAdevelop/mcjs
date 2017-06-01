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

const SocketIO = require('socket.io');
const IORedis = require('app/lib/ioredis');

let writerRedisOpts = {keyPrefix:"chat", connectionName: 'ChatWriter'};
//writerRedisOpts.connectionName += `[user_${socket._user['u_id']}]`;
writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);

let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: 'ChatReader'};
//readerRedisOts.connectionName += `[user_${socket._user['u_id']}]`;
readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);

const pub = IORedis(writerRedisOpts);
pub.on('error', (err)=>
{
	Logger.error(err);
});

const sub = IORedis(readerRedisOts);
sub.on('error', (err)=>
{
	Logger.error(err);
});

let opts =  {
	//"origins": "localhost:3000",
	"origins": "*:*",
	"force new connection" : true,
	"reconnection": true,
	"reconnectionDelay": 2000,                  //starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
	"reconnectionDelayMax" : 60000,             //1 minute maximum delay between connections
	"reconnectionAttempts": "Infinity",         //to prevent dead clients, having the user to having to manually reconnect after a server restart.
	"timeout" : 10000                         //before connect_error and connect_timeout are emitted.
	,"transports" : ['polling', 'websocket']                //forces the transport to be only websocket. Server needs to be setup as well/
};

class Messenger extends SocketIO
{
	constructor(server, app)
	{
		super(server, opts);
		
		this.of('/', function (socket)
		{
			console.log('on connect! socket.id = ', socket.id);
		})
		.on('error', (err)=>
		{
			console.log('io on error');
			Logger.error(err);
		})
		.use((socket, next)=>
		{
			Session(socket.handshake, {}, next);
		})
		.use((socket, next)=>
		{
			//console.log(socket);
			
			
			if(!socket.handshake.session.rtid || !socket.handshake.session.hasOwnProperty('user') || !socket.handshake.session['user']['u_id'])
			{
				//let error = new Error('error:authentication');
				let error = new Error('error:authentication');
				
				return next(error);
			}
			let user = socket.handshake.session['user'];
			//console.log('user = ', user);
			//socket._user = socket.handshake.session['user'];
			//let user = socket.handshake.session['user'];
			
			
			return next();
		});
	}
	
	setSocket(socket)
	{
		this._socket = socket;
		return this;
	}
	getSocket()
	{
		return this._socket;
	}
	
	emit(eventName, eventData)
	{
		this.getSocket().emit(eventName, eventData);
	}
	
	getUser()
	{
		return this._socket.handshake.session['user'];
	}
	
	/**
	 * 
	 * @param data - данные, полученные от "клиента"
	 * @param cb - колбэк ф-ция. если указана, то вызывается - работает на строне клиента
	 */
	join(data, cb)
	{
		console.log('someone join to: ', data);
		console.log('this.getUser(): ', this.getUser());
		this.emit('join', this.getUser());
		
		
		/*
		 если на клиенте указана ф-ция вот так:
		 chat.emit('join', sendData, function cb(respData){//do something});
		 */
		cb && cb('RAAD'); //RAAD - вернется на клиентскую часть
	}
	
	disconnect(msg)
	{
		console.log('server: socket on disconnect');
		console.log('msg = ', msg);
		console.log('1) socket.id = ', this.getSocket().id);
		/*io.of('/').adapter.remoteDisconnect(socket.id, true, (err)=>
		 {
		 console.log('2) socket.id = ', socket.id);
		 
		 if (err)
		 {
		 Logger.error(err);
		 }
		 // success
		 });*/
	}
}


module.exports = function(server, app)
{
	const io = new Messenger(server);
	//console.log(io);
	
	/*
	как-то надо отслежвать кол-во "комант", в которым подключился юзер
	и отмечать, какая из них активная в данный момент. чтобы в активную комнату "показывать" сообщения,
	а в остальных, например, увеличивать счетчик новых сообщений...
	 */
	
	io.on('connection', (socket)=>
	{
		io.setSocket(socket);
		console.log('on connection');
		//console.log(this);
		//console.log(this.server instanceof Messenger); //Messenger
		//console.log('io.getUser = ', io.getUser() );
		
		console.log('\n------------------------------------------------\n');
		//console.log(socket);
		
		socket.on('join', io.join.bind(io));
		socket.on('disconnect', io.disconnect.bind(io));
	});
	
	return io;
};