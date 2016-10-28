/**
 * Created by ra on 25.10.16.
 */
"use strict";

const Logger = require('app/lib/logger');
const Promise = require("bluebird");
const FileUpload = require('app/lib/file/upload');
const FileErrors = require('app/lib/file/errors');
const Path = require('path');

const Base = require('app/lib/class');

class Motoshop extends Base
{
	/**
	 * добавляем новый мотосалон
	 *
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	add(mts_name, mts_website, mts_email, mts_descrip)
	{
		return this.model("motoshop").add(mts_name, mts_website, mts_email, mts_descrip);
	}
	
	/**
	 * данные мотосалона по его id
	 * 
	 * @param mts_id
	 * @returns {*}
	 */
	getMotoshop(mts_id)
	{
		return this.model("motoshop").getMotoshop(mts_id)
			.bind(this)
			.then(function (motoshop)
			{
				return this.model("motoshop").getMotoshopAddressList(mts_id)
					.then(function (addressList)
					{
						motoshop["address_list"] = addressList || [];
						return Promise.resolve(motoshop);
					});
			});
	}

	/**
	 * редактируем мотосалон
	 *
	 * @param mts_id
	 * @param mts_name
	 * @param mts_website
	 * @param mts_email
	 * @param mts_descrip
	 * @returns {*}
	 */
	edit(mts_id, mts_name, mts_website, mts_email, mts_descrip)
	{
		return this.model("motoshop").edit(mts_id, mts_name, mts_website, mts_email, mts_descrip);
	}

	/**
	 * добавляем адрес
	 *
	 * @param mts_id
	 * @param mts_address_website
	 * @param mts_address_email
	 * @param mts_address_phones
	 * @param mts_address
	 * @param mts_address_lat
	 * @param mts_address_lng
	 */
	addAddress(mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng)
	{
		return Promise.resolve(mts_address)
			.bind(this)
			.then(function (mts_address)
			{
				const self = this;

				return this.getClass('location').geoCoder(mts_address)
					.then(function (locationData)
					{
						//возвращает location_id
						return self.getClass('location').create(locationData);
					});
			})
			.then(function (location_id)
			{
				let {gps_lat, gps_lng} = this.getClass('location').coordConvert(mts_address_lat, mts_address_lng);

				return this.model("motoshop").addAddress(mts_id, mts_address_website, mts_address_email, mts_address_phones, mts_address, mts_address_lat, mts_address_lng, gps_lat, gps_lng, location_id);
			});
	}

	/**
	 * удаляем адрес
	 *
	 * @param mts_id
	 * @param mts_address_id
	 * @returns {*|Promise.<*>}
	 */
	delAddress(mts_id, mts_address_id)
	{
		return this.model("motoshop").delAddress(mts_id, mts_address_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Motoshop;