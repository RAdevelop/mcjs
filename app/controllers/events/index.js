"use strict";
const Logger = require('app/lib/logger');
const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const CtrlMain = require('app/lib/controller');
const Mail = require('app/lib/mail');
const FileUpload = require('app/lib/file/upload');
const Calendar = require('app/lib/calendar');

const EmbedContent = require("app/lib/embed/content");
const Moment = require('moment'); //работа со временем
const Pages = require("app/lib/pages");

let limit_per_page = 20;

class Events extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?$': null
				,'^\/?[0-9]{4,4}\/[0-9]{1,2}\/[0-9]{1,2}\/?$': ['i_yy','i_mm','i_dd']
				,'^\/?[0-9]{4,4}\/[0-9]{1,2}\/?$': ['i_yy','i_mm']
				//,'^\/?[0-9]{4,4}\/?$': ['i_yy'],
				,'^\/?[0-9]+\/\\S+\/?$': ['i_event_id','s_event_alias']
				,"^\/?tag\/\\S+\/page\/[1-9]+[0-9]*\/?$" : ['b_tag','s_tag',,'i_page'] //по тегам
				,"^\/?tag\/\\S+\/?$" : ['b_tag','s_tag']
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?$': null
				,'^\/?[0-9]+\/?$': ['i_event_id']
			},
			/*"map": {
				'^\/?$': null
			},*/
			"upload": {
				'^\/?$': null
			}
		};
	}

	_setSelectedDateTs(dateTs)
	{
		this._selectedDateTs = dateTs;
	}
	_getSelectedDateTs()
	{
		return this._selectedDateTs;
	}

	/**
	 *
	 * @param obj = {i_yy:i_yy, i_mm:i_mm, i_dd:i_dd}
	 * @private
	 */
	_setSelectedDateObj(obj)
	{
		this._selectedDate = obj;
	}
	_getSelectedDateObj()
	{
		return this._selectedDate;
	}

	/**
	 * главная страница
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		this.view.useCache(true);
		
		let tplData = {
			event: null,
			eventList: null,
			eventCalendar: null,
			eventLocations: null,
			selectedDate: {
				obj: {}
			}
		};
		
		let {i_event_id=null, s_event_alias=null, i_yy=null, i_mm=null, i_dd=null
			, b_tag=null, s_tag=null
		} = this.routeArgs;
		
		b_tag = !!b_tag;
		
		if (i_event_id)
			return this._event(tplData, i_event_id, s_event_alias);
		
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

		let startDate, endDate;

		let {l_id=null} = this.reqQuery();

		this._setSelectedDateTs(new Date(i_yy, i_mm-1, i_dd||1));
		this._setSelectedDateObj({i_yy:i_yy, i_mm:i_mm, i_dd:i_dd});

		tplData['selectedDate']['obj'] = this._getSelectedDateObj();
		
		if (b_tag)
		return this._tagEventList(tplData, s_tag);
		
		if (!!i_dd)
		{
			if (!Moment([i_yy,i_mm,i_dd].join('-'), 'YYYY-MM-DD').isValid())
				throw new Errors.HttpError(400);

			startDate = new Date(i_yy, i_mm-1, i_dd);
			endDate = startDate;

			return this._eventList(tplData, startDate, endDate, l_id);
		}

		if (!Moment([i_yy, i_mm].join('-'), 'YYYY-MM').isValid())
			throw new Errors.HttpError(400);

		startDate = new Date(i_yy, i_mm-1);
		endDate = new Date(startDate.getFullYear(), startDate.getMonth()+3); //+3 месяца

		return this._eventCalendar(tplData, startDate, endDate, l_id);
	}

	/**
	 * выбранное событие
	 *
	 * @param tplData
	 * @param i_event_id
	 * @param s_alias
	 * @throws Errors.HttpStatusError
	 */
	_event(tplData, i_event_id, s_alias)
	{
		return this.getClass('events').get(i_event_id)
			.then( (event) =>
			{
				if (!event || event['e_alias'] != s_alias)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.all([
					this.getClass('events').getImageList(event.e_id),
					this.getClass('events').getLocations(event['e_start_ts'], parseInt(event['e_end_ts'],10)+3600, event['e_location_id'])
				])
					.spread((images, eventLocations)=>
					{
						event['eventImages'] = images[0];
						event['eventImagesPreviews'] = images[1]; //=>allPreviews
						return Promise.resolve([event, eventLocations]);
					});
			})
			.spread( (event, eventLocations) =>
			{
				let tplFile = "events";
				let eventStartDate = event['dd_start_ts'].split('-');
				this._setSelectedDateObj({i_yy:eventStartDate[2], i_mm:eventStartDate[1], i_dd:eventStartDate[0]});
				tplData['selectedDate']['obj'] = this._getSelectedDateObj();

				tplData['eventLocations'] = {};
				tplData['eventLocations']['list'] = eventLocations;
				tplData['eventLocations']['l_id'] = event['e_location_id'];

				tplData['event'] = event;
				tplData['eventImages'] = event['eventImages'];

				this.view.setPageTitle(event['e_title']);
				this.view.setPageDescription(event['e_notice']);

				if (event['eventImages'] && event['eventImages'][0] && event['eventImages'][0]['previews']['512_384'])
					this.view.setPageOgImage(event['eventImages'][0]['previews']['512_384']);
				
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData['event'], 'eventData');

				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			});
	}

	/**
	 * список событий
	 *
	 * @param tplData
	 * @param startDate
	 * @param endDate
	 * @param l_id
	 */
	_eventList(tplData, startDate, endDate, l_id)
	{
		let startDateTs = startDate.getTime()/1000;
		let endDateTs = endDate.getTime()/1000;
		return this.getClass('events').getEvents(startDateTs, endDateTs, l_id)
			.then( (eventList) =>
			{
				if (!eventList || !eventList.length)
					throw new Errors.HttpError(404);

				return this.getClass('events').getLocations(startDateTs, endDateTs, l_id)
					.then((eventLocations) =>
					{
						return Promise.resolve([eventList, eventLocations]);
					});
			})
			.spread((eventList, eventLocations) =>
			{
				let tplFile = "events";

				tplData['eventList']        = eventList;
				tplData['eventLocations']   = eventLocations;

				let title = [this._getSelectedDateTs().getDate()];
				title.push(Calendar.monthName(this._getSelectedDateTs().getMonth()));
				title.push(this._getSelectedDateTs().getFullYear());

				if (tplData['eventLocations']['selected']['l_name'])
					title.push(tplData['eventLocations']['selected']['l_name']);

				title = title.join(' ');
				this.view.setPageTitle(title);
				this.view.setPageH1(title);

				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				//this.getRes().expose(eventList, 'eventList');
				//this.getRes().expose(eventLocations, 'eventLocations');

				return Promise.resolve(null);
			});
	}
	
	_tagEventList(tplData, s_tag)
	{
		let {i_page=1} = this.routeArgs;
		
		return this.getClass('events').getEventsByTag(new Pages(i_page, limit_per_page), s_tag)
			.spread((eventList, Pages) =>
			{
				if (!eventList || !eventList.length)
					throw new Errors.HttpError(404);
				
				tplData['eventList'] = eventList;
				
				let isAjax = this.getReq().xhr;
				let baseUrl = [this.getBaseUrl(), 'tag', s_tag];
				baseUrl = baseUrl.join('/');
				Pages.setLinksUri(baseUrl);

				let tplFile = (isAjax ? 'events/list.ejs':'events');
				tplData['pages'] = Pages.pages();
				this.view.setTplData(tplFile, tplData, isAjax);

				if (!isAjax)
				{
					this.getRes().expose(tplData['eventList'], 'eventList');
					this.getRes().expose(tplData['pages'], 'pages');

					//this.view.addPartialData("user/left", {user: userData});
					//this.view.addPartialData("user/right", {title: 'right_col'});
				}

				return Promise.resolve(isAjax);
			});
	}

	/**
	 *
	 * @param tplData
	 * @param startDate
	 * @param endDate
	 * @param l_id
	 * @returns
	 */
	_eventCalendar(tplData, startDate, endDate, l_id = null)
	{
		let startDateTs = startDate.getTime()/1000;
		let endDateTs   = endDate.getTime()/1000;
		let endStartMonthTs;

		if (!!this._getSelectedDateObj()['i_dd'] === false)
			endStartMonthTs = Moment(startDateTs*1000).add(1, 'month').unix();
		else
			endStartMonthTs = Moment(new Date(
				this._getSelectedDateObj()['i_yy'],
				this._getSelectedDateObj()['i_mm'],
				this._getSelectedDateObj()['i_dd']
			)).unix();

		return Promise.all([
			this.getClass('events').getEventsDate(startDateTs, endDateTs, l_id),
			this.getClass('events').getLocations(startDateTs, endStartMonthTs, l_id),
			this.getClass('events').getEvents(startDateTs, endStartMonthTs, l_id)
		])
			.spread((eventDates, eventLocations, eventList) =>
			{
				let eStartTs, eEndTs, eDelta, i;

				eventDates.forEach( (eDate) =>
				{
					eStartTs    = parseInt(eDate['e_start_ts'], 10);
					eEndTs      = parseInt(eDate['e_end_ts'], 10);

					if (eStartTs && eEndTs)
					{
						i = 0;
						eDelta = 0;
						do
						{
							eventDates.push((eStartTs+eDelta)*1000);
							i++;
							eDelta = 86400*i;
						}
						while (eStartTs + eDelta < eEndTs);

						eventDates.push(eEndTs*1000);
					}
				});

				eventDates = this.getClass('events').helpers.arrayUnique(eventDates);

				return Promise.resolve([eventDates, eventLocations, l_id, eventList]);
			})
			.spread((eventDates, eventLocations, l_id, eventList) =>
			{
				let tplFile = "events";

				tplData['eventLocations']   = eventLocations;
				tplData['eventList']        = eventList;

				tplData['eventCalendar'] = Calendar.render(
					this.getBaseUrl(),
					//так как месяцы считаются с нуля
					{
						[startDate.getFullYear()]: [
							startDate.getMonth()+1, startDate.getMonth()+2, startDate.getMonth()+3
						]
					},
					{},
					eventDates
				);
				let title = [Calendar.monthName(this._getSelectedDateTs().getMonth())];
				title.push(this._getSelectedDateTs().getFullYear());
				if (!!eventLocations['selected']['l_id'])
					title.push(eventLocations['selected']['l_name']);
				title = title.join(' ');
				this.view.setPageTitle(title);
				this.view.setPageH1(title);

				//this.getRes().expose(eventLocations, 'eventLocations');

				this.view.setTplData(tplFile, tplData);
				//this.view.addPartialData("user/left", {user: userData});
				//this.view.addPartialData("user/right", {title: 'right_col'});

				return Promise.resolve(null);
			});
	}

	/**
	 * форма добавления события
	 *
	 */
	addActionGet()
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
				u_id: '',
				kw_names: []
			},
			eventLocations: null,
			selectedDate: {}
		};

		let now = new Date();
		this._setSelectedDateObj();
		tplData['selectedDate']['obj'] = {i_yy:now.getFullYear(), i_mm:now.getMonth()+1, i_dd:now.getDate()};

		return this.getClass('keywords').getKeyWordList()
			.then((keywords)=>
			{
				let tplFile = "events";
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(keywords, 'keyWords');

				return Promise.resolve(null);
			});
	}

	/**
	 * добавляем новый трек
	 *
	 * @returns {Promise}
	 */
	addActionPost()
	{
		//let formData = this.getReqBody();
		let tplData = this.getParsedBody();
		let tplFile = "events/edit.ejs";
		
		if (tplData['b_load_embed_content'])
			return EmbedContent.content(tplData, tplFile, this);

		let errors = {};

		tplData = CtrlMain.stripTags(tplData, ['dd_start_ts', 'dd_end_ts', 's_e_title','t_e_notice', 's_e_address', 's_tags']);

		tplData['t_e_text'] = CtrlMain.cheerio(tplData['t_e_text']).root().cleanTagEvents().html();

		if (!tplData['dd_start_ts'])
			errors['dd_start_ts'] = "Укажите дату начала события";

		if (!tplData['dd_end_ts'])
			errors['dd_end_ts'] = "Укажите дату завершения события";

		if (!tplData['s_e_title'])
			errors['s_e_title'] = "Укажите название события";

		if (!tplData['t_e_notice'])
				errors['t_e_notice'] = "Укажите анонс события";

		if (!tplData['t_e_text'])
				errors['t_e_text'] = "Укажите описание события";

		if (!tplData['s_e_address'])
			errors['s_e_address'] = "Укажите адрес события";

		if (!tplData['f_e_lat'] || !tplData['f_e_lng'])
			errors['s_e_address'] = "Укажите адрес события";

		return Promise.resolve(errors)
			.then((errors) =>
			{
				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('location').geoCoder(tplData['s_e_address'])
						.then( (locationData) =>
						{
							return this.getClass('location').create(locationData);
						})
						.then( (location_id) =>
						{
							tplData['i_location_id'] = location_id;
							return Promise.resolve(tplData);
						});
				}
			})
			.then((tplData) =>
			{
				return this.getClass('events')
					.add(this.getUserId(), tplData['s_e_title'], tplData['t_e_notice'],
						tplData['t_e_text'], tplData['s_e_address'], tplData['f_e_lat'],
						tplData['f_e_lng'], tplData['i_location_id'], tplData['dd_start_ts'],
						tplData['dd_end_ts']
					)
					.then((eventData)=>
					{
						return this.getClass('keywords').saveKeyWords(
							this.getClass('events'), eventData['e_id'],
							tplData['s_tags'],  1, eventData['e_start_ts']
						).then(()=>
						{
							return Promise.resolve(eventData['e_id']);
						});
					})
					.then( (i_event_id) => 
					{
						process.nextTick(()=>
						{
							const Mailer = new Mail(CtrlMain.appConfig.mail.service);

							let title = 'Новое МотоСобытие на сайте www.MotoCommunity.ru';
							let sendParams = {
								//to:         '',
								subject:    title,
								tplName:    'events/new',
								tplData: {
									title: title,
									links: 'https://'+this.getHostPort(),
									link: 'http://'+this.getHostPort(),
									link_to: [this.getMenuItem['m_path'],'edit',i_event_id].join('/')
								}
							};

							Mailer.send(sendParams,  (err) => 
							{
								if(err)
									Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
							});
						});

						tplData['i_event_id'] = i_event_id;
						this.view.setTplData(tplFile, tplData);
						return Promise.resolve(true);
					});
			})
			.catch(Errors.ValidationError,  (err) => 
			{
				//такие ошибки не уводят со страницы.
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			});
	}

	/**
	 * форма редактирования события
	 *
	 */
	editActionGet()
	{
		let {i_event_id} = this.routeArgs;

		if (!i_event_id)
			throw new Errors.HttpStatusError(404, "Not found");

		return this.getClass('events').get(i_event_id)
			.then((event) =>
			{
				if (!event)
					throw new Errors.HttpStatusError(404, "Not found");

				return Promise.all([
					this.getClass('events').getImageList(event['e_id']),
					this.getClass('keywords').getKeyWordList()
				])
					.spread((images, keywords) =>
					{
						//images[0] - это объекты картинок
						//images[1] это ссылки на картинки в одном массиве allPreviews
						return Promise.resolve([event, images[0], images[1], keywords]);
					});
			})
			.spread((event, images, allPreviews, keywords) =>
			{
				if (this.getLocalAccess()['post_upload'])
				{
					let uploadConfigName = this.getClass('events').constructor.uploadConfigName;

					Object.assign(event, FileUpload.createToken(uploadConfigName, {'e_id': event['e_id']}) );
					this.getRes().expose(FileUpload.exposeUploadOptions(uploadConfigName), 'eventsUploadOpts');
				}

				let tplFile = "events";
				let tplData = { event: event, eventImages: images, eventLocations: null, selectedDate: {} };

				let now = new Date();
				this._setSelectedDateObj();
				tplData['selectedDate']['obj'] = {i_yy:now.getFullYear(), i_mm:now.getMonth()+1, i_dd:now.getDate()};

				this.view.setTplData(tplFile, tplData);

				this.view.setPageTitle(event['e_title']);
				this.view.setPageH1(event['e_title']);
				//экспрот данных в JS на клиента
				this.getRes().expose(tplData['event'], 'eventData');
				this.getRes().expose(tplData['eventImages'], 'eventImages');
				this.getRes().expose(allPreviews, 'eventImagesPreviews');
				this.getRes().expose(keywords, 'keyWords');

				return Promise.resolve(null);
			});
	}

	/**
	 * редактируем трек по его id
	 *
	 * @returns {Promise}
	 */
	editActionPost()
	{
		let tplFile = "events/edit.ejs";
		let tplData = this.getParsedBody();
		
		if (tplData['b_load_embed_content'])
			return EmbedContent.content(tplData, tplFile, this);
		
		if (!tplData['i_event_id'] || !tplData['btn_save_event'])
			throw new Errors.HttpError(404);
		
		//console.log(tplData);
		switch(tplData['btn_save_event'])
		{
			case 'main':
				return this._editEvent(tplData, tplFile);
				break;
			
			case 'sort_img':
				return this._sortImg(tplData, tplFile);
				break;
			
			case 'del_img':
				return this._delImg(tplData, tplFile);
				break;
			
			case 'del_event':
				return this._delEvent(tplData, tplFile);
				break;
		}
	}

	_editEvent(tplData, tplFile)
	{
		return this.getClass('events').get(tplData['i_event_id'])
			.then((eventData) =>
			{
				if (!eventData)
					throw new Errors.HttpStatusError(404, "Not found");

				let errors = {};

				tplData = CtrlMain.stripTags(tplData, ['dd_start_ts', 'dd_end_ts', 's_e_title', 't_e_notice', 's_e_address', 's_tags']);

				tplData['t_e_text'] = CtrlMain.cheerio(tplData['t_e_text']).root().cleanTagEvents().html();

				if (!tplData['dd_start_ts'])
					errors['dd_start_ts'] = "Укажите дату начала события";

				if (!tplData['dd_end_ts'])
					errors['dd_end_ts'] = "Укажите дату завершения события";

				if (!tplData['s_e_title'])
					errors['s_e_title'] = "Укажите название события";

				if (!tplData['t_e_notice'])
					errors['t_e_notice'] = "Укажите анонс события";

				if (!tplData['t_e_text'])
					errors['t_e_text'] = "Укажите описание события";

				if (!tplData['s_e_address'])
					errors['s_e_address'] = "Укажите адрес события";

				if (!tplData['f_e_lat'] || !tplData['f_e_lng'])
					errors['s_e_address'] = "Укажите адрес события";

				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('location').geoCoder(tplData['s_e_address'])
						.then( (locationData) =>
						{
							return this.getClass('location').create(locationData);
						})
						.then( (location_id) =>
						{
							tplData['i_location_id'] = location_id;
							return Promise.resolve([tplData, eventData]);
						});
				}
			})
			.spread((tplData, eventData) =>
			{
				return Promise.all([
					this.getClass('events').edit(
						tplData['i_event_id'], this.getUserId(),
						tplData['s_e_title'], tplData['t_e_notice'], tplData['t_e_text'], tplData['s_e_address'],
						tplData['f_e_lat'], tplData['f_e_lng'], tplData['i_location_id'], tplData['dd_start_ts'], tplData['dd_end_ts']
					),
					this.getClass('keywords').saveKeyWords(
							this.getClass('events'), eventData['e_id'], tplData['s_tags'],
							1, eventData['e_start_ts']
						)
				])
					.then(()=>
					{
						return Promise.resolve(tplData);
					});
			})
			.then((tplData) =>
			{
				process.nextTick(()=>
				{
					const Mailer = new Mail(CtrlMain.appConfig.mail.service);

					let title = 'Изменено МотоСобытие на сайте www.MotoCommunity.ru';
					let sendParams = {
						//to:         '',
						subject:    title,
						tplName:    'events/new',
						tplData: {
							title: title,
							links: 'https://'+this.getHostPort(),
							link: 'http://'+this.getHostPort(),
							link_to: this.getMenuItem['m_path']+'/edit/'+tplData['i_event_id']
						}
					};

					Mailer.send(sendParams,  (err) =>
					{
						if(err)
							Logger.error(new Errors.AppMailError('Ошибка при отправке письма', err));
					});
				});

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch(Errors.ValidationError, (err) =>
			{
				//такие ошибки не уводят со страницы
				this.view.setTplData(tplFile, err.data);

				return Promise.resolve(true);
			});
	}

	/**
	 * сорхранение позиций фотографий после их сортировке на клиенте
	 *
	 * @param tplData
	 * @param tplFile
	 */
	_sortImg(tplData, tplFile)
	{
		if (!tplData['i_event_id'] || !tplData.hasOwnProperty('file_pos') || !tplData['file_pos'].length)
			throw new Errors.HttpError(400);
		
		return this.getClass('events').sortImgUpd(tplData['i_event_id'], tplData['file_pos'])
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				
				return Promise.resolve(true);
			});
	}
	/**
	 * просмотр событий на карте
	 *
	 * @returns {Promise}
	 */
	/*mapActionGet()
	{
		return Promise.props({
			eventList: this.getClass('events').getAll(),
			eventLocations: this.getClass('events').getLocations()
		})
			.then((props) => {

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

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}*/

	/**
	 * добавляем фотографи к событию
	 *
	 * @returns {Promise}
	 */
	uploadActionPost()
	{
		let tplFile = 'events/event_images.ejs';
		let tplData = this.getParsedBody();

		this.getRes().on('cancelUploadedFile', (file) =>
		{
			if (file['u_id'] && file['e_id'] && file['f_id'])
				return this.getClass('events').delImage(file['u_id'], file['e_id'], file['f_id'], file);
		});

		return this.getClass('events').uploadImage(this.getUserId(), this.getReq(), this.getRes())
			.then( (file) =>
			{
				//console.log(file);
				tplData = {
					e_id: file.e_id,
					f_id: file.f_id,
					f_pos: file.f_pos,
					f_name: file.f_name,
					f_type: file.type,
					f_latitude: file.latitude,
					f_longitude: file.longitude,
					u_id: file.u_id,
					name: file.name,
					size: file.size,
					previews: file.previews
				};
				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			})
			.catch( (err) =>
			{
				Logger.error(err);
				tplData.formError.text = err.message;
				tplData.formError.error = true;
				tplData.formError.errorName = err.name;

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(true);
			});
	}

	/**
	 * удаление фотографии пользователем
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise}
	 */
	_delImg(tplData, tplFile)
	{
		if (!tplData['i_f_id'])
			throw new Errors.HttpError(400);
		
		return this.getClass('events')
			.delImage(this.getUserId(), tplData['i_event_id'], tplData['i_f_id'])
			.then( () =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}

	/**
	 * удаление указанного события
	 *
	 * @param tplData
	 * @param tplFile
	 * @returns {Promise.<T>}
	 */
	_delEvent(tplData, tplFile)
	{
		return this.getClass('events').delEvent(this.getUserId(), tplData['i_event_id'])
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			});
	}
}

//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Events;