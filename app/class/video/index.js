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
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;