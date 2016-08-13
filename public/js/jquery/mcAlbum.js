(function($) {

	function formAddAlbum(options)
	{
		var html = '<form class="form-horizontal" action="'+options.uri+'" method="post" id="formAddAlbum">' +
			'<input type="hidden" name="btn_save_album" value="add_album"/>' +
			'<div class="form-group s_album_name">' +
			'<div class="col-sm-12">' +
			'<input type="text" class="form-control" id="s_album_name" name="s_album_name" value="" placeholder="название альбома *" required />' +
			'</div>' +
			'</div>' +
			'<div class="form-group s_album_text">' +
			'<div class="col-sm-12">' +
			'<textarea class="form-control" id="s_album_text" name="s_album_text" placeholder="описание альбома"></textarea>' +
			'</div>' +
			'</div>' +
			'</form>';

		return html;
	}
	
	function formAlbumUpload(options)
	{
		var html = '<form class="form-horizontal text-center" action="'+options.uri+'/upload"  enctype="multipart/form-data" method="post" target="null_frame" id="formAlbumUpload">' +
			'<input type="hidden" name="btn_save_album" value="album_image_upload"/>' +
			'<input type="hidden" name="s_token" value="'+options.s_token+'"/>' +
			'<input type="hidden" name="i_time" value="'+options.i_time+'"/>' +
			'<input type="hidden" name="a_id" value="'+options.a_id+'"/>' +
			'<div class="form-group uploadWrapper">' +
			'<input type="file" name="album_image_upload" id="album_image_upload" style="display: none;"/>' +
			'</div>' +
			'</form>';

		return html;
	}

	function imageDialog(img, params)
	{
		var defaults = {
			id: ''
		};

		var options = $.extend({}, defaults, params);
		var imgSrc = (img["previews"] && img["previews"]["1024_768"] ? img["previews"]["1024_768"] : '/_0.gif');


		var htmlDialog = '';
		htmlDialog += '<div class="modal fade" id="'+options.id+'" tabindex="-1" role="dialog" aria-labelledby="'+options.id+'">';
		htmlDialog += '<div class="albumImageDialog modal-dialog" role="document">';
		htmlDialog += '<div class="modal-content">';
			htmlDialog += '<div class="modal-header">';

			htmlDialog += ''+
				'<div class="btn-toolbar displayInlineBlock" role="toolbar" aria-label="Опции фотографии">' +
				'<div class="btn-group btn-group-xs" role="group" aria-label="опции фотографии">' +
					'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">опции <span class="caret"></span></button>' +
					'<ul class="dropdown-menu dropdown-menu-left">' +
						'<li><a href="javascript:void(0)">удалить</a></li>' +
						'<li><a href="javascript:void(0)">Another action</a></li>' +
						'<li><a href="javascript:void(0)">Something else here</a></li>' +
						'<li role="separator" class="divider"></li>' +
						'<li><a href="javascript:void(0)">Separated link</a></li>' +
					'</ul>'+
				'</div>' +
				'<div class="btn-group btn-group-xs" role="group" aria-label="посмотреть на карте">' +
					'<button type="button" class="btn btn-default" id="btn_img_map"><span class="fa fa-fw fa-map-marker"></span></button>' +
				'</div>'+
				'</div>';

		
			htmlDialog += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="textCenter modal-body">';
				htmlDialog += '<div id="imgMap" data-map-init="false" style="display: none;"></div>';
				htmlDialog += '<img src="'+imgSrc+'" class="imageInModal" alt=""/>';
			htmlDialog += '<textarea placeholder="описание фотографии">'+img["ai_text"]+'</textarea>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="textCenter modal-footer">';
			htmlDialog += '</div>';
		htmlDialog += '</div>';
		htmlDialog += '</div>';
		htmlDialog += '</div>';

		return htmlDialog;
	}
	function onChangeImgText(imgData, options, text)
	{
		var postData = {
			"btn_save_album": "upd_img_text"
			,"s_ai_text": text
			,"i_ai_id": imgData["ai_id"]
			,"i_a_id": imgData["a_id"]
		};

		$.ajax({
			url: options.uri,
			method: "POST",
			data: postData,
			dataType: "json"
		})
			.done(function(resData)
			{
				console.log(resData);
			})
			.fail(function(resData)
			{
				console.log(resData);
			});
	}

	function onImgMap(img, $modal)
	{
		if(!window["mcMap"]) return;

		var $img = $modal.find('.modal-body img.imageInModal');
		var $imgMap = $modal.find('#imgMap');

		$imgMap.css({
			width: $modal.find('.modal-body').width(),
			height: $modal.find('.modal-body').height()
		});

		if (($imgMap.attr('data-map-init') == 'true'))
		{
			$imgMap.toggle();
			$img.toggle();

			return;
		}

		var mapState = {
			center: [img["ai_latitude"], img["ai_longitude"]]
			, controls: ["zoomControl"]
			, zoom: 16
		};

		var mapOptions = {};

		mcMap.init('imgMap', {state: mapState, options: mapOptions}, function (imgMap)
		{
			$imgMap.toggle();
			$img.toggle();

			imgMap.behaviors.disable('multiTouch');
			imgMap.behaviors.disable('scrollZoom');

			var imgPlacemark = new ymaps.Placemark(imgMap.getCenter(),
				{
					//balloonContentHeader: 'Заголовок балуна',
					balloonContentBody: '<div><img src="'+img["previews"]["320_213"]+'"/></div>'
				},
				{
					balloonCloseButton: false,
					balloonPanelMaxMapArea: 0
				}
			);

			imgMap.geoObjects.add(imgPlacemark);
			imgPlacemark.balloon.open();
		});
	}

	function onShowBsModal($modal, img, options)
	{
		var w = Math.floor($(window).width() - ($(window).width() * 0.43));
		var h = Math.floor($(window).height() - ($(window).height() * 0.2));

		var $modalBody = $modal.find('.albumImageDialog .modal-body');

		$modalBody.find('> img').one('load', function ()
		{
			if (this.width >= this.height)
			{
				$modal.find('.albumImageDialog').css('width', w);
				$(this).css('width', w-2).removeClass('vertical').addClass('horizontal');
			}
			else
			{
				$modal.find('.albumImageDialog').css('height', h);
				$(this).css('height', h-2).removeClass('horizontal').addClass('vertical');
			}
		});
		$modalBody.on('change', 'textarea', function ()
		{
			onChangeImgText(img, options, $(this).val());
		});

		$modal.find('#btn_img_map').attr('disabled',  true);
		if (img["ai_latitude"] && img["ai_longitude"])
		{
			$modal.find('#btn_img_map').attr('disabled',  false);
			$modal.on('click', '#btn_img_map', function (event)
			{
				event.preventDefault();
				event.stopPropagation();
				onImgMap(img, $modal);
			});
		}

		//$modalBody.on('click', 'btn_img_map', function (){});
	}

	function openImageDialog($img, params, albumImages)
	{
		var defaults = {};
		var options = $.extend({}, defaults, params);

		var img = null;
		var i;
		for(i in albumImages)
		{
			if (albumImages[i].hasOwnProperty("ai_id") && albumImages[i]["ai_id"] == $img.attr("data-img-id"))
			{
				img = albumImages[i];
				break;
			}
		}

		if (!img) return;

		options.id = '_album_img_dialog_'+img["ai_id"];

		var $imageDialog = $(imageDialog(img, options))
			.appendTo('body')
			.modal('hide')
			.on('show.bs.modal', function (event)
			{
				onShowBsModal($(this), img, options);

				console.log("$mcDialog.on('show.bs.modal', function (event)");
			})
			.on('shown.bs.modal', function (event)
			{
				console.log("$mcDialog.on('shown.bs.modal', function (event)");
			})
			.on('hidden.bs.modal', function (event)
			{
				$(this).remove();
				console.log("$mcDialog.on('hidden.bs.modal', function (event)");
			}).modal('show');
	}

	$.fn.mcAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, albumToolbar: null
			, albumWrapper: null //список фоток в альбоме
			, albumImages: null //список фоток в альбоме
			, s_token: null
			, i_time: null
			, a_id: null
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/
		
		var $albumToolbar = $(options.albumToolbar);
		var $albumWrapper = $(options.albumWrapper);
		var $albumImages = $(options.albumWrapper+' '+options.albumImages);

		var	$btnAddAlbum = $albumToolbar.find('#btn_add_album_modal');
		var	$btnAlbumUpload = $albumToolbar.find('#btn_album_upload');

		$btnAddAlbum.click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			$('__add_album_dialog__').mcDialog({
				title: 'Создание нового альбома'
				, body: formAddAlbum(options)
				, onOpen: function ($dialog)
				{
					$dialog.find('#formAddAlbum').postRes({
						btnId: $dialog.find('#btn_add_album'),
						onSuccess: function($respDialog, resp)
						{
							if(resp["a_id"])
								window.location.href = options.uri +'/'+resp["a_id"]+'/';

							//не показать диалог
							return false;
						},
						onFail: function ($respDialog, resp)
						{
							$dialog.hide();
							return true;
						},
						onClose: function ($respDialog)
						{
							$dialog.show();
						}
					});
				}
				, buttons: [
					{
						title: 'сохранить'
						, name: 'btn_add_album'
						, cssClass: 'btn-success'
						/*, func:
						{
							"click": function(event)
							{
								var $dialog = $(event.data[0]);
								//$dialog.find('#formAddAlbum').submit();
								//$(event.data[0]).modal('hide');
							}
						}*/
					},
					{
						title: 'отменить'
						,name: 'btn_add_album_cancel'
						,cssClass: 'btn-danger'
						,func:
						{
							"click": function(event)
							{
								$(event.data[0]).modal('hide');
							}
						}
					}
				]
			});
		});

		var albumUploadOpts = (MCJS["albumUploadOpts"] ? MCJS["albumUploadOpts"] : null);

		if (albumUploadOpts)
		{
			albumUploadOpts.onEnd = function()
			{
				var filesUploaded = ($(this).data('uploadFileData') ? $(this).data('uploadFileData') : null);
				console.log('filesUploaded');
				console.log(filesUploaded);

				$(this).parents('.modal').find('.modal-footer').show();

			};

			albumUploadOpts.onStart = function()
			{
				$(this).parents('.modal').find('.modal-footer').hide();
			};

			$btnAlbumUpload.click(function (event)
			{
				event.preventDefault();
				event.stopPropagation();

				$('__upload_album_dialog__').mcDialog({
					title: 'Загрузить новый фотографии в альбом'
					, body: formAlbumUpload(options)
					, onOpen: function ($dialog)
					{
						$dialog.find('#album_image_upload').fileUpload(albumUploadOpts);
					}
					, buttons: [
						{
							title: 'закрыть'
							,name: 'btn_upload_album_close'
							,cssClass: 'btn-danger'
							,func:
						{
							"click": function(event)
							{
								$(event.data[0]).modal('hide');
							}
						}
						}
					]
				});
			});
		}

		var albumImages = (MCJS["albumImages"] ? MCJS["albumImages"] : null);
		var albumPreviews = (MCJS["albumPreviews"] ? MCJS["albumPreviews"] : null);

		if(albumPreviews)
		preloadImages(albumPreviews);

		if ($albumImages)
		{
			$albumWrapper.on('click', options.albumImages +' img', function (event)
			{
				//console.log();
				openImageDialog($(this), options, albumImages);
			});
		}
		
		return $(this);
	}
})(jQuery);