"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');
const MultiGeocoder = require('multi-geocoder');

/**
 * настройки для MultiGeocoder и/или MultiGeocoder.geocode
 * @type {{key: string, provider: string, coordorder: string, lang: string}}
 */
let geoCoderParams = {
	"key":"AHy-CE4BAAAADqsNQAIA3ZriqBuo870Gl1cLkXxrpQAYADIAAAAAAAAAAADcFU_vLH4W4XzN8vPPrNIH-NWHiw==",
	"provider": "yandex",
	"coordorder": "latlong",
	"lang": "ru_RU"
};

class Location extends Base
{
	/**
	 *
	 * добавляем локацию по данным массива, получненного от работы с картой яндекса
	 * @param locationData
	 * [
	 * {
			"coords": features[i]["geometry"]["coordinates"],
			"lat": features[i]["geometry"]["coordinates"][0],
			"lng": features[i]["geometry"]["coordinates"][1],
			"kind": GeocoderMetaData["kind"],
			"text": GeocoderMetaData["text"],
			"name": locationNames[i]
		}
	 ]
	 */
	create(locationData = [])
	{
		if (locationData.length == 0)
			throw new Errors.ValidationError('Не удалось определить указанный населенный пункт');

		for(let i = 0; i < locationData.length; i++)
		{
			//https://tech.yandex.ru/maps/doc/geocoder/desc/reference/kind-docpage/
			switch (locationData[i]["kind"].toLowerCase())
			{
				//чтобы в таблицах location не сохранять улицы и дома...
				case 'country':
				case 'province':
				case 'area':
				case 'district':
				case 'locality':
					break;
				default:
					//console.log(locationData[i]["kind"]);
					locationData.splice(i, 1);
					i--;
					break;
			}
		}

		if (locationData.length == 0)
			throw new Errors.ValidationError('Не удалось определить указанный населенный пункт');
		
		return Promise.reduce(locationData, (pId, location) =>
		{
			return this.addLocation(pId, location["name"], location["lat"], location["lng"], location["kind"], location["text"])
				.then((inPid) =>
				{
					return inPid;
				});
		}, 0); //0 - pId с начала считаем равным 0
	}

	/**
	 * добавляем локацию
	 *
	 * @param inPid
	 * @param inName
	 * @param lat
	 * @param lng
	 * @param kind
	 * @param fullName
	 * @returns {Promise}
	 */
	addLocation(inPid = 0, inName, lat, lng, kind, fullName)
	{
		return this.model('location').addLocation(inPid, inName, lat, lng, kind, fullName);
	}

	/**
	 * прямое геокодирование адреса s_location (пример): страна, область, город...
	 *
	 * примечание:
	 * 1) у GeoCoder.geocode нельзя добавить в цепочку вызовов catch((err){})
	 * 2) и метод bind(this)
	 *
	 * @param s_location
	 * @returns {Promise}
	 */
	geoCoder(s_location)
	{
		s_location = s_location.split(',').map((str) => { return str.trim();}).join(',');
		let locationNames = s_location.split(',');
		/*
		console.log("locationNames");
		console.log(locationNames);
		console.log('-------');*/

		let size = locationNames.length;
		let locationArr = [];

		for(let i = size; i > 0; i--)
		{
			locationArr.push( s_location.split(',', i).join(','));
		}
		locationArr = locationArr.reverse();

		const GeoCoder = new MultiGeocoder(geoCoderParams);

		//return GeoCoder.geocode(locationArr,{lang: 'ru_RU', kind: 'locality'})
		return GeoCoder.geocode(locationArr, geoCoderParams)
			.then((res) => {
				//console.log(res["errors"]);

				//provider: yandex
				let features = res["result"]["features"];

				let locationData = [];
				for (let i in features)
				{
					let GeocoderMetaData = features[i]["properties"]["metaDataProperty"]["GeocoderMetaData"];
					//console.log(GeocoderMetaData);

					//if (locationNames[i] != features[i]["properties"]["name"])
					//if (locationNames[i] != GeocoderMetaData["text"])
					//	continue;

					locationData.push({
						"coords": features[i]["geometry"]["coordinates"],
						"lat": features[i]["geometry"]["coordinates"][0],
						"lng": features[i]["geometry"]["coordinates"][1],
						"kind": GeocoderMetaData["kind"],
						"text": GeocoderMetaData["text"],
						"name": features[i]["properties"]["name"]
						//"name": locationNames[i]
					});
				}

				//console.log(locationData.length +' == '+ locationArr.length);
				//console.log(locationData);

				if (res["errors"].length || !locationData.length || locationData.length != locationArr.length)
					throw new Errors.ValidationError('Не удалось определить указанный населенный пункт');

				return Promise.resolve(locationData);
			});
	}

	/**
	 * прообразуем координаты в строку: градусы минуты секунды
	 *
	 * 55.560469 -> 55° 33′38″N
	 *
	 * @param lat
	 * @param lng
	 *
	 * @use mixin from Helpers
	 *
	 * @returns {{gps_lat: string, gps_lng: string}}
	 */
	coordConvert(lat, lng)
	{
		if (!lat || !lng)
		{
			return {
				gps_lat: '',
				gps_lng: ''
			};
		}
		let latG, latMin, latSec, lngG, lngMin, lngSec;

		let latArr = lat.toString().split('.');

		latG = latArr[0];
		latArr = (this.helpers.getDecimal(lat)*60);

		latSec = Math.round(this.helpers.getDecimal(latArr)*60);
		latMin = latArr.toString().split('.')[0];


		let lngArr = lng.toString().split('.');

		lngG = lngArr[0];
		lngArr = (this.helpers.getDecimal(lng)*60);

		lngSec = Math.round(this.helpers.getDecimal(lngArr)*60);
		lngMin = lngArr.toString().split('.')[0];

		let NS = (latG < 0 ? 'S' : 'N');
		let EW = (latG < 0 ? 'W' : 'E');

		return {
			gps_lat: Math.abs(latG) + '&deg; '+ latMin + '&prime;' + latSec + '&Prime;'+NS,
			gps_lng: Math.abs(lngG) + '&deg; '+ lngMin + '&prime;' + lngSec + '&Prime;'+EW
		};
	}

	/**
	 * получаем данные локации по ее id
	 *
	 * @param loc_id
	 * @returns {Promise}
	 */
	getLocationById(loc_id)
	{
		return this.model("location").getLocationById(loc_id);
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Location;