"use strict";
const Cookie = require('app/lib/cookie');
const CtrlMain = require('app/lib/controller');
const Logger = require('app/lib/logger');

const EventEmitter = require('events');

class Logout extends CtrlMain
{
	/**
	 *
	 * @returns {Promise}
	 */
	indexActionPost()
	{
		if(this.getReq().signedCookies.rtid)
			Cookie.clearUserId(this.getReq(), this.getRes());
		
		let sid = this.getReq().session.id;
		
		return new Promise((resolve, reject)=>
		{
			this.getReq().session.destroy((err) =>
			{
				this._logoutMessenger(sid);
				
				if(err)
				{
					delete this.getReq().session;
					return reject(err);
				}
				
				this.getRes().redirect('/login');
			});
		});
	}
	
	/**
	 * сообщение через socket.io в браузер клиента
	 * @param string sid - id сессии app
	 * @private
	 */
	_logoutMessenger(sid)
	{
		//TODO надо тестировать!!!
		process.nextTick(()=>
		{
			let SocketIO = this.getReq().app.get('messenger');
			SocketIO.appLogout(sid);
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Logout;
