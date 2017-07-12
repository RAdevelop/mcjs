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

//для операций, не связанныхс pub/sub
const Rediska = IORedis(AppConfig.redis);
Rediska.on('error', (err)=>
{
	Logger.error(err);
});


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
	
	let nsp = io.origins('*:*', opts).of('/'+chanel, (socket)=>
	{
		console.log('----------------');
		console.log('on connect! socket.id = ', socket.id);
	})
	.on('error', (err)=>
	{
		console.log('io on error');
		Logger.error(err);
	});
	
	
	nsp._rw = new WeakMap();
	nsp
	.use((socket, next)=>
	{
		Session(socket.handshake, {}, next);
	})
	.use((socket, next)=>
	{
		if(!socket.handshake.session.rtid || !socket.handshake.session.hasOwnProperty('user') || !socket.handshake.session['user']['u_id'])
		{
			//let error = new Error('error:authentication');
			let error = new Error('error:authentication');
			
			return next(error);
		}
		socket._user = socket.handshake.session['user'];
		
		nsp.setSocket(socket);
		
		return next();
	});
	nsp.setSocket = function(socket)
	{
		this._socket = socket;
		return this;
	};
	nsp.delSocket = function()
	{
		this._socket = null;
		return this;
	};
	nsp.getSocket = function()
	{
		return this._socket;
	};
	nsp.user = function(field = null)
	{
		if (field && this._socket['_user'].hasOwnProperty(field))
			return this._socket['_user'][field];
		
		return this._socket['_user'];
	};
	nsp._msgData = function(str)
	{
		return {
			m:str,
			u: {
				id: this.user('u_id'),
				n: this.user('u_display_name'),
				ava: (this.user('previews')['50_50'] ? this.user('previews')['50_50'] : '/_0.gif')
			}
		};
	};
	/*nsp._messageBuffer = function(channel, message)
	 {
	 Logger.info('nsp._messageBuffer:');
	 //Logger.info(msgpack.decode(channel));
	 //переслали сообщение в чат (канал) через редис потом на клиента
	 let msg = {};
	 msg['text'] = msgpack.decode(message);
	 
	 //TODO переделать, брать не из socket._user, а из хранилища (Редис или БД по u_id)
	 //а в вызовы .publish добавить передачу u_id. и на клиенте тоже - надо с клюента сюда передавать u_id
	 msg['from'] = {user: nsp.getSocket()._user};
	 
	 /!*
	 FIXME проверить. скорее всего вот эта хрень дважды шлет сообщение.
	 так как сокет скорее всего перезаписывается другим пользователем...
	 
	 возможно стоит хранить ссылки на пользователя через socked.id:
	 WeakMap????
	 {
	 socked.id: userData
	 }
	 *!/
	 //nsp.getSocket().emit('message', msg);
	 
	 Logger.info(nsp.getRW(nsp.getSocket()).socket._user['u_id']);
	 
	 nsp.getRW(nsp.getSocket()).socket.emit('message', msg);
	 //nsp.getRW(nsp.getSocket()).socket.broadcast.emit('message', msg);
	 };*/
	nsp.getRW = function(socket)
	{
		if (!this._rw.has(socket._user))
		{
			let writerRedisOpts = {keyPrefix:"chat", connectionName: `writer:u:${socket._user['u_id']}`};
			writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);
			
			let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: `reader:u:${socket._user['u_id']}`};
			readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);
			
			this._rw.set(socket._user, {
				reader: IORedis(readerRedisOts),
				writer: IORedis(writerRedisOpts),
				socket: socket
			});
			
			this._rw.get(socket._user).reader
			.on('error', (err)=>
			{
				Logger.debug('on error this._rw.get(user).reader');
				Logger.error(err);
			});
			//this._rw.get(socket._user).reader.addListener('messageBuffer', this._messageBuffer);
			
			this._rw.get(socket._user).writer
			.on('error', (err)=>
			{
				Logger.debug('on error this._rw.get(user).writer');
				Logger.error(err);
			});
		}
		
		return this._rw.get(socket._user);
	};
	nsp.reader = function(socket)
	{
		return nsp.getRW(socket).reader;
	};
	nsp.writer = function(socket)
	{
		return nsp.getRW(socket).writer;
	};
	nsp.on('connection', (socket)=>
	{
		//Logger.info(socket);
		
		function _messageBuffer(channel, message)
		{
			//channel = msgpack.decode(channel);
			message = msgpack.decode(message);
			
			//переслали сообщение в чат (канал) через редис потом на клиента
			//let msg = {};
			//msg['text'] = msgpack.decode(message);
			
			//TODO переделать, брать не из socket._user, а из хранилища (Редис или БД по u_id)
			//а в вызовы .publish добавить передачу u_id. и на клиенте тоже - надо с клюента сюда передавать u_id
			//msg['from'] = {user: socket._user};
			
			//socket.broadcast.emit('message', message);
			socket.emit('message', message);
		}
		
		//readerRedis.on('message', function (channel, message) {
		//readerRedis.on('messageBuffer', _messageBuffer);
		
		nsp.reader(socket).addListener('messageBuffer', _messageBuffer);
		
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
			console.log('msg =', socket.id);
			
			return nsp.reader(socket).unsubscribe(chanel)
			.then((res)=>
			{
				Logger.info('readerRedis.unsubscribe ');
				Logger.info(res);
				
				//nsp.reader(socket).removeListener('messageBuffer', nsp._messageBuffer);
				nsp.reader(socket).removeListener('messageBuffer', _messageBuffer);
				return nsp.reader(socket).quit()
				.then((res)=>
				{
					Logger.info('readerRedis.quit ');
					Logger.info(res);
					
					//это срабатывает... может быть тут надо будет вызывать событие leave()...?
					Logger.info('Socket  disconnected from "/'+chanel+'"');
					return Promise.resolve();
				});
			})
			.then(()=>
			{
				nsp.writer(socket).quit();
				
				if (nsp._rw.has(socket._user))
				{
					nsp._rw.delete(socket._user);
					//socket._user = null;
				}
				
				return Promise.resolve();
			})
			.catch((err)=>
			{
				Logger.debug('START on disconnect error');
				Logger.error(err);
				Logger.debug('END on disconnect error');
			});
		});
		
		socket.on('join', (data)=>
		{
			console.log(data);
			console.log('someone connected to "/'+chanel+'"');
			//console.log('data: ', data);
			//console.log( '');
			
			//TODO можно ли проверять, что уже подписаны на канал?!!!
			
			//return readerRedis.subscribe(chanel)
			return nsp.reader(socket).subscribe(chanel)
			.then((count)=>
			{
				//count - кол-во каналов, на которые подписано текущее подклбчение редиса (пользователя)
				//console.log('on readerRedis.subscribe count = ', count);
				return nsp.writer(socket)
				.publish(chanel, msgpack.encode(nsp._msgData('connected')));
				
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
			nsp.writer(socket).publish(chanel, msgpack.encode(nsp._msgData(data)));
			cb(true);
		});
	});
	
	return io;
};