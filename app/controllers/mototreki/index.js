"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
//const _ = require('lodash');

const Base = require('app/lib/controller');

class Mototreki extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_mtt_id']
			}
		}
	}

	/**
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		//TODO здесь вызывать сначала список треков
		this.getClass("user").getUser(this.getUserId())
			.bind(this)
			.then(function(userData)
			{
				this.view.setTplData("mototreki", {});
				this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(Errors.NotFoundError, function(err)
			{
				//self.view.setTplData("home", {});
				//return cb(null);
				throw new Errors.HttpStatusError(404, "Not found");
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	addActionGet(cb)
	{
		this.getClass("user").getUser(this.getUserId())
			.bind(this)
			.then(function(userData)
			{
				let tplFile = "mototreki/edit.ejs";
				this.view.setTplData(tplFile, {});
				this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(Errors.NotFoundError, function(err)
			{
				//self.view.setTplData("home", {});
				//return cb(null);
				throw new Errors.HttpStatusError(404, "Not found");
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	addActionPost(cb)
	{
		let tplData = this.getParsedBody();
		let tplFile = "mototreki/edit.ejs";
		this.view.setTplData(tplFile, tplData);
		console.log(tplData);
		return cb(null, true);
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototreki;