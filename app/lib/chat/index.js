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
//const msgpack = require("msgpack-lite");

//const StringDecoder = require('string_decoder').StringDecoder;
//const decoder = new StringDecoder('utf8');

const SocketIO = require('socket.io');
const IORedis = require('app/lib/ioredis');

const Rediska = IORedis(AppConfig.redis); //для операций, не связанныхс pub/sub
Rediska.on('error', (err)=>
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

let tmp_chanel = 'chats';
tmp_chanel = '';

class Messenger extends SocketIO
{
	constructor(server, app)
	{
		super(server, opts);
		
		this._rw = new WeakMap();
		
		this.of('/'+tmp_chanel, (socket)=>
		{
			console.log('----------------');
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
			socket._user = socket.handshake.session['user'];
			//console.log(socket._user);
			return next();
		});
	}
	
	getRW(user)
	{
		if (!this._rw.has(user))
		{
			let writerRedisOpts = {keyPrefix:"chat", connectionName: `writer:u:${user['u_id']}`};
			writerRedisOpts = Object.assign({}, AppConfig.redis, writerRedisOpts);
			
			let readerRedisOts = {keyPrefix:"chat", return_buffers: true, connectionName: `reader:u:${user['u_id']}`};
			readerRedisOts = Object.assign({}, AppConfig.redis, readerRedisOts);
			
			//Logger.info('if (!this._rw.has(user)) ' + user['u_id']);
			
			this._rw.set(user, {reader: IORedis(readerRedisOts), writer: IORedis(writerRedisOpts)});
			this._rw.get(user).reader
			.on('error', (err)=>
			{
				Logger.debug('on error this._rw.get(user).reader');
				Logger.error(err);
			});
			this._rw.get(user).reader.addListener('messageBuffer', this._messageBuffer.bind(this));
			
			this._rw.get(user).writer
			.on('error', (err)=>
			{
				Logger.debug('on error this._rw.get(user).writer');
				Logger.error(err);
			});
		}
		
		return this._rw.get(user);
	}
	
	setSocket(socket)
	{
		socket.on('error', function _socketOnError(err)
		{
			//if (err) socket.emit('error', err);
			
			console.log("setSocket socket.on('error', function _socketOnError(err)");
			Logger.error(err);
			console.log("END setSocket socket.on('error', function _socketOnError(err)");
		});
		
		this._socket = socket;
		return this;
	}
	
	getSocket()
	{
		return this._socket;
	}
	
	get reader()
	{
		//Logger.info('reader this._socket ', this._socket._user);
		return this.getRW(this.user).reader;
	}
	get writer()
	{
		//Logger.info('writer this._socket ', this._socket._user);
		return this.getRW(this.user).writer;
	}
	
	get rediska()
	{
		return Rediska;
	}
	
	emitEvent(eventName, eventData)
	{
		Logger.info('emitEvent(eventName, eventData): ', eventName);
		this.getSocket().emit(eventName, eventData);
		
		//Logger.info('this.getSocket() = ', this.getSocket());
		
		return this;
	}
	
	get user()
	{
		
		//а в вызовы .publish добавить передачу u_id. и на клиенте тоже - надо с клюента сюда передавать u_id
		//return this._socket.handshake.session['user'];
		//TODO переделать, брать не из socket._user, а из хранилища (Редис или БД по u_id)
		
		return this.getSocket()._user;
	}
	
	_msgData(str)
	{
		//TODO u: this.user - сократить передаваемые данные до минимума
		return {m:str, u: {id: this.user['u_id'], n: this.user['u_display_name']}};
	}
	
	/**
	 *
	 * @param string chanel
	 * @param string msg
	 * @returns int the number of clients that received the message
	 * @private
	 */
	_sendTo(chanel, msg)
	{
		return this.writer.publish(chanel, msgpack.encode(this._msgData(msg)));
	}
	
	/**
	 *
	 * @param data - данные, полученные от "клиента"
	 * @param cb - колбэк ф-ция. если указана, то вызывается - работает на строне клиента
	 */
	join(data, cb)
	{
		//console.log(this);
		console.log('someone join to: ', data);
		//console.log('this.user: ', this.user);
		//this.emit('join', this.user);
		
		tmp_chanel = data['chanel']
		return this.reader.subscribe(tmp_chanel)
		.then((count)=>
		{
			console.log('subscribe count = ', count);
			
			//this.emit('join', this.user);
			
			//return this._sendTo(data['chanel'], 'data[\'chanel\'] connected to '+ data['chanel']);
			return this._sendTo(tmp_chanel, 'data[\'chanel\'] connected to '+ data['chanel']);
		})
		.then((cnt_receivers)=>
		{
			console.log('cnt_receivers ', cnt_receivers);
			/*
			 если на клиенте указана ф-ция вот так:
			 chat.emit('join', sendData, function cb(respData){//do something});
			 */
			let msg = `сообщение поличили: ${cnt_receivers} юзеров`;
			cb && cb(msg); //msg - вернется на клиентскую часть
		})
		.catch((err)=>
		{
			console.log('error on return readerRedis.subscribe(chanel)');
			this.emitEvent('error', err);
			//Logger.error(err);
		});
	}
	
	disconnect(msg)
	{
		console.log('server: socket on disconnect');
		console.log('msg = ', msg);
		console.log('1) socket.id = ', this.getSocket().id);
		
		return this.reader.unsubscribe()
		.then(()=>
		{
			//delete
			this.reader.removeListener('messageBuffer', this._messageBuffer); //?  .unbind(this)
			this.reader.quit();
			this.writer.quit();
			
			if (this._rw.has(this.user))
			{
				this._rw.delete(this.user);
			}
		})
		.catch((err)=>
		{
			Logger.debug('on disconnect error');
			Logger.error(err);
		});
		
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
	
	_messageBuffer(channel, message)
	{
		channel = channel.toString();
		message = msgpack.decode(message);
		
		console.log('_messageBuffer channel = ', channel);
		console.log('_messageBuffer message = ', message);
		
		
		//return;
		//переслали сообщение в чат (канал) через редис потом на клиента
		
		this.emitEvent('message', message);
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
		console.log('on connection');
		io.setSocket(socket);
		
		//Logger.info('socket._user = ', socket._user);
		//console.log(this);
		//console.log(this.server instanceof Messenger); //Messenger
		//console.log('io.getUser = ', io.user );
		//console.log(socket);
		
		io.getSocket().on('join', io.join.bind(io));
		io.getSocket().on('disconnect', io.disconnect.bind(io));
	})
	.on('error', (err)=>
	{
		Logger.debug(".on('error'");
		Logger.error(err);
	});
	
	return io;
};