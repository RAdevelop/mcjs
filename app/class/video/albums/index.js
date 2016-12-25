"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

class VideoAlbums extends Base
{
	getVideoAlbumList(u_id, owner_u_id, Pages)
	{
		return this.model('video').countUserVideoAlbums(owner_u_id)
			.then((va_cnt) =>
			{
				Pages.setTotal(va_cnt);

				if (!va_cnt)
					return [null, Pages];

				if (Pages.limitExceeded())
					throw new Errors.HttpError(404);

				return this.model('video')
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
		return this.model('video').addVideoAlbum(u_id, va_name, va_alias, va_text)
			.then((va_id)=>
			{
				return Promise.resolve({u_id:u_id, va_id:va_id, va_name:va_name, va_alias:va_alias, va_text:va_text});
			});
	}

	/**
	 * выбранный альбом пользователя
	 *
	 * @param u_id - кто запросил
	 * @param owner_u_id - чей альбом запросил
	 * @param va_id
	 * @returns {Promise}
	 */
	getVideoAlbum(u_id, owner_u_id, va_id)
	{
		return this.model('video').getVideoAlbum(owner_u_id, va_id)
			.then((album) =>
			{
				if (!album)
					return Promise.resolve(null);

				album["va_is_owner"] = (album["u_id"] == u_id);

				return Promise.resolve(album);
			});
	}

	/**
	 * редактируем название и описание альбома пользователя
	 *
	 * @param u_id
	 * @param va_id
	 * @param va_name
	 * @param va_text
	 * @returns {Promise}
	 */
	editVideoAlbum(u_id, va_id, va_name, va_text)
	{
		let va_alias = this.helpers.translit(va_name);
		va_alias = this.helpers.clearSymbol(va_alias, '-');

		return this.model('video').editVideoAlbum(u_id, va_id, va_name, va_alias, va_text)
			.then((va_id)=>
			{
				return Promise.resolve({u_id:u_id, va_id:va_id, va_name:va_name, va_alias:va_alias, va_text:va_text});
			});
	}

	delVideoAlbum(u_id, va_id)
	{
		return this.model('video').delVideoAlbum(u_id, va_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = VideoAlbums;