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
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 * добавляем новый трек
	 *
	 * @param cb
	 * @returns {Promise.<TResult>}
	 */
	addActionPost(cb)
	{
		let formData = this.getReqBody();
		let tplData = this.getParsedBody();

		//console.log(tplData);

		let errors = {};

		if (!tplData["s_mtt_name"])
			errors["s_mtt_name"] = "Укажите название трека";

		if (formData["m_mtt_email"] && !tplData["m_mtt_email"])
			errors["m_mtt_email"] = "E-mail указан не верно";
		else
			tplData["m_mtt_email"] = formData["m_mtt_email"];

		if (!tplData["s_mtt_address"])
			errors["s_mtt_address"] = "Укажите адрес трека";

		if (!tplData["f_mtt_lat"] || !tplData["f_mtt_lng"])
			errors["s_mtt_address"] = "Укажите адрес трека";

		let tplFile = "mototreki/edit.ejs";

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				let errKeys = Object.keys(errors);

				if (errKeys.length)
				{
					errKeys.forEach(function(f)
					{
						tplData.formError.fields[f] = errors[f];
					});

					throw new Errors.ValidationError('Ошибки при заполнении формы');
				}

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				const self = this;

				return this.getClass('location').geoCoder(tplData["s_mtt_address"])
					.then(function (userLocationData)
					{
						return self.getClass('location').create(userLocationData);
					})
					.then(function (location_id)
					{
						tplData["i_location_id"] = location_id;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				return this.getClass('mototrek').add(
					tplData["s_mtt_name"],
					tplData["s_mtt_descrip"],
					tplData["s_mtt_website"],
					tplData["m_mtt_email"],
					tplData["s_mtt_phones"],
					tplData["s_mtt_address"],
					tplData["f_mtt_lat"],
					tplData["f_mtt_lng"],
					tplData["i_location_id"]
				)
					.then(function (i_mtt_id)
					{
						tplData["i_mtt_id"] = i_mtt_id;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(Errors.ValidationError, function (err)
			{
				//такие ошибки не уводят со страницы.
				tplData.formError.error = true;
				tplData.formError.message = err.message;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(function (err)
			{
				return cb(err);
			});
	}

	/**
	 * форма редактирования трека
	 *
	 * @param cb
	 */
	editActionGet(cb)
	{
		let {i_mtt_id} = this.routeArgs;

		if (!i_mtt_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('mototrek').get(i_mtt_id)
			.bind(this)
			.then(function (trek)
			{
				return this.getClass("user").getUser(this.getUserId())
					.then(function(userData)
					{
						return Promise.resolve([trek, userData]);
					});
			})
			.spread(function (trek, userData)
			{
				console.log("\ntrek");
				console.log(trek);
				
				let tplFile = "mototreki/edit.ejs";
				let tplData = {
					trek: trek
				};
				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData("user/left", {user: userData});

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototreki;