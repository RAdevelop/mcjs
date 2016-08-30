"use strict";

const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');
const MultiGeocoder = require('multi-geocoder');

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

		const self = this;

		for(let i = 0; i < locationData.length; i++)
		{
			//чтобы в таблицах location не сохранять улицы и дома...

			//if (locationData[i]["kind"].toLowerCase() == '' || locationData[i]["kind"].toLowerCase() == '')

			//https://tech.yandex.ru/maps/doc/geocoder/desc/reference/kind-docpage/
			switch (locationData[i]["kind"].toLowerCase())
			{
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
		
		return Promise.reduce(locationData, function(pId, location)
		{
			return self.addLocation(pId, location["name"], location["lat"], location["lng"], location["kind"], location["text"])
				.then(function(inPid)
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
	 * @returns {*|Promise.<TResult>}
	 */
	addLocation(inPid = 0, inName, lat, lng, kind, fullName)
	{
		return this.model('location').addLocation(inPid, inName, lat, lng, kind, fullName);
	}

	/**
	 * прямое геокодирование адреса s_location (пример): страна, область, город...
	 *
	 * примечание:
	 * 1) у GeoCoder.geocode нельзя добавить в цепочку вызовов catch(function(err){})
	 * 2) и метод bind(this)
	 *
	 * @param s_location
	 * @returns {Promise.<TResult>|*}
	 */
	geoCoder(s_location)
	{
		s_location = s_location.split(',').map(function(str){ return str.trim();}).join(',');
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

		const GeoCoder = new MultiGeocoder({ provider: 'yandex', coordorder: 'latlong', lang: 'ru-RU', kind: 'house' });

		//locationArr = ["Россия, Москва, Вадковский переулок, 3Ас11"];
		//console.log(locationArr);

		//return GeoCoder.geocode(locationArr,{lang: 'ru-RU', kind: 'locality'})
		return GeoCoder.geocode(locationArr,{lang: 'ru-RU'})
			.then(function (res)
			{
				//console.log(res["errors"]);
				//console.log(res);

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

				if (res["errors"].length || locationData.length != locationArr.length)
					throw new Errors.ValidationError('Не удалось определить указанный населенный пункт');

				return Promise.resolve(locationData);
			});
	}
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Location;