/**
 * @required
 *  Bluebird
 *  api-maps.yandex
 */
(function ($)
{
	if (window["McTinymce"]) return;


	function editorOnChange()
	{
		//console.log('editorOnChange');

		//this.setContent(McTinymce.cleanTagEvents(this.getContent()));

		//domTreeWalker(this, McTinymce.tinymce);

		//McTinymce.tinymce.triggerSave();
	}

	function editorOnSubmit()
	{
		//McTinymce.save(this);
	}

	var defaultSkin =  {
		language: "ru_RU"
	,   content_css: "/css/style.css"
	,   themes: "modern"
	,   setup: function (editor)
		{
			editor.on('change', editorOnChange);

			//сабмит формы
			editor.on('submit', editorOnSubmit);
		}/*,
		 plugins: [
		 'lists link charmap preview',
		 'searchreplace wordcount visualblocks visualchars code fullscreen',
		 'table contextmenu paste'
		 ]*/
	,   plugins: [
			'link charmap preview code wordcount paste',
			//'template',
			//'searchreplace  visualblocks visualchars  fullscreen',
			//'table contextmenu paste'
		]
		, menubar:false
		, relative_urls : false
		, paste_data_images: false
		, paste_as_text: true
		, toolbar1: 'code | undo redo | bold italic | bullist numlist outdent indent | link unlink'
		, toolbar2: 'paste | removeformat preview template'
		//, valid_elements: '*[*]' //TODO закомментировать! разрешает все теги и все атрибуты у них
		//, extended_valid_elements: '*[*]' //TODO закомментировать! разрешает все теги и все атрибуты у них
		/*,   templates: [
			//TODO использовать в блогах, новостях... в plugins добавить template
			{title: 'заголовок шаблона 1', description: 'описание шаблона 1', content: '<p>пример контента из шаблона</p>'},
			{title: 'заголовок шаблона 2', description: 'описание шаблона 2', url: 'development.html'}
		]*/
	};

	var skins = {
			default: defaultSkin
		,   visualblocks: $.extend({}, defaultSkin, {
				visualblocks_default_state: true
			,   end_container_on_empty_block: true
			,   plugins: ['link charmap preview code wordcount paste visualblocks']
			})
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
				return Promise.resolve(tinymce.init(options));
			})
			.then(function (editor)
			{
				return editor[0];
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
		return Promise.resolve(typeof tinymce != 'undefined')
			.then(function (isInit)
			{
				if (isInit)
					return Promise.resolve(true);

				return new Promise(function(resolve, reject)
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
				return Promise.resolve(tinymce);
			})
			.fail(function (err)
			{
				console.log(err);
				return Promise.reject(err);
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

	McTinymce.save = function(editor, cb)
	{
		console.log("start McTinymce.save");
		console.log("");

		McTinymce.tinymce.triggerSave();
		editor.setContent(McTinymce.cleanTagEvents(editor.getContent()));

		clearEmptyTags(editor, McTinymce.tinymce);

		editor.setContent(editor.getContent());
		//$('#'+editor.id).val(editor.getContent());
		McTinymce.tinymce.triggerSave();

		console.log("");
		console.log("end McTinymce.save");

		if (cb && typeof cb == 'function') return cb();
		//return editor;
	};

	function clearEmptyTags(editor, tinymce)
	{
		var first = editor.getBody();
		var walker = new tinymce.dom.TreeWalker(first.firstChild, editor.getBody());

		var tagNamesFilter = ['img'];
		var regExp, indx;
		//var reEmpty = /^(&nbsp;)+|(\<br\s*\/?\s*\>)+|\s+$/ig;
		var reEmpty = /^((&nbsp;)*(\<br\s*\/?\s*\>)*(\s)*)+$/ig;

		do
		{
			if (walker.current().nodeType != 1 || tagNamesFilter.indexOf(walker.current().nodeName.toLowerCase()) != -1)
				continue;
			
			if(reEmpty.test(walker.current().innerHTML))
			{
				//console.log(indx, walker.current());
				regExp = new RegExp('('+walker.current().outerHTML+')+', 'ig');
				editor.getBody().innerHTML = editor.getBody().innerHTML.replace(regExp, '');
			}

		} while (walker.next());

		regExp = null;

		editor.setContent(editor.getContent());

		tinymce.triggerSave();
	}

	window.McTinymce = McTinymce;

})(jQuery);