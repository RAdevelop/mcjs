/**
 * Created by ra on 25.10.16.
 */
"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Pages = require("app/lib/pages");
const CtrlMain = require('app/lib/controller');

let limit_per_page = 2;

class Motoshop extends CtrlMain
{
	/**
	 * @see Base.routePaths()
	 * @returns {{index: {^\/?$: Array}}}
	 */
	static routePaths()
	{
		return {
			"index": {
				'^\/?[0-9]+\/page\/[1-9]+[0-9]*\/?$': ['i_loc_id', ,'i_page'],
				'^\/?[0-9]+\/\\S+\/?$': ['i_mts_id','s_mts_alias'],
				'^\/?[0-9]+\/?$': ['i_loc_id'],
				'^\/?$': null
			},
			"add": {
				'^\/?$': null
			},
			"edit": {
				'^\/?[0-9]+\/?$': ['i_mts_id']
				,'^\/?$': null
			},
			"map": {
				'^\/?$': null
			}
		}
	}
	
	/**
	 *
	 * @returns {Promise}
	 */
	indexActionGet()
	{
		let {i_mts_id, i_loc_id} = this.routeArgs;
		let mts_show = (this.getLocalAccess()['post_edit'] ? null : 1);

		if(i_loc_id)
			return this.motoshopList(i_loc_id, mts_show);

		return this.motoshopData(i_mts_id, mts_show)
			.spread((motoshop, motoshopList, motoshopLocations) =>
			{
				let tplData = {};
				tplData.motoshop = motoshop || null;
				tplData.motoshopList = motoshopList || null;
				tplData.motoshopLocations = motoshopLocations || null;

				let tplFile = "motoshop";
				if (motoshop)
				{
					this.getRes().expose(motoshop, 'motoshop');

					this.view.setPageTitle(motoshop["mts_name"]);
					this.view.setPageH1(motoshop["mts_name"]);
					this.view.setPageDescription(CtrlMain.cheerio(motoshop["mts_descrip"]).text());
				}

				this.view.setTplData(tplFile, tplData);

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * что показывать - указанный салон, или список ...
	 *
	 * @param i_mts_id
	 * @param mts_show
	 * @returns {Promise}
	 */
	motoshopData(i_mts_id, mts_show)
	{
		if (i_mts_id)
			return this.motoshop(i_mts_id, mts_show);

		return this.motoshopLocations(1);
	}

	/**
	 * список мотосалонов для указанной локации
	 * 
	 * @param i_loc_id
	 * @param mts_show
	 * @returns {Promise}
	 */
	motoshopList(i_loc_id, mts_show)
	{
		let {i_page=1} = this.routeArgs;
		
		return Promise.props({
			list: this.getClass("motoshop").getMotoshopListByLocId(i_loc_id, mts_show, new Pages(i_page, limit_per_page)),
			location: this.getClass("location").getLocationById(i_loc_id)
		})
			//.spread((motoshopList, Pages)
			.then((props) =>
			{
				//если не нашли список салонов
				if (!props.list[0])
					throw new Errors.HttpError(404);

				let tplData = {};
				tplData.motoshopList = props.list[0];

				let Pages = props.list[1];

				let tplFile = '';
				let isAjax = this.getReq().xhr;
				if (isAjax)
				{
					tplFile = 'motoshop/list.ejs';
				}
				else
				{
					tplFile = 'motoshop';
					tplData.motoshop = null;
					tplData.motoshopLocations = null;
					tplData.location = props.location;

					this.view.setPageTitle(tplData.location["l_name"], true);
					this.view.setPageH1(tplData.location["l_name"], true);
					this.view.setPageDescription(this.view.getPageTitle());
				}
				
				Pages.setLinksUri([this.getBaseUrl(), i_loc_id].join('/'));

				tplData["pages"] = Pages.pages();

				this.view.setTplData(tplFile, tplData, isAjax);

				if (!isAjax)
				{
					this.getRes().expose(tplData["pages"], 'pages');
					this.getRes().expose(tplData.motoshopList, 'motoshopList');
				}

				return Promise.resolve(isAjax);
			});
	}

	/**
	 * выбранный салон
	 *
	 * @param i_mts_id
	 * @param mts_show
	 * @returns Promise spread data [motoshop, motoshopList]
	 * @throws Errors.HttpStatusError
	 */
	motoshop(i_mts_id, mts_show)
	{
		let {s_mts_alias=null} = this.routeArgs;

		return this.getClass('motoshop')
			.getMotoshop(i_mts_id, mts_show)
			.then((motoshop) =>
			{
				if (!motoshop || s_mts_alias != motoshop["mts_alias"])
					throw new Errors.HttpError(404);

				return Promise.resolve([motoshop, null, null]);
			});
	}

	/**
	 * список населенных пунктов
	 *
	 * @returns Promise spread data [motoshop, motoshopList, motoshopLocations]
	 */
	motoshopLocations(mts_show)
	{
		return this.getClass("motoshop").getMotoshopLocations(mts_show)
			.then((motoshopLocations) =>
			{
				return Promise.resolve([null, null, motoshopLocations]);
			});
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
	 * @returns {Promise}
	 */
	addActionPost()
	{
		let tplData = this.getParsedBody();
		
		let errors = {};
		
		tplData = CtrlMain.stripTags(tplData, ["s_mts_name", "m_mts_email", "link_mts_website"]);
		tplData["t_mts_descrip"] = CtrlMain.cheerio(tplData["t_mts_descrip"]).root().cleanTagEvents().html();

		tplData["b_mts_show"] = (tplData["b_mts_show"] ? '1': '0');

		if (!tplData["s_mts_name"])
			errors["s_mts_name"] = "Укажите название";
		
		if (!tplData["link_mts_website"])
			errors["link_mts_website"] = "Укажите веб-сайт";
		else
			tplData["link_mts_website"] = tplData["link_mts_website"].replace(/^https?:\/\//gi, '');

		if (!tplData["m_mts_email"])
			errors["m_mts_email"] = "E-mail указан не верно";

		let tplFile = "motoshop/edit.ejs";

		return Promise.resolve(errors)
			.then((errors) => {

				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('motoshop').add(
						this.getUserId(),
						tplData["b_mts_show"],
						tplData["s_mts_name"],
						tplData["link_mts_website"],
						tplData["m_mts_email"],
						tplData["t_mts_descrip"]
					)
						.then((i_mts_id) => {
							tplData["i_mts_id"] = i_mts_id;

							this.view.setTplData(tplFile, tplData);
							return Promise.resolve(true);
						});
				}
			})
			.catch(Errors.ValidationError, (err) =>
			{//такие ошибки не уводят со страницы.
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) => {
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
			throw new Errors.HttpError(404);

		let mts_show = null;

		return this.getClass('motoshop')
			.getMotoshop(i_mts_id, mts_show)
			.then((motoshop) => {
				if (!motoshop)
					throw new Errors.HttpError(404);

				let tplFile = "motoshop";
				let tplData = {
					motoshop: motoshop
				};
				this.view.setTplData(tplFile, tplData);

				//экспрот данных в JS на клиента
				this.getRes().expose(tplData["motoshop"], 'motoshop');

				return Promise.resolve(null);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * обновляем данные
	 *
	 * @returns {Promise}
	 */
	editActionPost()
	{
		let tplData = this.getParsedBody();

		if (!tplData["i_mts_id"])
			throw new Errors.HttpError(404);

		return this.getClass('motoshop').getMotoshop(tplData["i_mts_id"])
			.then((motoshop) => {
				
				if (!motoshop)
					throw new Errors.HttpError(404);

				switch (tplData["btn_save_motoshop"])
				{
					default:
						throw new Errors.HttpError(400);
						break;

					case 'main':
						return this.edit(tplData);
						break;

					case 'delete':
						return this.delMotoshop(tplData);
						break;

					case 'add_address':
						return this.addAddress(tplData);
						break;

					case 'del_address':
						return this.delAddress(tplData);
						break;

					case 'edit_address':
						return this.editAddress(tplData, motoshop);
						break;
				}
			});
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

		return Promise.resolve(tplData)
			.then((tplData) =>
			{
				tplData = CtrlMain.stripTags(tplData, ["s_mts_name", "m_mts_email", "link_mts_website"]);
				tplData["t_mts_descrip"] = CtrlMain.cheerio(tplData["t_mts_descrip"]).root().cleanTagEvents().html();

				tplData["b_mts_show"] = (tplData["b_mts_show"] ? '1' : '0');

				let errors = {};

				if (!tplData["s_mts_name"])
					errors["s_mts_name"] = "Укажите название";

				if (!tplData["link_mts_website"])
					errors["link_mts_website"] = "Укажите веб-сайт";
				else
					tplData["link_mts_website"] = tplData["link_mts_website"].replace(/^https?:\/\//gi, '');

				if (!tplData["m_mts_email"])
					errors["m_mts_email"] = "E-mail указан не верно";

				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('motoshop').edit(
						this.getUserId(),
						tplData["i_mts_id"],
						tplData["b_mts_show"],
						tplData["s_mts_name"],
						tplData["link_mts_website"],
						tplData["m_mts_email"],
						tplData["t_mts_descrip"]
					)
						.then(() => {
							this.view.setTplData(tplFile, tplData);
							return Promise.resolve(true);
						});
				}
			})
			.catch(Errors.ValidationError, (err) =>
			{ //такие ошибки не уводят со страницы

				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) => {
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

		return Promise.resolve(tplData)
			.then((tplData) => {

				tplData = CtrlMain.stripTags(tplData, ["s_mts_address", "s_mts_address_phones", "m_mts_address_email", "link_address_website"]);

				tplData["b_mts_address_show"] = (tplData["b_mts_address_show"] ? '1' : '0');

				let errors = {};

				if (!tplData["s_mts_address_phones"])
					errors["s_mts_address_phones"] = "Укажите телефон(ы)";

				if (!tplData["link_address_website"])
					errors["link_address_website"] = "Укажите веб-сайт";
				else
					tplData["link_address_website"] = tplData["link_address_website"].replace(/^https?:\/\//gi, '');

				if (!tplData["m_mts_address_email"])
					errors["m_mts_address_email"] = "E-mail указан не верно";

				if (!tplData["s_mts_address"] || !tplData["f_mts_address_lat"] || !tplData["f_mts_address_lng"])
					errors["s_mts_address"] = "Укажите адрес";

				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('motoshop').addAddress(
						tplData["i_mts_id"],
						tplData["b_mts_address_show"],
						tplData["link_address_website"],
						tplData["m_mts_address_email"],
						tplData["s_mts_address_phones"],
						tplData["s_mts_address"],
						tplData["f_mts_address_lat"],
						tplData["f_mts_address_lng"]
					)
						.then((i_mts_address_id) =>
						{
							tplData['i_mts_address_id'] = i_mts_address_id;

							this.view.setTplData(tplFile, tplData);
							return Promise.resolve(true);
						});
				}
			})
			.catch(Errors.ValidationError, (err) =>
			{ //такие ошибки не уводят со страницы
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * редактируем адрес
	 *
	 * @param tplData
	 * @param motoshop
	 */
	editAddress(tplData, motoshop)
	{
		let tplFile = "motoshop/edit.ejs";

		return Promise.resolve(motoshop)
			.then((motoshop) => {

				let found = false;

				motoshop["address_list"].forEach((item) =>
				{

					if (item["mts_address_id"] == tplData["i_mts_address_id"])
						found = true;
				});

				if (!found)
					throw new Errors.HttpError(404);

				tplData = CtrlMain.stripTags(tplData, ["s_mts_address", "s_mts_address_phones", "m_mts_address_email", "link_address_website"]);

				tplData["b_mts_address_show"] = (tplData["b_mts_address_show"] ? '1' : '0');

				let errors = {};

				if (!tplData["s_mts_address_phones"])
					errors["s_mts_address_phones"] = "Укажите телефон(ы)";

				if (!tplData["link_address_website"])
					errors["link_address_website"] = "Укажите веб-сайт";
				else
					tplData["link_address_website"] = tplData["link_address_website"].replace(/^https?:\/\//gi, '');

				if (!tplData["m_mts_address_email"])
					errors["m_mts_address_email"] = "E-mail указан не верно";

				if (!tplData["s_mts_address"] || !tplData["f_mts_address_lat"] || !tplData["f_mts_address_lng"])
					errors["s_mts_address"] = "Укажите адрес";

				if (this.parseFormErrors(tplData, errors))
				{
					return this.getClass('motoshop').editAddress(
						tplData["i_mts_address_id"],
						tplData["b_mts_address_show"],
						tplData["link_address_website"],
						tplData["m_mts_address_email"],
						tplData["s_mts_address_phones"],
						tplData["s_mts_address"],
						tplData["f_mts_address_lat"],
						tplData["f_mts_address_lng"]
					)
						.then(() => {
							this.view.setTplData(tplFile, tplData);
							return Promise.resolve(true);
						});
				}
			})
			.catch(Errors.ValidationError, (err) =>
			{ //такие ошибки не уводят со страницы
				this.view.setTplData(tplFile, err.data);
				return Promise.resolve(true);
			})
			.catch((err) =>
			{
				throw err;
			});
	}

	/**
	 * удаляем мотосалон
	 *
	 * @param tplData
	 * @returns {Promise.<T>}
	 */
	delMotoshop(tplData)
	{
		let tplFile = "motoshop/edit.ejs";

		return this.getClass('motoshop')
			.delMotoshop(tplData["i_mts_id"])
			.then((tplData) =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch((err) => {
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
		
		return this.getClass('motoshop')
			.delAddress(tplData["i_mts_id"], tplData["i_mts_address_id"])
			.then(() =>
			{
				this.view.setTplData(tplFile, tplData);
				return Promise.resolve(true);
			})
			.catch((err) =>
			{
				throw err;
			});
	}

	/**
	 * просмотр на карте
	 *
	 * @returns {Promise.<T>}
	 */
	mapActionGet()
	{
		let mts_show = (this.getLocalAccess()['post_edit'] ? null : 1);
		return Promise.props({
			motoshopList: this.getClass("motoshop").getAllMotoshop(mts_show),
			motoshopLocations: this.getClass("motoshop").getMotoshopLocations(mts_show)
		})
			.then((props) =>
			{
				let mtsIds = [];
				props.motoshopList.forEach((item) =>
				{
					mtsIds.push(item["mts_id"]);
				});

				return this.getClass("motoshop")
					.getMotoshopAddressList(mtsIds, mts_show)
					.then((addressList) =>
					{
						let tplData = {
							motoshop: null,
							//motoshopList: motoshopList || [],
							motoshopLocations: props.motoshopLocations || []
						};

						let tplFile = "motoshop/map.ejs";
						this.view.setTplData(tplFile, tplData);

						//экспрот данных в JS на клиента
						this.getRes().expose(props.motoshopList, 'motoshopList');
						this.getRes().expose(props.motoshopLocations, 'motoshopLocations');
						this.getRes().expose(addressList, 'motoshopAddressList');
						props = null;
						return Promise.resolve(null);

					});
			})
			.catch((err) =>
			{
				throw err;
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;