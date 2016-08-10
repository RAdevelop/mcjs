"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const Path = require('path');

const User = require('app/class/user');

class Profile extends User
{
	/**
	 * получаем фотографию профиля пользователя
	 *
	 * @param u_id
	 * @returns {*}
	 */
	getUserAva(u_id)
	{
		return this.model('user/photo').getUserAva(u_id)
			.then(function (ava)
			{
				ava["previews"] = [];
				if (!ava || !ava["ai_id"])
					return Promise.resolve(ava);

				let sizeParams = FileUpload.getUploadConfig('user_ava').sizeParams;

				sizeParams.forEach(function (item)
				{
					ava["previews"][item.w+'_'+item.h] = ava["ai_dir"]+'/'+item.w+'_'+item.h+'.jpg';
				});

				//console.log(ava);

				return Promise.resolve(ava);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Profile;