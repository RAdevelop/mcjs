"use strict";
const Cookie = require('app/lib/cookie');
const Base = require('app/lib/controller');

class Logout extends Base
{
	/**
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionPost(cb)
	{
		if(this.getReq().signedCookies.rtid)
		Cookie.clearUserId(this.getReq(), this.getRes());
		
		let self = this;
		
		this.getReq().session.destroy(function(err)
		{
			if(err) return cb(err);
			return self.getRes().redirect('/login');
		});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Logout;
