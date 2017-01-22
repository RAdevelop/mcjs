"use strict";
/*const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
const FileUpload = require('app/lib/file/upload');
const Mail = require('app/lib/mail');

const EmbedContent = require("app/lib/embed/content");*/

//const Moment = require('moment'); //работа со временем
//const CtrlMain = require('app/lib/controller');
const Blog = require('app/controllers/blog');

class ProfileBlog extends Blog
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?[1-9]+[0-9]*\/?[0-9]+\/\\S+\/?$': ['i_u_id','i_blog_id','s_blog_alias']
				,"^\/?[1-9]+[0-9]*\/?page\/[1-9]+[0-9]*\/?$" : ["i_u_id", ,"i_page"] //список с постраничкой
				,"^\/?[1-9]+[0-9]*\/?$" : ["i_u_id"] //блог профиль юзера
				//,'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_blog_id']
				,'^\/?$': null
			},
			"upload": {
				'^\/?$': null
			}
		};
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = ProfileBlog;