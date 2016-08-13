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
	McMap.prototype.setInit = function(flag)
	{
		$('#'+this.mapId).attr('data-map-init', (flag ? 'true' : 'false'));
		return this;
	};

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
			//cb(self.map);
		}

		return ymaps.ready(init)
			.then(function ()
			{
				return ymaps.vow.resolve(self.map);
			});
	};
	McMap.prototype.getMap = function ()
	{
		return this.map;
	};
	McMap.prototype.getMapId = function ()
	{
		return this.mapId;
	};

	McMap.locationByLatLng = function (latitude, longitude, kind, results)
	{
		kind = kind || 'locality';
		results = results || 1;

		return ymaps.geocode([latitude, longitude], {kind: kind, results: results})
			.then(function (res)
			{
				var info = res.geoObjects.get(0).properties.get('metaDataProperty')["GeocoderMetaData"];

				//console.log( info );

				var location = {
					coords: [latitude, longitude],
					lat: latitude,
					lng: longitude,
					text: info["text"],
					names: info["text"].split(',').map(function(str){ return str.trim();})
				};

				//console.log( location );

				return ymaps.vow.resolve(location);
			});
	};

	window.McMap = McMap;

})(jQuery);