"use strict";
const Cookie = require('app/lib/cookie');
const CtrlMain = require('app/lib/controller');

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
		
		return new Promise((resolve, reject)=>
		{
			this.getReq().session.destroy((err) =>
			{
				if(err)
					return reject(err);

				delete this.getReq().session;
				this.getRes().redirect('/login');
			});
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Logout;
