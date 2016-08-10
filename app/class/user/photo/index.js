"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const FileErrors = require('app/lib/file/errors');
const FileUpload = require('app/lib/file/upload');
const Crypto = require('crypto');
const Path = require('path');
const User = require('app/class/user');

class UserPhoto extends User
{
	getAlbumUri(a_id)
	{
		return Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
		//return 'part_' + Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
	}

	getImageUri(a_id, ai_id)
	{
		return this.getAlbumUri(a_id) + '/' + ai_id + '/' + Crypto.createHash('md5').update(a_id+''+ai_id).digest("hex");
		//return 'part_' + Math.floor(Math.abs(a_id)/20000) + '/' + a_id;
	}

	/**
	 * создаем именованный фотоальбом пользователю
	 * 
	 * @param u_id
	 * @param a_name
	 * @param a_text
	 * @returns {*}
	 */
	addNamedAlbum(u_id, a_name, a_text)
	{
		return this.model('user/photo').createAlbumNamed(u_id, a_name, a_text);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = UserPhoto;