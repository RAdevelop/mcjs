"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const VideoAlbums = require('app/class/video/albums');
const FileUpload = require('app/lib/file/upload');
const Path = require('path');

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
				return this.editVideo(u_id, v_id, va_id, v_name, v_text, v_img, v_content, v_url);
			});
	}

	editVideo(u_id, v_id, va_id, v_name, v_text, v_img, v_content, v_url)
	{
		return this.getMove(u_id, v_id)
			.then((move)=>
			{
				if (!move['v_is_owner'])
					throw (new Errors.HttpError(404));

				let v_alias = this.helpers.translit(v_name);
				v_alias = this.helpers.clearSymbol(v_alias, '-');

				if (v_img == '' || v_img == move['v_img'])
				{
					return this.model('video').editVideo(u_id, v_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
						.then((v_id)=>
						{
							return Promise.resolve({v_id: v_id, u_id:u_id, va_id:va_id, v_name:v_name, v_alias:v_alias, v_text:v_text, v_img:v_img, v_content:v_content, v_url:v_url});
						});
				}

				const UploadFile = new FileUpload(Video.uploadConfigName);

				let parsedFile = Path.parse(v_img);

				let uploadPaths = UploadFile.uploadPaths();
				let imageUri = FileUpload.getImageUri(va_id, v_id);

				let file = {};

				file['path']            = v_img;
				file['fullFilePath']    = Path.join(uploadPaths['uploadDir'], imageUri, 'orig', parsedFile['base']);
				file['fullPathMainDir'] = Path.join(uploadPaths['uploadDir'], imageUri);
				file['fullPathUploadDir'] = Path.join(uploadPaths['uploadDir'], imageUri, 'orig');
				v_img = file['webFilePath']     = Path.join(uploadPaths['webUploadDir'], imageUri, 'orig', parsedFile['base']);
				file['moveToDir']       = file['fullFilePath'];

				return FileUpload.copyFileByHref(file)
					.then(()=>
					{
						return this.model('video').editVideo(u_id, v_id, va_id, v_name, v_alias, v_text, v_img, v_content, v_url)
							.then((v_id)=>
							{
								return Promise.resolve({v_id: v_id, u_id:u_id, va_id:va_id, v_name:v_name, v_alias:v_alias, v_text:v_text, v_img:v_img, v_content:v_content, v_url:v_url});
							});
					});
			});
	}

	delVideo(u_id, va_id, v_id)
	{
		return this.getMove(u_id, v_id)
			.then((move)=>
			{
				if (!move['v_is_owner'])
					throw (new Errors.HttpError(404));

				return this.model('video').delVideo(u_id, va_id, v_id)
					.then(()=>
					{
						const UploadFile = new FileUpload(Video.uploadConfigName);

						let uploadPaths = UploadFile.uploadPaths();
						let imageUri = FileUpload.getImageUri(va_id, v_id);
						let dir = Path.join(uploadPaths['uploadDir'], imageUri, '../');

						return FileUpload.deleteDir(dir);
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Video;