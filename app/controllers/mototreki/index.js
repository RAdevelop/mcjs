"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");

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
				'^\/?[0-9]*\/?$': ['i_mtt_id']
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_mtt_id']
			},
			"map": {
				'^\/?$': null
			}
		}
	}

	/**
	 * главная страница
	 *
	 * @returns {*}
	 */
	indexActionGet()
	{
		let {i_mtt_id} = this.routeArgs;

		return this.trekData(i_mtt_id)
			.bind(this)
			.spread(function (trek, trekList)
			{
				return this.getUser(this.getUserId())
					.then(function (userData)
					{
						return Promise.resolve([userData, trek, trekList]);
					})
			})
			.spread(function(userData, trek, trekList)
			{
				let tplData = {};

				tplData.trek = trek || null;
				tplData.trekList = trekList || null;

				let tplFile = "mototreki";
				if (trek)
				{
					this.getRes().expose(trek, 'trek');

					this.view.setPageTitle(trek["mtt_name"]);
					this.view.setPageH1(trek["mtt_name"]);
					this.view.setPageDescription(this.cheerio(trek["mtt_descrip"]).text());
				}
				else
				{
					this.getRes().expose(trekList, 'trekList');
					//this.getRes().expose(trekLocations, 'trekLocations');
				}

				this.view.setTplData(tplFile, tplData);
				this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * что показывать - указанный трек, или список треков...
	 * 
	 * @param i_mtt_id
	 * @returns {Promise}
	 */
	trekData(i_mtt_id)
	{
		if (i_mtt_id)
			return this.trek(i_mtt_id);

		return this.trekList();
	}

	/**
	 * выбранный трек
	 *
	 * @param i_mtt_id
	 * @returns Promise spread data [trek, trekList]
	 * @throws Errors.HttpStatusError
	 */
	trek(i_mtt_id)
	{
		return this.getClass('mototrek').get(i_mtt_id)
			.then(function (trek)
			{
				if (!trek)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve([trek, null]);
			});
	}

	/**
	 * список треков
	 *
	 * @returns Promise spread data [trek, trekList]
	 */
	trekList()
	{
		return Promise.props({
			trekList: this.getClass("mototrek").getAll(),
			trekLocations: this.getClass("mototrek").getLocations()
		})
			.then(function (proprs)
			{
				proprs.trekLocations = proprs.trekLocations.reverse();
				proprs.trekList = proprs.trekList.reverse();

				let length = proprs.trekList.length;

				for(let t = 0; t < length; t++)
				{
					for(let l = 0; l < proprs.trekLocations.length; l++)
					{
						if (
							proprs.trekList.hasOwnProperty(t)
							&&	proprs.trekList[t]["mtt_location_id"] == proprs.trekLocations[l]["l_id"]
						)
						{
							if (!proprs.trekLocations[l].hasOwnProperty("treks"))
								proprs.trekLocations[l]["treks"] = [];

							proprs.trekLocations[l]["treks"].push(proprs.trekList[t]);

							proprs.trekList.splice(t, 1);

							length--;
							t--;
						}
					}
				}

				length = proprs.trekList.length;

				for(let t = 0; t < length; t++)
				{
					let pids = (proprs.trekList[t]["mtt_location_pids"]).split(',');

					for(let l = 0; l < proprs.trekLocations.length; l++)
					{

						let last = pids.lastIndexOf(proprs.trekLocations[l]["l_id"]);

						if (last == -1)
							continue;

						if (!proprs.trekLocations[l].hasOwnProperty("treks"))
							proprs.trekLocations[l]["treks"] = [];

						proprs.trekLocations[l]["treks"].push(proprs.trekList[t]);

						proprs.trekList.splice(t, 1);

						length--;
						t--;

						break;
					}
				}

				proprs.trekLocations = proprs.trekLocations.reverse();


				let pIndex, trekList = [];
				proprs.trekLocations.forEach(function (locItem, locIndex, locNames)
				{
					if (locItem["l_mtt_level"] <= 1)
					{
						if (locItem["l_mtt_level"] == 1)
						{
							pIndex = locIndex;

							if (!locNames[pIndex].hasOwnProperty("child"))
								locNames[pIndex]["child"] = [];
						}

						trekList.push(locItem);
					}
					else
					{
						locNames[pIndex]["child"].push(locItem);
					}

				});

				proprs = null;

				return Promise.resolve([null, trekList]);
			});
	}

	/**
	 * форма добавления трека
	 *
	 */
	addActionGet()
	{
		let tplData = {
			trek: {
				mtt_name: '',
				mtt_website: '',
				mtt_address: '',
				mtt_descrip: '',
				mtt_email: '',
				mtt_phones: '',
				mtt_latitude: '',
				mtt_longitude: '',
				mtt_location_id: ''
			}
		};

		let tplFile = "mototreki";

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

		//console.log(tplData);

		let errors = {};

		tplData = this.stripTags(tplData, ["s_mtt_name", "m_mtt_email", "s_mtt_address", "s_mtt_website", "s_mtt_phones"]);
		tplData["t_mtt_descrip"] = this.cheerio(tplData["t_mtt_descrip"]).root().cleanTagEvents().html();

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
				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				const self = this;

				return this.getClass('location').geoCoder(tplData["s_mtt_address"])
					.then(function (locationData)
					{
						return self.getClass('location').create(locationData);
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
					tplData["t_mtt_descrip"],
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
	 * форма редактирования трека
	 *
	 */
	editActionGet()
	{
		let {i_mtt_id} = this.routeArgs;

		if (!i_mtt_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('mototrek').get(i_mtt_id)
			.bind(this)
			.then(function (trek)
			{
				if (!trek)
					throw new Errors.HttpStatusError(404, "Not found");

				let tplFile = "mototreki";
				let tplData = {
					trek: trek
				};
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["trek"], 'trek');

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}

	/**
	 * редактируем трек по его id
	 *
	 * @returns {Promise.<TResult>}
	 */
	editActionPost()
	{
		let tplFile = "mototreki/edit.ejs";
		let formData = this.getReqBody();
		let tplData = this.getParsedBody();

		if (!tplData["i_mtt_id"])
			throw new Errors.HttpStatusError(404, "Not found");


		return this.getClass('mototrek').get(tplData["i_mtt_id"])
			.bind(this)
			.then(function (trek)
			{
				if (!trek)
					throw new Errors.HttpStatusError(404, "Not found");

				tplData = this.stripTags(tplData, ["s_mtt_name", "m_mtt_email", "s_mtt_address", "s_mtt_website", "s_mtt_phones"]);
				tplData["t_mtt_descrip"] = this.cheerio(tplData["t_mtt_descrip"]).root().cleanTagEvents().html();

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

				return Promise.resolve([errors, tplData]);
			})
			.spread(function(errors, tplData)
			{
				this.parseFormErrors(tplData, errors, 'Ошибки при заполнении формы');

				return Promise.resolve(tplData);
			})
			.then(function (tplData)
			{
				const self = this;

				return this.getClass('location').geoCoder(tplData["s_mtt_address"])
					.then(function (locationData)
					{
						return self.getClass('location').create(locationData);
					})
					.then(function (location_id)
					{
						tplData["i_location_id"] = location_id;
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				return this.getClass('mototrek').edit(
					tplData["i_mtt_id"],
					tplData["s_mtt_name"],
					tplData["t_mtt_descrip"],
					tplData["s_mtt_website"],
					tplData["m_mtt_email"],
					tplData["s_mtt_phones"],
					tplData["s_mtt_address"],
					tplData["f_mtt_lat"],
					tplData["f_mtt_lng"],
					tplData["i_location_id"]
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
	 * просмотр треков на карте
	 *
	 * @returns {Promise.<T>}
	 */
	mapActionGet()
	{
		return Promise.props({
			trekList: this.getClass("mototrek").getAll(),
			trekLocations: this.getClass("mototrek").getLocations()
		})
			.bind(this)
			.then(function(props)
			{
				let tplData = {
					trek: null,
					trekList: props.trekList || [],
					trekLocations: props.trekLocations || []
				};
				let tplFile = "mototreki/map.ejs";
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(props.trekList, 'trekList');
				this.getRes().expose(props.trekLocations, 'trekLocations');

				return Promise.resolve(null);
			})
			.catch(function(err)
			{
				throw err;
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Mototreki;