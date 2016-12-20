"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class VideoAlbums extends Base
{
	getVideoAlbumList(u_id, owner_u_id, Pages)
	{
		return this.model('video/albums').countUserVideoAlbums(owner_u_id)
			.then((va_cnt) =>
			{
				Pages.setTotal(va_cnt);

				if (!va_cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					throw new Errors.HttpError(404);

				return this.model('video/albums')
					.getVideoAlbumList(owner_u_id, Pages.getOffset(), Pages.getLimit())
					.then((albums) => {

						//let sizeParams = FileUpload.getUploadConfig('user_photo').sizeParams;

						albums.forEach((album) =>
						{
							album["va_is_owner"] = (owner_u_id == u_id);
							//Object.assign(album, FileUpload.getPreviews(sizeParams, album, "ai_dir")["obj"]);
						});

						albums["va_cnt"] = va_cnt;

						return [albums, Pages];
					});
			});
	}

	addVideoAlbum(u_id, va_name, va_text)
	{
		let va_alias = this.helpers.translit(va_name);
		va_alias = this.helpers.clearSymbol(va_alias, '-');
		return this.model('video/albums').addVideoAlbum(u_id, va_name, va_alias, va_text);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = VideoAlbums;