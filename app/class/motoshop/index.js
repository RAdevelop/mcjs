/**
 * Created by ra on 25.10.16.
 */
"use strict";

//const Logger = require('app/lib/logger');
const Promise = require("bluebird");
//const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
//const Path = require('path');

const Base = require('app/lib/class');

class Motoshop extends Base
{
	/**
	 * добавляем новый мотосалон
	 *
	 * @param u_id
	 * @param mts_show
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {Promise}
	 */
	add(u_id, mts_show, mts_name, mts_website, mts_email, mts_descrip)
	{
		let mts_alias = this.helpers.clearSymbol(this.helpers.translit(mts_name), '-');

		return this.model("motoshop").add(u_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip);
	}
	
	/**
	 * данные мотосалона по его id
	 * 
	 * @param mts_id
	 * @param mts_show
	 * @returns {Promise}
	 */
	getMotoshop(mts_id, mts_show = null)
	{
		console.log('mts_show = ', mts_show);
		return this.model("motoshop").getMotoshop(mts_id, mts_show)
			.then((motoshop) => {

				if (!motoshop)
					return Promise.resolve(motoshop);
				
				return this.getMotoshopAddressList([mts_id], mts_show)
					.then((addressList) => {

						motoshop["address_list"] = addressList || [];
						return Promise.resolve(motoshop);
					});
			});
	}

	/**
	 * список адресов для указанного (-ых) салона
	 *
	 * @param mts_id
	 * @param show
	 * @param location_id
	 * @returns {Promise}
	 */
	getMotoshopAddressList(mts_id, show = null, location_id = null)
	{
		return this.model("motoshop").getMotoshopAddressList(mts_id, show, location_id);
	}

	/**
	 * редактируем мотосалон
	 *
	 * @param u_id
	 * @param mts_id
	 * @param mts_show
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {Promise}
	 */
	edit(u_id, mts_id, mts_show, mts_name, mts_website, mts_email, mts_descrip)
	{
		let mts_alias = this.helpers.clearSymbol(this.helpers.translit(mts_name), '-');
		return this.model("motoshop").edit(u_id, mts_id, mts_show, mts_name, mts_alias, mts_website, mts_email, mts_descrip);
	}

	/**
	 * добавляем адрес
	 *
	 * @param mts_id
	 * @param mts_show
	 * @param mts_address_website
	 * @param mts_address_email
	 * @param mts_address_phones
	 * @param mts_address
	 * @param mts_address_lat
	 * @param mts_address_lng
	 */
	addAddress(mts_id, mts_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng)
	{
		return Promise.resolve(mts_address)
			.then((mts_address) => {

				return this.getClass('location').geoCoder(mts_address)
					.then((locationData) => {
						//возвращает location_id
						return this.getClass('location').create(locationData);
					});
			})
			.then((location_id) => {

				let {gps_lat, gps_lng} = this.getClass('location').coordConvert(mts_address_lat, mts_address_lng);

				return this.model("motoshop")
					.addAddress(mts_id, mts_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id);
			});
	}

	/**
	 * редактируем адрес
	 *
	 * @param mts_address_id
	 * @param mts_address_show
	 * @param mts_address_website
	 * @param mts_address_email
	 * @param mts_address_phones
	 * @param mts_address
	 * @param mts_address_lat
	 * @param mts_address_lng
	 */
	editAddress(mts_address_id, mts_address_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng)
	{
		return Promise.resolve(mts_address)
			.then((mts_address) => {

				return this.getClass('location').geoCoder(mts_address)
					.then((locationData) => {

						//возвращает location_id
						return this.getClass('location').create(locationData);
					});
			})
			.then((location_id) => {

				let {gps_lat, gps_lng} = this.getClass('location').coordConvert(mts_address_lat, mts_address_lng);

				return this.model("motoshop")
					.editAddress(mts_address_id, mts_address_show, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id);
			});
	}

	/**
	 * удаляем мотосалон
	 *
	 * @param mts_id
	 * @returns {Promise}
	 */
	delMotoshop(mts_id)
	{
		return this.model("motoshop").delMotoshop(mts_id);
	}

	/**
	 * удаляем адрес
	 *
	 * @param mts_id
	 * @param mts_address_id
	 * @returns {Promise}
	 */
	delAddress(mts_id, mts_address_id)
	{
		return this.model("motoshop").delAddress(mts_id, mts_address_id);
	}

	/**
	 * список локаций, к которым привязан мотосалон (включая родительские районы, города, страны..)
	 *
	 * @returns {Promise}
	 */
	getMotoshopLocations(show)
	{
		return this.model('motoshop').getMotoshopLocations(show);
	}

	/**
	 * список мотосалонов
	 *
	 * @returns {Promise}
	 */
	getAllMotoshop(show)
	{
		return this.model('motoshop').getAllMotoshop(show);
	}

	/**
	 * список мотосалонов для указанной локации
	 * @param loc_id
	 * @param mts_show
	 * @param Pages
	 * @returns {Promise}
	 */
	getMotoshopListByLocId(loc_id, mts_show, Pages)
	{
		return this.model("motoshop").countMotoshopByLocId(loc_id, mts_show)
			.then((cnt) => {

				Pages.setTotal(cnt);
				if (!cnt)
					return [null, null];

				if (Pages.limitExceeded())
					return Promise.reject(new FileErrors.HttpError(404));

				return this.model("motoshop")
					.getMotoshopListByLocId(loc_id, mts_show, Pages.getLimit(), Pages.getOffset())
					.then((list) => {

						if (!list)
							return Promise.resolve([null, null]);

						let mts_ids = [];
						list.forEach((shop) => {
							mts_ids.push(shop['mts_id']);
						});

						return Promise.resolve([list, mts_ids]);
					});
			})
			.spread((list, mts_ids) => {

				if (!list || !mts_ids)
					return Promise.resolve([null, Pages]);

				return this.getMotoshopAddressList(mts_ids, mts_show, loc_id)
					.then((addressList) => {

						list.forEach((shop) => {

							addressList.forEach((address) => {
								
								if (shop['mts_id'] == address['mts_id'])
								{
									if (!shop.hasOwnProperty('address_list'))
										shop['address_list'] = [];

									shop['address_list'].push(address);
								}
							});
						});

						mts_ids = addressList = null;
						return Promise.resolve([list, Pages]);
					});
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;