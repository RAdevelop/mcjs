"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/controller');
const Mail = require('app/lib/mail');

class Events extends Base
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	routePaths()
	{
		return {
			"index": {
				'^\/?[0-9]*\/?$': ['i_event_id']
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_event_id']
			},
			"map": {
				'^\/?$': null
			}
		}
	}

	/**
	 * главная страница
	 *
	 * @param cb
	 * @returns {*}
	 */
	indexActionGet(cb)
	{
		let {i_event_id} = this.routeArgs;

		return this.eventData(i_event_id)
			.bind(this)
			.spread(function (event, eventList)
			{
				return this.getUser(this.getUserId())
					.then(function (userData)
					{
						return Promise.resolve([userData, event, eventList]);
					})
			})
			.spread(function(userData, event, eventList)
			{
				let tplData = {};

				tplData.event = event || null;
				tplData.eventList = eventList || null;

				let tplFile = "events";
				if (event)
				{
					this.getRes().expose(event, 'event');

					this.view.setPageTitle(event["e_title"]);
					this.view.setPageDescription(this.cheerio(event["e_notice"]).text());
				}
				else
				{
					this.getRes().expose(eventList, 'eventList');
					//this.getRes().expose(eventLocations, 'eventLocations');
				}

				this.view.setTplData(tplFile, tplData);
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
	 * что показывать - указанный трек, или список треков...
	 *
	 * @param i_event_id
	 * @returns {Promise}
	 */
	eventData(i_event_id)
	{
		if (i_event_id)
			return this.event(i_event_id);

		return this.eventList();
	}

	/**
	 * выбранный трек
	 *
	 * @param i_event_id
	 * @returns Promise spread data [trek, eventList]
	 * @throws Errors.HttpStatusError
	 */
	event(i_event_id)
	{
		return this.getClass('events').get(i_event_id)
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
	 * @returns Promise spread data [trek, eventList]
	 */
	eventList()
	{
		return Promise.props({
			eventList: this.getClass("events").getAll(),
			eventLocations: this.getClass("events").getLocations()
		})
			.then(function (proprs)
			{
				proprs.eventLocations = proprs.eventLocations.reverse();
				proprs.eventList = proprs.eventList.reverse();

				let length = proprs.eventList.length;

				for(let t = 0; t < length; t++)
				{
					for(let l = 0; l < proprs.eventLocations.length; l++)
					{
						if (
							proprs.eventList.hasOwnProperty(t)
							&&	proprs.eventList[t]["e_location_id"] == proprs.eventLocations[l]["l_id"]
						)
						{
							if (!proprs.eventLocations[l].hasOwnProperty("treks"))
								proprs.eventLocations[l]["treks"] = [];

							proprs.eventLocations[l]["treks"].push(proprs.eventList[t]);

							proprs.eventList.splice(t, 1);

							length--;
							t--;
						}
					}
				}

				length = proprs.eventList.length;

				for(let t = 0; t < length; t++)
				{
					let pids = (proprs.eventList[t]["e_location_pids"]).split(',');

					for(let l = 0; l < proprs.eventLocations.length; l++)
					{

						let last = pids.lastIndexOf(proprs.eventLocations[l]["l_id"]);

						if (last == -1)
							continue;

						if (!proprs.eventLocations[l].hasOwnProperty("treks"))
							proprs.eventLocations[l]["treks"] = [];

						proprs.eventLocations[l]["treks"].push(proprs.eventList[t]);

						proprs.eventList.splice(t, 1);

						length--;
						t--;

						break;
					}
				}

				proprs.eventLocations = proprs.eventLocations.reverse();


				let pIndex, eventList = [];
				proprs.eventLocations.forEach(function (locItem, locIndex, locNames)
				{
					if (locItem["l_e_level"] <= 1)
					{
						if (locItem["l_e_level"] == 1)
						{
							pIndex = locIndex;

							if (!locNames[pIndex].hasOwnProperty("child"))
								locNames[pIndex]["child"] = [];
						}

						eventList.push(locItem);
					}
					else
					{
						locNames[pIndex]["child"].push(locItem);
					}

				});

				proprs = null;

				return Promise.resolve([null, eventList]);
			});
	}

	/**
	 * форма добавления трека
	 *
	 * @param cb
	 */
	addActionGet(cb)
	{
		let tplData = {
			event: {
				e_id: '',
				e_create_ts: '',
				e_update_ts: '',
				dd_start_ts: '',
				dd_end_ts: '',
				e_title: '',
				e_notice: '',
				e_text: '',
				e_address: '',
				e_location_id: '',
				e_latitude: '',
				e_longitude: '',
				e_gps_lat: '',
				e_gps_lng: '',
				u_id: ''
			}
		};

		return Promise.resolve(tplData)
			.bind(this)
			.then(function(tplData)
			{
				let tplFile = "events";

				this.view.setTplData(tplFile, tplData);

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
		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();

		//console.log(tplData);

		let errors = {};

		tplData = this.stripTags(tplData, ["dd_start_ts", "dd_end_ts", "s_e_title","t_e_notice", "s_e_address"]);

		if (!tplData["dd_start_ts"])
			errors["dd_start_ts"] = "Укажите дату начала события";

		if (!tplData["dd_end_ts"])
			errors["dd_end_ts"] = "Укажите дату завершения события";

		if (!tplData["s_e_title"])
			errors["s_e_title"] = "Укажите название события";

		if (!tplData["t_e_notice"])
				errors["t_e_notice"] = "Укажите анонс события";

		if (!tplData["t_e_text"])
				errors["t_e_text"] = "Укажите описание события";

		if (!tplData["s_e_address"])
			errors["s_e_address"] = "Укажите адрес события";

		if (!tplData["f_e_lat"] || !tplData["f_e_lng"])
			errors["s_e_address"] = "Укажите адрес события";

		let tplFile = "events/edit.ejs";

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

				return this.getClass('location').geoCoder(tplData["s_e_address"])
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
				return this.getClass('events').add(this.getUserId(),
					tplData["s_e_title"], tplData["t_e_notice"], tplData["t_e_text"], tplData["s_e_address"],
					tplData["f_e_lat"], tplData["f_e_lng"], tplData["i_location_id"], tplData["dd_start_ts"], tplData["dd_end_ts"]
				)
					.bind(this)
					.then(function (i_event_id)
					{
						tplData["i_event_id"] = i_event_id;

						const Mailer = new Mail('gmail');

						let title = 'Новое МотоСобытие на сайте www.MotoCommunity.ru';
						let sendParams = {
							//to:         '',
							subject:    title,
							tplName:    'events/new',
							tplData: {
								title: title,
								links: 'https://'+this.getHostPort(),
								link: 'http://'+this.getHostPort(),
								event_link: 'events/edit/'+i_event_id
							}
						};

						Mailer.send(sendParams, function (err)
						{
							if(err)
								Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
						});

						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(Errors.ValidationError, function (err)//такие ошибки не уводят со страницы.
			{
				this.view.setTplData(tplFile, err.data);

				return cb(null, true);
			})
			.catch(function (err)
			{
				return cb(err);
			});
	}

	/**
	 * форма редактирования события
	 *
	 * @param cb
	 */
	editActionGet(cb)
	{
		let {i_event_id} = this.routeArgs;

		if (!i_event_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('events').get(i_event_id)
			.bind(this)
			.then(function (event)
			{
				if (!event)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(event);
			})
			.then(function (event)
			{
				let tplFile = "events";
				let tplData = { event: event };
				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(event.e_title);
				this.view.setPageH1(event.e_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["event"], 'event');

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 * редактируем трек по его id
	 *
	 * @param cb
	 * @returns {Promise.<TResult>}
	 */
	editActionPost(cb)
	{
		let tplFile = "events/edit.ejs";

		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();

		if (!tplData["i_event_id"])
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('events').get(tplData["i_event_id"])
			.bind(this)
			.then(function (event)
			{
				if (!event)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve();
			})
			.then(function ()
			{
				let errors = {};

				tplData = this.stripTags(tplData, ["dd_start_ts", "dd_end_ts", "s_e_title","t_e_notice", "s_e_address"]);

				tplData["t_e_text"] = this.cheerio(tplData["t_e_text"]).root().cleanTagEvents().html();

				if (!tplData["dd_start_ts"])
					errors["dd_start_ts"] = "Укажите дату начала события";

				if (!tplData["dd_end_ts"])
					errors["dd_end_ts"] = "Укажите дату завершения события";

				if (!tplData["s_e_title"])
					errors["s_e_title"] = "Укажите название события";

				if (!tplData["t_e_notice"])
					errors["t_e_notice"] = "Укажите анонс события";

				if (!tplData["t_e_text"])
					errors["t_e_text"] = "Укажите описание события";

				if (!tplData["s_e_address"])
					errors["s_e_address"] = "Укажите адрес события";

				if (!tplData["f_e_lat"] || !tplData["f_e_lng"])
					errors["s_e_address"] = "Укажите адрес события";

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

				return this.getClass('location').geoCoder(tplData["s_e_address"])
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
				return this.getClass('events').edit(
					tplData["i_event_id"], this.getUserId(),
					tplData["s_e_title"], tplData["t_e_notice"], tplData["t_e_text"], tplData["s_e_address"],
					tplData["f_e_lat"], tplData["f_e_lng"], tplData["i_location_id"], tplData["dd_start_ts"], tplData["dd_end_ts"]
				)
					.then(function ()
					{
						return Promise.resolve(tplData);
					});
			})
			.then(function (tplData)
			{
				this.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(Errors.ValidationError, function (err) //такие ошибки не уводят со страницы
			{
				this.view.setTplData(tplFile, err.data);

				return cb(null, true);
			})
			.catch(function (err)
			{
				return cb(err);
			});
	}

	/**
	 * просмотр треков на карте
	 *
	 * @param cb
	 * @returns {Promise.<T>}
	 */
	mapActionGet(cb)
	{
		return Promise.props({
			eventList: this.getClass("events").getAll(),
			eventLocations: this.getClass("events").getLocations()
		})
			.bind(this)
			.then(function(props)
			{
				let tplData = {
					trek: null,
					eventList: props.eventList || [],
					eventLocations: props.eventLocations || []
				};
				let tplFile = "mototreki/map.ejs";
				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});

				//экспрот данных в JS на клиента
				this.getRes().expose(props.eventList, 'eventList');
				this.getRes().expose(props.eventLocations, 'eventLocations');

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
module.exports = Events;