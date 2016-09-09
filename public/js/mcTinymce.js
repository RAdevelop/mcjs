/**
 * @required
 *  Bluebird
 *  api-maps.yandex
 */
(function ($)
{
	if (window["McTinymce"]) return;


	var skins = {
		default: {
			language: "ru_RU"
			, content_css: "/css/style.css"
			, themes: "modern"
			, setup: function (editor)
			{
				editor.on('change', function ()
				{
					//console.log('tinymce.triggerSave()');

					this.setContent(McTinymce.cleanTagEvents(this.getContent()));

					tinymce.triggerSave();
				});

				//сабмит формы
				editor.on('submit', function ()
				{
					this.setContent(McTinymce.cleanTagEvents(this.getContent()));

					tinymce.triggerSave();
				});
			}/*,
			 plugins: [
			 'lists link charmap preview',
			 'searchreplace wordcount visualblocks visualchars code fullscreen',
			 'table contextmenu paste'
			 ]*/
			,plugins: [
				'link charmap preview code wordcount paste template',
				//'searchreplace  visualblocks visualchars  fullscreen',
				//'table contextmenu paste'
			]
			, menubar:false
			, paste_data_images: false
			, paste_as_text: true
			, toolbar1: 'code | undo redo | bold italic | bullist numlist outdent indent | link unlink'
			, toolbar2: 'paste | removeformat preview template'
			//, valid_elements: '*[*]' //TODO закомментировать! разрешает все теги и все атрибуты у них
			, templates: [
				//TODO использовать в блогах, новостях... в plugins добавить template
				{title: 'заголовок шаблона 1', description: 'описание шаблона 1', content: '<div>пример контента из шаблона</div>'},
				{title: 'заголовок шаблона 2', description: 'описание шаблона 2', url: 'development.html'}
			]
		}
	};

	function McTinymce(params, skin, vers)
	{
		params = params || {};

		if (!skins[skin])
			skin = 'default';

		vers = vers || McTinymce.vers;

//https://www.tinymce.com/docs/demo/classic/
		
		var options = $.extend({}, skins[skin], params);

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

	McTinymce.tagEventList = function ()
	{
		var eventList = [
			'click',
			'contextmenu',
			'dblclick',
			'mousedown',
			'mouseenter',
			'mouseleave',
			'mousemove',
			'mouseover',
			'mouseout',
			'mouseup',


			'keydown',
			'keypress',
			'keyup',


			'abort',
			'beforeunload',
			'error',
			'hashchange',
			'load',
			'pageshow',
			'pagehide',
			'resize',
			'scroll',
			'unload',


			'blur',
			'change',
			'focus',
			'focusin',
			'focusout',
			'input',
			'invalid',
			'reset',
			'search',
			'select',
			'submit',


			'drag',
			'dragend',
			'dragenter',
			'dragleave',
			'dragover',
			'dragstart',
			'drop',


			'copy',
			'cut',
			'paste'
		];

		eventList = eventList.map(function (elem)
		{
			return 'on'+elem;
		}).concat(eventList);

		return eventList;
	};


	/**
	 * читстим html теги от атрибутов-событий (типа: click, onclick....)
	 * @param html
	 * @returns html
	 */
	McTinymce.cleanTagEvents = function (html)
	{
		var eventList = McTinymce.tagEventList();
		var events = '['+eventList.join('],[')+']';

		return $('<wrap>'+html+'</wrap>')
			.find(events)
			.each(function (i, elem)
			{
				eventList.forEach(function (attr)
				{
					if ( $(elem).has('['+attr+']'))
						$(elem).removeAttr(attr);
				});
			})
			.end().html();
	};

	window.McTinymce = McTinymce;

})(jQuery);