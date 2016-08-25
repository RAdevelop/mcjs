"use strict";

//const Errors = require('app/lib/errors');
const Promise = require("bluebird");
const Base = require('app/lib/class');

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
	create(locationData)
	{
		const self = this;

		for(let i = 0; i < locationData.length; i++)
		{
			//чтобы в таблицах location не сохранять улицы и дома...
			if (locationData[i]["kind"].toLowerCase() == 'street' || locationData[i]["kind"].toLowerCase() == 'house')
			{
				console.log(locationData[i]["kind"]);
				locationData.splice(i, 1);
				i--;
			}
		}

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
}
//************************************************************************* module.exports
//писать после class Name....{}
module.exports = Location;