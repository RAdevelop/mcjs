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
		{
			return true;
		}
		else
		{
			return false;
		}
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

		function init()
		{
			$('#'+self.mapId).attr('data-map-init', 'true');
			self.map = new ymaps.Map(self.mapId, state, options);
		}

		return Bluebird.resolve(typeof ymaps != 'undefined')
			.then(function (is_ymaps)
			{
				if (is_ymaps)
					return Bluebird.resolve(true);

				//загружаем api-maps.yandex.ru
				return new Bluebird(function(resolve, reject)
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
				return Bluebird.reject(err);
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
	McMap.locationByLatLng = function (latitude, longitude, kind, results)
	{
		kind = kind || 'locality';
		results = results || 1;

		return ymaps.geocode([latitude, longitude], {kind: kind, results: results})
			.then(function (res)
			{
				if (!res.metaData.geocoder.found)
					throw new ErrorMcMapGetLocation();

				var info = res.geoObjects.get(0).properties.get('metaDataProperty')["GeocoderMetaData"];

				var location = {
					coords: [latitude, longitude],
					lat: latitude,
					lng: longitude,
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
			}),
			geolocation.get({
				provider: 'browser',
				mapStateAutoApply: true
			})
		]).then(function(res)
		{
			if (!res.metaData.geocoder.found)
				throw new ErrorMcMapGetLocation();

			var info = res.geoObjects.get(0).properties.get('metaDataProperty')["GeocoderMetaData"];
			var coords = res.geoObjects.position;
			console.log( info );
			console.log( coords );

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