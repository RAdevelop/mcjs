/**
 * @required
 *  Bluebird
 *  api-maps.yandex
 */
(function ($)
{
	if (window["McTinymce"]) return;

	function McTinymce(params)
	{
		var vers = params.vers || McTinymce.vers;

		var defaultsOptions = {
			language: "ru_RU"
			, themes: "modern"
			, setup: function (editor) {
				editor.on('change', function () {
					//console.log('tinymce.triggerSave()');
					tinymce.triggerSave();
				});
			}/*,
			plugins: [
				'lists link charmap preview',
				'searchreplace wordcount visualblocks visualchars code fullscreen',
				'table contextmenu paste'
			]*/
			,plugins: [
				'link charmap preview code wordcount',
				//'searchreplace  visualblocks visualchars  fullscreen',
				//'table contextmenu paste'
			]
			, menubar:false
			, paste_data_images: false
			, toolbar1: 'code | undo redo | bold italic | bullist numlist outdent indent | link unlink'
			, toolbar2: 'paste | removeformat preview'
		};
//https://www.tinymce.com/docs/demo/classic/
		var options = $.extend({}, defaultsOptions, params);

		return McTinymce.load(vers)
			.then(function (tinymce)
			{
				McTinymce.tinymce = tinymce;
				return tinymce.init(options);
			});

	}

	McTinymce.tinymce = null;
	McTinymce.vers = '4.4.2';
	McTinymce.baseURL = function (vers)
	{
		return '/js/tinymce/'+vers;
	};
	McTinymce.pathTo = function (vers)
	{
		return "/js/tinymce/"+vers+"/tinymce.min.js";
	};
	/**
	 * загрузка при необходимости Tinymce
	 *
	 * @returns {*}
	 */
	McTinymce.load = function (vers)
	{
		return Bluebird.resolve(typeof tinymce != 'undefined')
			.then(function (isInit)
			{
				if (isInit)
					return Bluebird.resolve(true);

				return new Bluebird(function(resolve, reject)
				{
					$('head').append('<script src="'+McTinymce.pathTo(vers)+'" type="text/javascript" ></script>');
					return resolve(true);
					/*
					$.cachedScriptLoad(McTinymce.pathTo(vers))
						.done(function(script, textStatus)
						{
							//console.log("script", script);
							console.log("textStatus", textStatus);
							$('head').append('<script src="'+McTinymce.pathTo(vers)+'" type="text/javascript" ></script>');
							return resolve(true);
						})
						.fail(function(jqxhr, settings, exception)
						{
							return reject(exception);
						});*/
				});
			})
			.then(function ()
			{
				tinymce.baseURL = McTinymce.baseURL(vers);
				tinymce.documentBaseURL = '/';
				return Bluebird.resolve(tinymce);
			})
			.fail(function (err)
			{
				console.log(err);
				return Bluebird.reject(err);
			});
	};

	window.McTinymce = McTinymce;

})(jQuery);