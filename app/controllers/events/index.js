"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/controller');
const Mail = require('app/lib/mail');
const FileUpload = require('app/lib/file/upload');
const Calendar = require('app/lib/calendar');

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
				'^\/?[0-9]{4,4}\/[0-9]{1,2}\/[0-9]{1,2}\/?$': ['i_yy','i_mm','i_dd'],
				'^\/?[0-9]{4,4}\/[0-9]{1,2}\/?$': ['i_yy','i_mm'],
				'^\/?[0-9]{4,4}\/?$': ['i_yy'],
				'^\/?[0-9]+\/\\S+\/?$': ['i_event_id','s_event_alias'],
				'^\/?$': null
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
		let tplData = {
			event: null,
			eventList: null,
			eventCalendar: null,
			eventLocations: null
		};

		let {i_event_id=null, s_event_alias=null, i_yy=null, i_mm=null, i_dd=null} = this.routeArgs;

		if (i_event_id)
			return this.event(cb, tplData, i_event_id, s_event_alias);


		//let {i_yy=null, i_mm=null, i_dd=null} = routeArgs;
		if (!i_yy && !i_mm && !i_dd)
		{
			let date = new Date();
			i_yy=date.getFullYear();
			i_mm=date.getMonth()+1;
			//i_dd=date.getDate();
		}

		i_yy = parseInt(i_yy,10);
		i_mm = parseInt(i_mm,10);
		i_dd = parseInt(i_dd,10);

		let startDate = new Date(i_yy, i_mm-1);
		let endDate = new Date(startDate.getFullYear(), startDate.getMonth()+2); //+3 месяца

		console.log("startDate = ", startDate.getFullYear(), startDate.getMonth());
		console.log("endDate = ", endDate.getFullYear(), endDate.getMonth());

		let l_id = this.getReq().query["l_id"] || null;

		if (i_dd)
		{
			tplData["selectedDate"] = {i_yy:i_yy, i_mm:i_mm, i_dd:i_dd};
			return this.eventList(cb, tplData, startDate, endDate, l_id);
		}

		return this.eventCalendar(cb, tplData, startDate, endDate, l_id);
	}

	/**
	 * выбранное событие
	 *
	 * @param cb
	 * @param tplData
	 * @param i_event_id
	 * @param s_alias
	 * @throws Errors.HttpStatusError
	 */
	event(cb, tplData, i_event_id, s_alias)
	{
		return this.getClass('events').get(i_event_id)
			.bind(this)
			.then(function (event)
			{
				if (!event || event["e_alias"] != s_alias)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.resolve(event);
			})
			.then(function (event)
			{
				return this.getClass('events').getImageList(event.e_id)
					.spread(function (images, allPreviews)
					{
						return Promise.resolve([event, images, allPreviews]);
					});
			})
			.spread(function (event, images, allPreviews)
			{
				event["eventImages"] = images;
				event["eventImagesPreviews"] = allPreviews;

				return this.getClass("events").getLocations()
					.then(function (eventLocations)
					{
						return Promise.resolve([event, eventLocations]);
					});
			})
			.spread(function (event, eventLocations)
			{
				let tplFile = "events";

				tplData["eventLocations"] = {};
				tplData["eventLocations"]["list"] = eventLocations;
				tplData["eventLocations"]["l_id"] = event["e_location_id"];

				tplData["event"] = event;
				tplData["eventImages"] = event["eventImages"];

				this.view.setPageTitle(event["e_title"]);
				this.view.setPageDescription(event["e_notice"]);

				if (event["eventImages"] && event["eventImages"][0] && event["eventImages"][0]["previews"]["512_384"])
					this.view.setPageOgImage(event["eventImages"][0]["previews"]["512_384"]);

				this.view.setPageH1(event.e_title);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["event"], 'eventData');


				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 * список событий
	 * @param cb
	 * @param tplData
	 * @param routeArgs
	 */
	eventList(cb, tplData, startDate, endDate, l_id)
	{
		console.log("startDate = ", startDate.getFullYear(), startDate.getMonth());
		console.log("endDate = ", endDate.getFullYear(), endDate.getMonth());

		return Promise.props({
			eventList: this.getClass("events").getEvents(startDate.getTime()/1000, endDate.getTime()/1000, l_id),
			eventLocations: this.getClass("events").getLocations()
		})
			.bind(this)
			.then(function (proprs)
			{
				return Promise.resolve([proprs.eventList, proprs.eventLocations, l_id]);
			})
			.spread(function(eventList, eventLocations, l_id)
			{
				let tplFile = "events";

				tplData["eventList"] = eventList;
				
				tplData["eventLocations"] = {};
				tplData["eventLocations"]["list"] = eventLocations;
				tplData["eventLocations"]["l_id"] = l_id;

				//console.log(i_yy, i_mm, i_dd);
				//console.log(eventList);

				//this.getRes().expose(eventList, 'eventList');
				//this.getRes().expose(eventLocations, 'eventLocations');


				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 *
	 * @param start_ts
	 * @param end_ts
	 * @param l_id
	 * @returns
	 */
	eventCalendar(cb, tplData, startDate, endDate, l_id = null)
	{
		//console.log("startDate = ", startDate.getFullYear(), startDate.getMonth());
		//console.log("endDate = ", endDate.getFullYear(), endDate.getMonth());

		return Promise.props({
			eventDates: this.getClass("events").getEventsDate(startDate.getTime()/1000, endDate.getTime()/1000, l_id),
			eventLocations: this.getClass("events").getLocations()
		})
			.bind(this)
			.then(function (proprs)
			{
				console.log("proprs.eventDates = ", proprs.eventDates);

				/*
				для каждой пары proprs.eventDates: e_start_ts: '1472677200', e_end_ts: '1472850000'
				создать список дат (с интервалов в 1 сутки? = 24 ч)
				список в итоге должен быть из уникальных значений
				 */

				let s_date = new Date(1472850000*1000);

				console.log("s_date");
				console.log(s_date.getFullYear(), s_date.getMonth(), s_date.getDate());

				return Promise.resolve([proprs.eventsDate, proprs.eventLocations, l_id]);
			})
			.spread(function(eventDates, eventLocations, l_id)
			{
				let tplFile = "events";

				//tplData["eventDates"] = eventDates;

				tplData["eventLocations"] = {};
				tplData["eventLocations"]["list"] = eventLocations;
				tplData["eventLocations"]["l_id"] = l_id;

				//console.log(i_yy, i_mm, i_dd);
				//console.log(eventList);

				tplData["eventCalendar"] = Calendar.render(
					this.getBaseUrl(),
					{[startDate.getFullYear()]: [startDate.getMonth(), startDate.getMonth()+1, startDate.getMonth()+2]},
					{}
				);

				//this.getRes().expose(eventLocations, 'eventLocations');

				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return cb(null);
			})
			.catch(function(err)
			{
				return cb(err);
			});
	}

	/**
	 * форма добавления события
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
			},
			eventLocations: null
		};

		let tplFile = "events";

		this.view.setTplData(tplFile, tplData);

		return cb(null);
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
				return this.getClass('events').getImageList(event.e_id)
					.spread(function (images, allPreviews)
					{
						return Promise.resolve([event, images, allPreviews]);
					});
			})
			.spread(function (event, images, allPreviews)
			{
				Object.assign(event, FileUpload.createToken('events', {"e_id": event.e_id}) );

				this.getRes().expose(FileUpload.exposeUploadOptions('events'), 'eventsUploadOpts');

				let tplFile = "events";
				let tplData = { event: event, eventImages: images, eventLocations: null };
				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(event.e_title);
				this.view.setPageH1(event.e_title);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["event"], 'eventData');
				this.getRes().expose(tplData["eventImages"], 'eventImages');
				this.getRes().expose(allPreviews, 'eventImagesPreviews');

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

	/**
	 * добавляем фотографи к событию
	 *
	 * @param cb
	 * @returns {*}
	 */
	uploadActionPost(cb)
	{
		let self = this;
		let tplFile = 'events/event_images.ejs';
		let tplData = self.getParsedBody();

		this.getRes().on('cancelUploadedFile', function(file)
		{
			if (file["u_id"] && file["e_id"] && file["ei_id"])
				return self.getClass('events').delImage(file["u_id"], file["e_id"], file["ei_id"], file);
		});

		return self.getClass('events')
			.uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then(function (file)
			{
				//console.log(file);
				tplData = {
					e_id: file.e_id,
					ei_id: file.ei_id,
					ei_pos: file.ei_pos,
					ei_name: file.ei_name,
					ei_latitude: file.latitude,
					ei_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			})
			.catch(function (err)
			{
				Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				self.view.setTplData(tplFile, tplData);

				return cb(null, true);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;