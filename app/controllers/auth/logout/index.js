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
		
		let self = this;
		
		return new Promise(function (resolve, reject)
		{
			self.getReq().session.destroy(function(err)
			{
				if(err)
					return reject(err);

				delete self.getReq().session;
				self.getRes().redirect('/login');
			});
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Logout;
