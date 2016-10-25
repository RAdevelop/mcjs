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

	function postRequestOnPaste(editor, event)
	{
		event.stopPropagation();

		//console.log(event.clipboardData.getData('text/plain'));

		var uri = event.clipboardData.getData('text/plain');
		if (!isLink(uri))
			return;

		//https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/

		var postData = {
			"b_load_embed_content": "1",
			"s_uri": uri
		};

		editor.setProgressState(true);
		$.ajax({
			url: 'embed_content',
			method: "POST",
			data: postData,
			dataType: "json"
		})
			.done(function(resData)
			{
				var embedContent = '';
				var $embedContent;
				if (resData["embed_url_video"])
				{
					embedContent = '<iframe src="'+resData["embed_url_video"]+'" data-link="'+uri+'" class="iframeVideoEmbed" frameborder="0" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" allowfullscreen="allowfullscreen" scrolling="no"></iframe>';

					editor.insertContent(embedContent);

					$embedContent = $(editor.getBody()).find('iframe[data-link="'+uri+'"]');
				}
				else if (resData["embed_url"] && (resData["embed_title"] || resData["embed_text"]))
				{
//https://www.adme.ru/zhizn-nauka/12-produktov-kotorye-ne-stoit-davat-detyam-do-3-let-1378615/
					embedContent = '<dl data-link="'+uri+'" class="embed_content">';

					if (resData["embed_image"])
					{
						embedContent += '<dt class="embed_content_image">';
							embedContent += '<a target="_blank" rel="nofollow" href="'+resData["embed_url"]+'">';
							embedContent += '<img data-width="" data-height="" width="" height="" class="" src="'+resData["embed_image"]+'" />';
							embedContent += '</a>';
						embedContent += '</dt>';
					}

					embedContent += '<dd class="embed_content_desc_wrap">';
						if (resData["embed_title"])
						{
							//embedContent += '<div class="embed_content_title">';
							embedContent += '<a target="_blank" rel="nofollow" href="'+resData["embed_url"]+'">';
							embedContent += resData["embed_title"];
							embedContent += '</a>';
							//embedContent += '</div>';
						}

						if (resData["embed_text"])
						{
							//embedContent += '<div class="embed_content_desc">'+resData["embed_text"].replace('&nbsp;', ' ')+'</div>';
							embedContent += resData["embed_text"];
						}
					embedContent += '</dd>';

					embedContent += '</dl>';

					editor.insertContent(embedContent.replace('&nbsp;', ' '));

					$embedContent = $(editor.getBody()).find('dl[data-link="'+uri+'"]');

					console.log(embedContent);

					if (!$embedContent.hasClass('embed_content'))
						$embedContent = null;
				}

				if ($embedContent && $embedContent.hasOwnProperty('length') && $embedContent.length)
				{
					$embedContent.parent().html($embedContent.parent().html().replace(uri, ''));
					editor.selection.select($embedContent.parent().get(0), false);
				}

				editor.setProgressState(false);

			})
			.fail(function(resData)
			{
				console.log(resData);
			});
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
			editor.on('paste', function(event){

				postRequestOnPaste(editor, event);

			});
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
			})
			.then(function (editor)
			{
				addImageToTinymce(editor);

				return editor;
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
		McTinymce.tinymce.triggerSave();
		editor.setContent(McTinymce.cleanTagEvents(editor.getContent()));

		McTinymce.clearEmptyTags(editor);

		editor.setContent(editor.getContent());
		McTinymce.tinymce.triggerSave();

		if (cb && typeof cb == 'function')
			return cb(editor);

		return editor;
	};
	
	McTinymce.clearEmptyTags = function (editor)
	{
		var tinymce = McTinymce.tinymce;
		
		var first = editor.getBody();
		var walker = new tinymce.dom.TreeWalker(first.firstChild, editor.getBody());

		var tagNamesFilter = ['area', 'base', 'br', 'col', 'command', 'doctype', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'source', 'track', 'wbr', 'iframe'];
		//var tagNamesFilter = ['img','hr'];
		var regExp;
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

	function addImageToTinymce(editor)
	{
		$(document).on('click','.imagesWrapper .imagesContainer img', function (event)
		{
			event.stopPropagation();

			var html = '<li>'+this.outerHTML+'</li>';
			editor.insertContent(html);
			$(editor.getBody()).find('img.image').closest('ul').addClass('images');
		});
	}

	window.McTinymce = McTinymce;

})(jQuery);