/**
 * Created by ra on 25.10.16.
 */
"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

const Base = require('app/lib/controller');

class Motoshop extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?[0-9]*\/?$': ['i_mts_id']
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_mts_id']
			},
			"map": {
				'^\/?$': null
			}
		}
	}

	/**
	 *
	 * @returns {*}
	 */
	indexActionGet()
	{
		this.view.setTplData("motoshop", {});
		//this.view.addPartialData("user/left", {user: userData});
		//this.view.addPartialData("user/right", {title: 'right_col'});

		return Promise.resolve(null);
	}

	/**
	 * форма добавления
	 *
	 */
	addActionGet()
	{
		let tplData = {
			motoshop: {
				mts_website: '',
				mts_email: '',
				mts_name: '',
				mts_descrip: ''
			}
		};

		let tplFile = "motoshop";

		this.view.setTplData(tplFile, tplData);

		return Promise.resolve(null);
	}

	/**
	 * добавляем новый трек
	 *
	 * @returns {Promise.<TResult>}
	 */
	addActionPost()
	{
		let formData = this.getReqBody();
		let tplData = this.getParsedBody();
		
		let errors = {};
		
		tplData = this.stripTags(tplData, ["s_mts_name", "m_mts_email", "link_mts_website"]);
		tplData["t_mts_descrip"] = this.cheerio(tplData["t_mts_descrip"]).root().cleanTagEvents().html();
		
		if (!tplData["s_mts_name"])
			errors["s_mts_name"] = "Укажите название";
		
		if (!tplData["link_mts_website"])
			errors["link_mts_website"] = "Укажите веб-сайт";

		if (!tplData["m_mts_email"])
			errors["m_mts_email"] = "E-mail указан не верно";

		let tplFile = "motoshop/edit.ejs";

		return Promise.resolve(errors)
			.bind(this)
			.then(function(errors)
			{
				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);

			})
			.then(function (tplData)
			{
				return this.getClass('motoshop').add(
					tplData["s_mts_name"],
					tplData["link_mts_website"],
					tplData["m_mts_email"],
					tplData["t_mts_descrip"]
				)
				.then(function (i_mts_id)
				{
					tplData["i_mts_id"] = i_mts_id;
					return Promise.resolve(tplData);
				});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err)//такие ошибки не уводят со страницы.
			{
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * форма редактирования
	 *
	 */
	editActionGet()
	{
		let {i_mts_id} = this.routeArgs;

		if (!i_mts_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('motoshop').getMotoshop(i_mts_id)
			.bind(this)
			.then(function (motoshop)
			{
				if (!motoshop)
					throw new Errors.HttpStatusError(404, "Not found");

				let tplFile = "motoshop";
				let tplData = {
					motoshop: motoshop
				};
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["motoshop"], 'motoshop');

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * обновляем данные
	 *
	 * @returns {Promise.<TResult>}
	 */
	editActionPost()
	{
		let tplData = this.getParsedBody();

		if (!tplData["i_mts_id"])
			throw new Errors.HttpStatusError(404, "Not found");

		switch (tplData["btn_save_motoshop"])
		{
			default:
				throw new Errors.HttpStatusError(400, "Bad request");
				break;

			case 'main':
				return this.edit(tplData);
				break;

			case 'add_address':
				return this.addAddress(tplData);
				break;
			
			case 'del_address':
				return this.delAddress(tplData);
				break;
		}
	}

	/**
	 * редактируем основные данные
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	edit(tplData)
	{
		let tplFile = "motoshop/edit.ejs";

		return this.getClass('motoshop').getMotoshop(tplData["i_mts_id"])
			.bind(this)
			.then(function (motoshop)
			{
				if (!motoshop)
					throw new Errors.HttpStatusError(404, "Not found");

				tplData = this.stripTags(tplData, ["s_mts_name", "m_mts_email", "link_mts_website"]);
				tplData["t_mts_descrip"] = this.cheerio(tplData["t_mts_descrip"]).root().cleanTagEvents().html();

				let errors = {};

				if (!tplData["s_mts_name"])
					errors["s_mts_name"] = "Укажите название";

				if (!tplData["link_mts_website"])
					errors["link_mts_website"] = "Укажите веб-сайт";

				if (!tplData["m_mts_email"])
					errors["m_mts_email"] = "E-mail указан не верно";

				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('motoshop').edit(
					tplData["i_mts_id"],
					tplData["s_mts_name"],
					tplData["link_mts_website"],
					tplData["m_mts_email"],
					tplData["t_mts_descrip"]
				)
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * добавляем адрес
	 *
	 * @param tplData
	 */
	addAddress(tplData)
	{
		let tplFile = "motoshop/edit.ejs";

		return this.getClass('motoshop').getMotoshop(tplData["i_mts_id"])
			.bind(this)
			.then(function (motoshop)
			{
				if (!motoshop)
					throw new Errors.HttpStatusError(404, "Not found");

				tplData = this.stripTags(tplData, ["s_mts_address", "s_mts_address_phones", "m_mts_address_email", "link_address_website"]);
				
				let errors = {};

				if (!tplData["s_mts_address_phones"])
					errors["s_mts_address_phones"] = "Укажите телефон(ы)";

				if (!tplData["link_address_website"])
					errors["link_address_website"] = "Укажите веб-сайт";

				if (!tplData["m_mts_address_email"])
					errors["m_mts_address_email"] = "E-mail указан не верно";

				if (!tplData["s_mts_address"] || !tplData["f_mts_address_lat"] || !tplData["f_mts_address_lng"])
					errors["s_mts_address"] = "Укажите адрес";

				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				return this.getClass('motoshop').addAddress(
					tplData["i_mts_id"],
					tplData["link_address_website"],
					tplData["m_mts_address_email"],
					tplData["s_mts_address_phones"],
					tplData["s_mts_address"],
					tplData["f_mts_address_lat"],
					tplData["f_mts_address_lng"]
				)
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}

	/**
	 * удаляем адрес
	 * 
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	delAddress(tplData)
	{
		let tplFile = "motoshop/edit.ejs";
		
		return this.getClass('motoshop').getMotoshop(tplData["i_mts_id"])
			.bind(this)
			.then(function (motoshop)
			{
				if (!motoshop || !tplData["i_mts_address_id"])
					throw new Errors.HttpStatusError(404, "Not found");
				
				return this.getClass('motoshop').delAddress(tplData["i_mts_id"], tplData["i_mts_address_id"])
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(function (err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;