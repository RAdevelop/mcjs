(function ($)
{
	if (window["mcMap"]) return;

	var mcMap = {
		init: function (id, params, cb)
		{
			var mapIsInit = $('#'+id).attr('data-map-init');

			if (mapIsInit == 'true' || mapIsInit == '1') return;

			params.state = params.state || {};
			params.options = params.options || {};

			var defaultsState = {
				center: [55.76, 37.64],
				zoom: 10
			};

			var defaultsOptions = {};

			var state = $.extend({}, defaultsState, params.state);
			var options = $.extend({}, defaultsOptions, params.options);

			function init()
			{
				$('#'+id).attr('data-map-init', 'true');
				cb(new ymaps.Map(id, state, options));
			}

			ymaps.ready(init);
		},
		locationByLatLng: function (latitude, longitude, kind, results)
		{
			kind = kind || 'locality';
			results = results || 1;

			return ymaps.geocode(coords, {kind: kind, results: results})
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
		}
	};

	window.mcMap = mcMap;

})(jQuery);