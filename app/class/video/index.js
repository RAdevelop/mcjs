"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const VideoAlbums = require('app/class/video/albums');

class Video extends VideoAlbums
{
	/**
	 * список видео в альбоме
	 *
	 * @param u_id
	 * @param va_id
	 * @param Pages
	 * @returns {Promise}
	 */
	getAlbumVideos(u_id, va_id, Pages)
	{
		if (Pages.limitExceeded())
			throw (new Errors.HttpError(404));

		return this.model('video')
			.getAlbumVideos(u_id, va_id, Pages.getOffset(), Pages.getLimit())
			.then((videos) => {

				if (!videos)
					return [Pages, [], []];

				let allPreviews = [];
				videos.forEach((video) =>
				{
					if (video["va_img"])
					{
						allPreviews = allPreviews.concat(video["va_img"]);
					}
				});

				return [Pages, videos, allPreviews];
			});
	}

	addVideo(u_id, va_id, v_name, v_text, v_img, v_content, v_url)
	{
		let v_alias = this.helpers.translit(v_name);
		v_alias = this.helpers.clearSymbol(v_alias, '-');
		return this.model('video').addVideo(u_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
			.then((v_id)=>
			{
				return Promise.resolve({v_id: v_id, u_id:u_id, va_id:va_id, v_name:v_name, v_text:v_text, v_img:v_img, v_content:v_content, v_url:v_url});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;