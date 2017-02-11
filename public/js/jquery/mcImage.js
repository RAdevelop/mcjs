(function($) {

	$.fn.mcImage = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			imgFieldId: ''//название поля id у картинки в json'e
			, albumImages: null //селектор для фоток в альбоме
			, albumImagesMain: null //селектор для фоток в альбоме
			, albumImagesSub: null //селектор для фоток в альбоме
			, albumImagesSubWrapper: null //селектор для wrapper'a фоток в альбоме (родитель контейнера фоток. фотки в контейнере)
			, jsonImageList: null //json дынные массива фоток в альбоме
			, jsPreviewsList: null //js массив фоток в альбоме
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		var $albumImagesMain = $(options.albumImagesMain);
		var $albumImagesSub = $(options.albumImagesSub);
		var $albumImagesSubWrapper = $(options.albumImagesSubWrapper).hide();

		if ($albumImagesMain.length && $albumImagesSub.length)
		{
			var mId;
			$albumImagesMain.each(function (mI, mItem)
			{
				mId = $(mItem).attr("data-img-id");

				$albumImagesSub.each(function (sI, sItem)
				{
					if (mId == $(sItem).attr("data-img-id"))
					{
						$albumImagesSub.splice(sI, 1);
						$(sItem).parent().remove();
					}
				});
			});

			if ($albumImagesSub.length)
			$albumImagesSubWrapper.show();
		}
		else if ($albumImagesSub.length)
		{
			$albumImagesSubWrapper.show();
		}
		var $albumImages = $(options.albumImages);

		function imageDialog(img, params)
		{
			var defaults = {
				id: ''
			};

			var options = $.extend({}, defaults, params);

			var imgSrc = (img["previews"] && img["previews"]["1024_768"] ? img["previews"]["1024_768"] : '/_0.gif');
			var origSrc = (img["previews"] && img["previews"]["orig"] ? img["previews"]["orig"] : null);

			var htmlDialog = '';
			htmlDialog += '<div class="modal " id="'+options.id+'" tabindex="-1" role="dialog" aria-labelledby="'+options.id+'">';
			htmlDialog += '<div class="imageDialog modal-dialog" role="document">';
			htmlDialog += '<div class="modal-content">';
			htmlDialog += '<div class="modal-header">';

			htmlDialog += ''+
				'<div class="btn-toolbar displayInlineBlock" role="toolbar" aria-label="Опции фотографии">' +
				'<div class="btn-group btn-group-sm" role="group" aria-label="опции фотографии">' +
				'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">опции <span class="caret"></span></button>' +
				'';
			if(origSrc)
			{
				htmlDialog += '<ul class="dropdown-menu dropdown-menu-left"><li><a href="' + origSrc + '" target="blank">оригинал</a></li></ul>';
			}

			htmlDialog += '</div>' +

				'</div>';

			htmlDialog += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="modal-body">';
				htmlDialog += '<div class="imageModalBody">';
					htmlDialog += '<img src="'+imgSrc+'" class="imageInModal" alt=""/>';
				htmlDialog += '</div>';
			htmlDialog += '</div>';

			htmlDialog += '<div class="textCenter modal-footer">';
			htmlDialog += '</div>';
			htmlDialog += '</div>';
			htmlDialog += '</div>';
			htmlDialog += '</div>';

			return htmlDialog;
		}

		function getNextImg($imgInModal, $modal, $img, img, options)
		{
			var index = $albumImages.index($img);
			var indexNext = parseInt(index, 10) + 1;

			$modal.modal('hide');
			$($albumImages.get(indexNext)).click();
		}

		function getPrevImg($imgInModal, $modal, $img, img, options)
		{
			$modal.modal('hide');

			var index = $albumImages.index($img);

			if (index == 0)
				return;

			var indexPrev = parseInt(index, 10) - 1;
			$($albumImages.get(indexPrev)).click();
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

			var smallWin = (winW <= 768);
			var deltaW, deltaH, w, h;

			deltaW = 0.05;
			deltaH = (smallWin ? (portrait ? 0.2 : 0.35) : 0.15);

			w = Math.ceil(winW - (winW * deltaW));
			h = Math.ceil(winH - (winH * deltaH));

			var $modalBody = $modal.find('.imageDialog .modal-body');

			$modalBody.find('.imageModalBody img.imageInModal').one('load', function ()
			{
				bindGetPrevNextImg($(this), $modal, $img, img, options);
				var imgHorizontal = (this.width >= this.height);

				if (smallWin)
				{
					$modal.find('.imageDialog').css('height', h);
					if ( (portrait && !imgHorizontal) || !portrait)
					{
						$(this).css('max-height', h-2);
					}

					$(this).parent().css('max-height', h-2);
				}
				else
				{
					$(this).css('max-height', h-2).parent().css('max-height', h-2);

					var ratio = (h / this.height);

					w = (ratio >= 1 ? this.width + this.width * ratio : this.width - this.width * ratio);
					w = (imgHorizontal && w > 1024 ? 1024 : w);

					$modal.find('.imageDialog').css('width', 'auto');
					$modal.find('.imageDialog').css('min-width', w);
				}
			});
		}

		function getImg(id)
		{
			var img = null;
			var i;
			for(i in options.jsonImageList)
			{
				if (options.jsonImageList[i].hasOwnProperty(options.imgFieldId) && options.jsonImageList[i][options.imgFieldId] == id)
				{
					img = options.jsonImageList[i];
					break;
				}
			}

			return img;
		}

		function openImageDialog($img, params)
		{
			var defaults = {};
			var options = $.extend({}, defaults, params);

			var img = getImg($img.attr("data-img-id"));

			if (!img) return;

			options.id = '_images_dialog_'+img[options.imgFieldId];

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
					console.log("$mcDialog.on('shown.bs.modal', function (event)");
				})
				.on('hidden.bs.modal', function (event)
				{
					$(this).remove();
					console.log("$mcDialog.on('hidden.bs.modal', function (event)");
				}).modal('show');
		}

		if(options.jsPreviewsList.length)
		preloadImages(options.jsPreviewsList);

		$(document).on('click', options.albumImages, function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			openImageDialog($(this), options);
		});
		
		return $(this);
	}
})(jQuery);