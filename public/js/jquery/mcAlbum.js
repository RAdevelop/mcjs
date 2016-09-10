(function($) {

	$.fn.mcAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, u_id: null
			, album: null
			, albumToolbar: null
			, albumWrapper: null //родитель списка фоток в альбоме
			, albumImages: null //список фоток в альбоме
			, albumName: null
			, albumText: null
			, s_token: null
			, i_time: null
			, sortable: false
		};

		//var albumImages = (MCJS["albumImages"] ? MCJS["albumImages"] : []);
		MCJS["albumImages"] = MCJS["albumImages"] || [];
		var albumPreviews = (MCJS["albumPreviews"] ? MCJS["albumPreviews"] : []);
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		options.album = (MCJS["album"] ? MCJS["album"] : {});
		options.is_owner = (options.album.a_is_owner);

		var $albumToolbar = $(options.albumToolbar);
		var $albumWrapper = $(options.albumWrapper);
		var $albumImages = $(options.albumWrapper+' '+options.albumImages);
		var $albumName = $(options.albumName);
		var $albumText = $(options.albumText);

		var	$btnAddAlbum = $albumToolbar.find('#btn_add_album_modal');
		var	$btnEditAlbum = $albumToolbar.find('#btn_edit_album_modal');
		var	$btnAlbumUpload = $albumToolbar.find('#btn_album_upload');

		function formAddAlbum(options)
		{
			options.aName = options.aName.htmlspecialchars(options.aName) || '';
			options.aText = options.aText.htmlspecialchars(options.aText) || '';

			var a_id = (options.album && options.album.a_id  && options.album.a_is_owner ? options.album.a_id : null);

			var html = '<form class="form-horizontal" action="'+options.uri+'" method="post" id="formAddAlbum">' +
				'<input type="hidden" name="btn_save_album" value="'+options.btnSaveAlbumVal+'"/>' +
				'<input type="hidden" name="i_u_id" value="'+options.u_id+'"/>' +
				'<input type="hidden" name="i_a_id" value="'+a_id+'"/>' +
				'<div class="form-group s_album_name">' +
				'<div class="col-sm-12">' +
				'<input type="text" class="form-control" id="s_album_name" name="s_album_name" value="'+options.aName+'" placeholder="название альбома *" required maxlength="100"/>' +
				'</div>' +
				'</div>' +
				'<div class="form-group t_album_text">' +
				'<div class="col-sm-12">' +
				'<textarea class="form-control" id="t_album_text" name="t_album_text" placeholder="укажите описание альбома" maxlength="255">'+options.aText+'</textarea>' +
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
				'<input type="hidden" name="a_id" value="'+options.album.a_id+'"/>' +
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
			var origSrc = (img["previews"] && img["previews"]["orig"] ? img["previews"]["orig"] : null);

			var ai_text = img["ai_text"].htmlspecialchars(img["ai_text"]);

			var htmlDialog = '';
			htmlDialog += '<div class="modal " id="'+options.id+'" tabindex="-1" role="dialog" aria-labelledby="'+options.id+'">';
			htmlDialog += '<div class="albumImageDialog modal-dialog" role="document">';
			htmlDialog += '<div class="modal-content">';
			htmlDialog += '<div class="modal-header">';

			htmlDialog += ''+
				'<div class="btn-toolbar displayInlineBlock" role="toolbar" aria-label="Опции фотографии">' +
				'<div class="btn-group btn-group-sm" role="group" aria-label="опции фотографии">' +
				'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">опции <span class="caret"></span></button>' +
				'<ul class="dropdown-menu dropdown-menu-left">' +
				'<li><a href="javascript:void(0);">Another action</a></li>';
			if(origSrc)
			{
				htmlDialog += '<li><a href="' + origSrc + '" target="blank">оригинал</a></li>';
			}
			if (options.is_owner)
			{
				htmlDialog += '<li role="separator" class="divider"></li>'
				htmlDialog += '<li><a href="javascript:void(0);" id="btn_album_image_del_modal">удалить</a></li>'
			}

			htmlDialog += '</ul>'
			htmlDialog += '</div>' +
				'<div class="btn-group btn-group-sm" role="group" aria-label="посмотреть на карте" data-toggle="tooltip" title="посмотреть на карте" data-container="body" data-placement="bottom">' +
					'<button type="button" class="btn btn-default" id="btn_img_map"><span class="fa fa-fw fa-map-marker"></span></button>' +
				'</div>'+
				'</div>';


			htmlDialog += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="modal-body">';
				htmlDialog += '<div class="imageModalBody">';
					htmlDialog += '<div id="imgMap" data-map-init="false" class="mcMap" style="display: none;"></div>';
					htmlDialog += '<img src="'+imgSrc+'" class="imageInModal" alt=""/>';
				htmlDialog += '</div>';
				htmlDialog += '<div class="imageModalContent">';

					htmlDialog += '<h5>'+$albumName.text()+'</h5>';
			if (options.is_owner)
			{
				htmlDialog += '<textarea id="imageText" placeholder="укажите описание фотографии">'+ai_text+'</textarea>';
			}
			else
			{
				htmlDialog += '<div>'+img["ai_text"]+'</div>';
			}

				htmlDialog += 'imageModalContentimageModalContent imageModalContent';
				htmlDialog += '</div>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="textCenter modal-footer">';
			htmlDialog += '</div>';
			htmlDialog += '</div>';
			htmlDialog += '</div>';
			htmlDialog += '</div>';

			return htmlDialog;
		}

		function onChangeImgText(imgData, options, $text)
		{
			var postData = {
				"btn_save_album": "upd_img_text"
				,"t_ai_text": $text.val()
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
					if (!resData["formError"] || !resData["formError"]["error"])
					{
						var text = resData["t_ai_text"];
						updImg(imgData["ai_id"], {"ai_text": text});
						$text.val( text);
					}
				})
				.fail(function(resData)
				{
					console.log(resData);
				});
		}

		function onAlbumImageDel($modal, $img, img, options)
		{
			$('__album_image_delete_dialog__').mcDialog({
				title: 'Удаление фотографии'
				, body: 'Вы действительно хотите удалить фотографию?'
				, buttons: [
					{
						title: 'удалить'
						, name: 'btn_album_image_delete'
						, cssClass: 'btn-success'
						, func: {
						"click": function (event)
						{
							$(event.data[0]).modal('hide');

							var  postData = {
								'btn_save_album': 'del_img',
								'i_a_id': options.album.a_id,
								'i_ai_id': img["ai_id"]
							};

							$.ajax({
								url: options.uri,
								method: "POST",
								data: postData,
								dataType: "json"
							})
								.done(function(resData)
								{
									console.log('on done');
									console.log(resData);
									if (!resData["formError"] || !resData["formError"]["error"])
									{
										$modal.modal('hide');
										$img.parent().remove();
										var imgCnt = parseInt($(options.albumName).parent().find('.albumImgCnt').text(), 10) - 1;

										imgCnt = (!imgCnt ? 0 : imgCnt);
										$(options.albumName).parent().find('.albumImgCnt').text(imgCnt);

										updImg(img["ai_id"]);//удалим
									}
								})
								.fail(function(resData)
								{
									console.log('on fail');
									console.log(resData);

									$('__album_image_delete_fail_dialog__').mcDialog({
										title: resData.responseJSON.error.message
									});

								});
						}
					}
					},
					{
						title: 'отменить'
						,name: 'btn_add_album_cancel'
						,cssClass: 'btn-danger'
						,func: {
						"click": function(event)
						{
							$(event.data[0]).modal('hide');
						}
					}
					}
				]
			});
		}

		function onImgMap(img, $modal, ImgMcMap)
		{
			var $img = $modal.find('.modal-body img.imageInModal');
			var $mcMap = $modal.find('#'+ImgMcMap.getMapId());

			$mcMap.css({
				//width: $modal.find('.modal-body').width(),
				height: $mcMap.parent().css('max-height')
			});

			if (ImgMcMap.isInit())
			{
				$mcMap.toggle();
				$img.toggle();
				return;
			}

			ImgMcMap.init()
				.then(function (imgMcMap)
				{
					$mcMap.toggle();
					$img.toggle();

					imgMcMap.behaviors.disable('multiTouch');
					imgMcMap.behaviors.disable('scrollZoom');

					var imgPlacemark = new ymaps.Placemark(imgMcMap.getCenter(),
						{
							//balloonContentHeader: 'Заголовок балуна',
							balloonContentBody: '<div class="albumImageInMapBalloon"><img src="'+img["previews"]["512_384"]+'"/></div>'
						},
						{
							balloonCloseButton: false,
							balloonPanelMaxMapArea: 0
						}
					);

					imgMcMap.geoObjects.add(imgPlacemark);
					imgPlacemark.balloon.open();

					return ymaps.vow.resolve(imgMcMap);
				})
				.then(function (imgMcMap)
				{
					return McMap.locationByLatLng(imgMcMap.getCenter()[0], imgMcMap.getCenter()[1], 'house', 1)
						.then(function (location)
						{
							imgMcMap.hint.open(imgMcMap.getCenter(),
								location["text"]
							);

							return ymaps.vow.resolve(location);
						});
				})
				.fail(function (err)
				{
					console.log(err);
				});
		}

		function getNextImg($imgInModal, $modal, $img, img, options)
		{
			var $images = $(options.albumWrapper).find(".image");
			var index = $images.index($img.parents(".image"));
			var indexNext = parseInt(index, 10) + 1;

			if (index == $images.size() - 1 && window["Pagination"])
			{
				$imgInModal.css('opacity', 0.5);

				Pagination.clickNextPageBtn(function ($btnNextPage)
				{
					setTimeout(function ()
					{
						$( $(options.albumWrapper).find(".image").get(indexNext) ).find('> img').click();
						$modal.modal('hide');
					}, Pagination.scrollDelayMs);
				});
				return;
			}
			$modal.modal('hide');
			$($images.get(indexNext)).find('> img').click();
		}

		function getPrevImg($imgInModal, $modal, $img, img, options)
		{
			$modal.modal('hide');

			var $images = $(options.albumWrapper).find(".image");
			var index = $images.index($img.parents(".image"));

			if (index == 0)
				return;

			var indexPrev = parseInt(index, 10) - 1;
			$($images.get(indexPrev)).find('> img').click();
		}

		function bindGetPrevNextImg($currentImg, $modal, $img, img, options)
		{
			$currentImg.one( "swipeleft click", function (event)
			{
				getNextImg($(this), $modal, $img, img, options);
			} );
			$currentImg.one( "swiperight", function (event)
			{
				getPrevImg($(this), $modal, $img, img, options);
			} );
		}

		function onShowBsModal($modal, $img, img, options)
		{
			var winW = Math.floor($(window).width());
			var winH = Math.floor($(window).height());
			var portrait = (winW < winH);
			//var landscape = (winW >= winH);

			var smallWin = (winW <= 768);
			var deltaW, deltaH, w, h;

			//deltaW = (smallWin ? (portrait ? 0.2 : 0.27) : 0.43);
			deltaW = 0.05;
			deltaH = (smallWin ? (portrait ? 0.2 : 0.35) : 0.15);
			//deltaH = 0.2;

			w = Math.ceil(winW - (winW * deltaW));
			h = Math.ceil(winH - (winH * deltaH));

			var $modalBody = $modal.find('.albumImageDialog .modal-body');

			$modalBody.find('.imageModalBody img.imageInModal').one('load', function ()
			{
				bindGetPrevNextImg($(this), $modal, $img, img, options);
				var imgHorizontal = (this.width >= this.height);

				/*alert(
				 'winH = ' + winH + '\n'
				 +'h = ' + h + '\n'
				 +'smallWin = ' + smallWin + '\n'
				 +'imgHorizontal = ' + imgHorizontal + '\n'
				 +'portrait = ' + portrait + '\n'
				 );*/

				if (smallWin)
				{
					$modal.find('.albumImageDialog').css('height', h);
					if ( (portrait && !imgHorizontal) || !portrait)
					{
						$(this).css('max-height', h-2);
					}

					$(this).parent().css('max-height', h-2);
				}
				else
				{
					//if (!imgHorizontal)
					$(this).css('max-height', h-2).parent().css('max-height', h-2);

					var ratio = (h / this.height);
					//alert(ratio);
					w = (ratio >= 1 ? this.width + this.width * ratio : this.width - this.width * ratio);
					w = (imgHorizontal && w > 1024 ? 1024 : w);

					//$(this).css('max-width', w-2);
					//$(this).parent().css('max-width', w-2);

					//console.log('ratio = ' + ratio);
					//console.log('w = ' + w);

					$modal.find('.albumImageDialog').css('width', 'auto');
					$modal.find('.albumImageDialog').css('min-width', w);
				}
			});
			$modalBody.on('change', '.imageModalContent textarea#imageText', function ()
			{
				onChangeImgText(img, options, $(this));
			});

			$modal.find('#btn_img_map').attr('disabled',  true);

			if (img["ai_latitude"] && img["ai_longitude"] && window["McMap"])
			{
				$modal.find('#btn_img_map').attr('disabled',  false);

				var mapState = {
					center: [img["ai_latitude"], img["ai_longitude"]]
					, controls: ["zoomControl"]
					, zoom: 16
				};
				var mapOptions = {};
				var ImgMcMap = new McMap('imgMap', {state: mapState, options: mapOptions});

				$modal.on('click', '#btn_img_map', function (event)
				{
					event.preventDefault();
					event.stopPropagation();
					onImgMap(img, $modal, ImgMcMap);
				});
			}

			$modal.on('click', '.modal-header #btn_album_image_del_modal', function (event)
			{
				event.preventDefault();
				event.stopPropagation();

				onAlbumImageDel($modal, $img, img, options);
			});

			//$modal.on('click', 'btn_img_map', function (event){});
		}

		function getImg(ai_id)
		{
			//console.log('getImg(ai_id)');
			var img = null;
			var i;
			for(i in MCJS["albumImages"])
			{
				if (MCJS["albumImages"][i].hasOwnProperty("ai_id") && MCJS["albumImages"][i]["ai_id"] == ai_id)
				{
					img = MCJS["albumImages"][i];
					break;
				}
			}
			//console.log(img);
			//console.log('END getImg(ai_id)');
			return img;
		}

		/**
		 * обновялем данные указанной фотки в массиве фоток MCJS["albumImages"]
		 *
		 * @param ai_id
		 * @param data
		 * @returns {boolean}
		 */
		function updImg(ai_id, data)
		{
			data = data || {};
			var i;
			for(i in MCJS["albumImages"])
			{
				if ( !(MCJS["albumImages"][i].hasOwnProperty("ai_id") && MCJS["albumImages"][i]["ai_id"] == ai_id))
					continue;

				if (!data["ai_id"])
				{
					MCJS["albumImages"].splice(i, 1);
					return true;
				}
				else
				{
					MCJS["albumImages"][i] = $.extend({}, MCJS["albumImages"][i], data);
					return true;
				}
			}
			return false;
		}

		function openImageDialog($img, params)
		{
			var defaults = {};
			var options = $.extend({}, defaults, params);

			var img = getImg($img.attr("data-img-id"));

			if (!img) return;

			options.id = '_album_img_dialog_'+img["ai_id"];

			$(imageDialog(img, options))
				.appendTo('body')
				.modal('hide')
				.on('show.bs.modal', function (event)
				{
					onShowBsModal($(this), $img, img, options);

					console.log("$mcDialog.on('show.bs.modal', function (event)");
				})
				.on('shown.bs.modal', function (event)
				{
					Helpers.initTooltip();
					console.log("$mcDialog.on('shown.bs.modal', function (event)");
				})
				.on('hidden.bs.modal', function (event)
				{
					$(this).remove();
					console.log("$mcDialog.on('hidden.bs.modal', function (event)");
				}).modal('show');
		}

		function prependImgToAlbum(filesUploaded, $albumWrapper)
		{
			if (!filesUploaded || !filesUploaded.length)
				return;

			var i, image, html, imgSrc;

			for(i = 0; i < filesUploaded.length; i++)
			{
				image = filesUploaded[i];
				imgSrc = (image["previews"] && image["previews"]["512_384"] ? image["previews"]["512_384"] : '/_0.gif');
				html = '<div class="image"><img src="'+imgSrc+'" alt="'+image["ai_text"]+'" data-img-id="'+image["ai_id"]+'"/></div>';
				$albumWrapper.prepend(html);

				var imgCnt = parseInt($(options.albumName).parent().find('.albumImgCnt').text(), 10);
				imgCnt = (!imgCnt ? 0 : imgCnt) + 1;
				$(options.albumName).parent().find('.albumImgCnt').text(imgCnt);

				MCJS["albumImages"].unshift(image);
			}
		}

		if (options.sortable)
		{
			$albumWrapper.sortable({
				update: function( event, ui )
				{
					//TODO сортрировку
					console.log('TODO сортрировку');

					var imgPos = [];
					$(options.albumImages +' img').each(function (i, item)
					{
						imgPos.push($(item).attr("data-img-id"));
					});

					if (!imgPos.length)
						return;

					var postData = {
						"btn_save_album": "sort_img",
						"i_a_id": options.album.a_id,
						"ai_pos": imgPos
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
			});
		}

		$btnAddAlbum.click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();
			options.btnSaveAlbumVal = 'add_album';
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
								window.location.href = options.uri+'/'+options.u_id+'/'+resp["a_id"]+'/';

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

		$btnEditAlbum.click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();
			options.btnSaveAlbumVal = 'edit_album';
			options.aName = $albumName.text();
			options.aText = $albumText.text();
			$('__add_album_dialog__').mcDialog({
				title: 'Редактирование альбома'
				, body: formAddAlbum(options)
				, onOpen: function ($dialog)
				{
					$dialog.find('#formAddAlbum').postRes({
						btnId: $dialog.find('#btn_edit_album'),
						onSuccess: function($respDialog, resp)
						{
							//$albumName.text(resp["s_album_name"].htmlspecialchars(resp["s_album_name"]));
							//$albumText.text(resp["t_album_text"].htmlspecialchars(resp["t_album_text"]));

							$albumName.text(resp["s_album_name"]);
							$albumText.text(resp["t_album_text"]);

							//не показать диалог
							$dialog.modal('hide');
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
						, name: 'btn_edit_album'
						, cssClass: 'btn-success'
					},
					{
						title: 'отменить'
						,name: 'btn_edit_album_cancel'
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

		if (albumUploadOpts && options.is_owner)
		{
			albumUploadOpts.onEnd = function()
			{
				var filesUploaded = ($(this).data('uploadFileData') ? $(this).data('uploadFileData') : null);

				$(this).parents('.modal').find('.modal-footer').show();

				prependImgToAlbum(filesUploaded, $albumWrapper);

			};

			albumUploadOpts.onStart = function()
			{
				$(this).parents('.modal').find('.modal-footer').hide();
			};

			$btnAlbumUpload.click(function (event)
			{
				event.preventDefault();
				event.stopPropagation();

				if (!options.is_owner)
					return;

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

		if(albumPreviews.length)
		preloadImages(albumPreviews);

		$albumWrapper.on('click', options.albumImages +' img', function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			openImageDialog($(this), options);
		});
		
		return $(this);
	}
})(jQuery);