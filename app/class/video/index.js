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

	getMove(u_id, v_id)
	{
		return this.model('video').getMove(v_id)
			.then((move)=>
			{
				if (!move)
					return Promise.resolve(null);

				move['va_is_owner'] = move['v_is_owner'] = (u_id == move['u_id']);

				return Promise.resolve(move);
			});
	}

	addVideo(u_id, va_id, v_name, v_text, v_img, v_content, v_url)
	{
		let v_alias = this.helpers.translit(v_name);
		v_alias = this.helpers.clearSymbol(v_alias, '-');
		return this.model('video').addVideo(u_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
			.then((v_id)=>
			{
				return Promise.resolve({v_id: v_id, u_id:u_id, va_id:va_id, v_name:v_name, v_alias:v_alias, v_text:v_text, v_img:v_img, v_content:v_content, v_url:v_url});
			});
	}

	editVideo(u_id, v_id, va_id, v_name, v_text, v_img, v_content, v_url)
	{
		let v_alias = this.helpers.translit(v_name);
		v_alias = this.helpers.clearSymbol(v_alias, '-');
		
		return this.model('video').editVideo(u_id, v_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
			.then((v_id)=>
			{
				return Promise.resolve({v_id: v_id, u_id:u_id, va_id:va_id, v_name:v_name, v_alias:v_alias, v_text:v_text, v_img:v_img, v_content:v_content, v_url:v_url});
			});
	}

	delVideo(u_id, va_id, v_id)
	{
		return this.model('video').delVideo(u_id, va_id, v_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;