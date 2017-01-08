/**
 * @required
 *  Bluebird
 *  api-maps.yandex
 */
(function ($)
{
	if (window["McMap"]) return;

	function McMap(mapId, params)
	{
		this.mapId = mapId;
		this.state = params.state || {};
		this.options = params.options || {};
		this.map;
	}

	/**
	 * проверяем, была ли инициализирована "карта"
	 * @returns {boolean}
	 */
	McMap.prototype.isInit = function()
	{
		var mapIsInit = $('#'+this.mapId).attr('data-map-init');

		if (mapIsInit == 'true' || mapIsInit == '1')
			return true;
		else
			return false;
	};

	/**
	 * устанавливаем флаг, была ли инициализирована "карта"
	 *
	 * @param flag
	 * @returns {McMap}
	 */
	McMap.prototype.setInit = function(flag)
	{
		$('#'+this.mapId).attr('data-map-init', (flag ? 'true' : 'false'));
		return this;
	};

	McMap.loadingInfo = '<i class="fa fa-spinner fa-spin fa-fw"></i>&nbsp;<span>Загрузка карты...</span>';

	/**
	 * инициализация карты
	 *
	 * @returns {*}
	 */
	McMap.prototype.init = function ()
	{
		if (this.isInit())
			return ymaps.vow.resolve(this.map);
		else
			this.setInit(false);

		var defaultsState = {
			center: [55.76, 37.64],
			zoom: 10
		};

		var defaultsOptions = {};

		var state = $.extend({}, defaultsState, this.state);
		var options = $.extend({}, defaultsOptions, this.options);
		var self = this;

		$('#'+self.mapId).html(McMap.loadingInfo);

		function init()
		{
			$('#'+self.mapId).attr('data-map-init', 'true').html('');
			self.map = new ymaps.Map(self.mapId, state, options);
		}

		return Promise.resolve(typeof ymaps != 'undefined')
			.then(function (is_ymaps)
			{
				if (is_ymaps)
					return Promise.resolve(true);

				//загружаем api-maps.yandex.ru
				return new Promise(function(resolve, reject)
				{
					$.cachedScriptLoad("\/\/api-maps.yandex.ru\/2.1\/?lang=ru_RU")
						.done(function(script, textStatus)
						{
							return resolve(true);
						})
						.fail(function(jqxhr, settings, exception)
						{
							return reject(exception);
						});
				});

			})
			.then(function ()
			{
				return ymaps.ready(init)
					.then(function ()
					{
						return ymaps.vow.resolve(self.map);
					});
			})
			.fail(function (err)
			{
				console.log(err);
				throw err;
			});
	};

	/**
	 * получаем текущий объект карты
	 *
	 * @returns {ymaps.Map|*|Map}
	 */
	McMap.prototype.getMap = function ()
	{
		return this.map;
	};

	/**
	 * получаем htmlElementId в котором загружена "карта"
	 * @returns {*}
	 */
	McMap.prototype.getMapId = function ()
	{
		return this.mapId;
	};

	/**
	 *
	 * данные по расположению точки [latitude,longitude]
	 *
	 * @param latitude
	 * @param longitude
	 * @param kind
	 * @param results - кол-во результаов поиска
	 * @returns {Promise.<TResult>|*}
	 */
	McMap.locationByLatLng = function (coords, params)
	{
		var defaults = {
			results: 10
		};
		var options = $.extend( defaults, params);

		return ymaps.geocode(coords, options)
			.then(function (res)
			{
				//console.log('res', res);
				var geoObject = res.geoObjects.get(0);

				console.log('geoObject.getAll()', geoObject);

				if (!res.metaData.geocoder.found)
					throw new ErrorMcMapGetLocation();

				var info = res.geoObjects.get(0).properties.get('metaDataProperty')["GeocoderMetaData"];
				console.log('info', info);
				var location = {
					coords: coords,
					lat: coords[0],
					lng: coords[1],
					text: info["text"],
					names: info["text"].split(',').map(function(str){ return str.trim();})
				};

				return ymaps.vow.resolve(location);
			});
	};

	/**
	 * пытаемся автоматом определить координаты пользователя c помощью браузера
	 * или по IP (Яндексом)
	 *
	 * @returns {Promise}
	 */
	McMap.userLocation = function ()
	{
		var geolocation = ymaps.geolocation;

		return ymaps.vow.any([
			geolocation.get({
				provider: 'yandex',
				mapStateAutoApply: true
			})
			, geolocation.get({
				provider: 'browser',
				mapStateAutoApply: true
			})
		]).then(function(res)
		{
			//if (!res.metaData.geocoder.found)
			//	throw new ErrorMcMapGetLocation();

			if (!res.hasOwnProperty('geoObjects') || !res.geoObjects.get(0))
				throw new ErrorMcMapGetLocation();

			var info = res.geoObjects.get(0).properties.get('metaDataProperty')["GeocoderMetaData"];
			var coords = res.geoObjects.position;
			//console.log( info );
			//console.log( coords );

			var location = {
				coords: coords,
				lat: coords[0],
				lng: coords[1],
				text: info["text"],
				names: info["text"].split(',').map(function(str){ return str.trim();})
			};

			return ymaps.vow.resolve(location);
		});
	};

	/**
	 * переводим координаты в градусы минуты секунды...
	 *
	 * @param coords
	 * @returns {{lat: string, lng: string}}
	 */
	McMap.coordConvert = function (coords)
	{
		var lat = coords[0];
		var lng = coords[1];

		var latG, latMin, latSec, lngG, lngMin, lngSec;

		var latArr = lat.toString().split('.');

		latG = latArr[0];
		latArr = (getDecimal(lat)*60);

		latSec = Math.round(getDecimal(latArr)*60);
		latMin = latArr.toString().split('.')[0];


		var lngArr = lng.toString().split('.');

		lngG = lngArr[0];
		lngArr = (getDecimal(lng)*60);

		lngSec = Math.round(getDecimal(lngArr)*60);
		lngMin = lngArr.toString().split('.')[0];

		var NS = (latG < 0 ? 'S' : 'N');
		var EW = (latG < 0 ? 'W' : 'E');

		return {lat: Math.abs(latG) + '&deg; '+ latMin + '&prime;' + latSec + '&Prime;'+NS, lng: Math.abs(lngG) + '&deg; '+ lngMin + '&prime;' + lngSec + '&Prime;'+EW};
	};


	/**
	 * список ошибок, которые потом можно обработать
	 *
	 * @param message
	 * @constructor
	 */
	function ErrorMcMap(message)
	{
		message = message || "";
		this.message = message;
		Error.captureStackTrace(this, ErrorMcMap);
	}
	$.extend( ErrorMcMap, Error);
	ErrorMcMap.prototype.name = "ErrorMcMap";

	/**
	 *
	 * @param message
	 * @constructor
	 */
	function ErrorMcMapGetLocation(message)
	{
		message = message || "не удалось найти объект по указанным координатам";
		this.message = message;
		Error.captureStackTrace(this, ErrorMcMapGetLocation);
	}
	$.extend(ErrorMcMapGetLocation, ErrorMcMap);
	ErrorMcMap.prototype.name = "ErrorMcMap";

	window.McMap = McMap;

})(jQuery);