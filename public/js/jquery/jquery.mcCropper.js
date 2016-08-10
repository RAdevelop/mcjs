"use strict";
/**
 * требуется https://github.com/fengyuanchen/cropper
 */
(function($)
{
	$.fn.mcCropper = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
				previewsSelector: ''
			,	formCropSelector: ''
			,	aspectRatio: 1 / 1
			//,	aspectRatio: 16 / 9
			,   zoomable: false
			,   minCropBoxWidth: 50
			,   minCropBoxHeight: 50
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		//var self = this;
		var $cropper = $(this);
		var $previews = (options.previewsSelector ? $(options.previewsSelector) : null);
		var $formCrop = $(options.formCropSelector);
		var $cropX = $formCrop.find('input[type=hidden]#i_crop_x');
		var $cropY = $formCrop.find('input[type=hidden]#i_crop_y');
		var $cropWidth = $formCrop.find('input[type=hidden]#i_crop_width');
		var $cropHeight = $formCrop.find('input[type=hidden]#i_crop_height');
		var $cropRotate = $formCrop.find('input[type=hidden]#i_crop_rotate');
		var $cropScaleX = $formCrop.find('input[type=hidden]#i_crop_scale_x');
		var $cropScaleY = $formCrop.find('input[type=hidden]#i_crop_scale_y');

		options.checkOrientation = false;//иначе не работает в IE 8

		options.crop = function(e)
		{


			// Output the result data for cropping image.
			/*console.log("==============");
			console.log("");
			console.log("e.x = " + e.x);
			console.log("e.y = " + e.y);
			console.log("e.width = " + e.width);
			console.log("e.height = " + e.height);
			console.log("e.rotate = " + e.rotate);
			console.log("e.scaleX = " + e.scaleX);
			console.log("e.scaleY = " + e.scaleY);
			console.log("");
			console.log("==============");*/

			$cropX.val(Math.ceil(e.x));
			$cropY.val(Math.ceil(e.y));
			$cropWidth.val(Math.ceil(e.width));
			$cropHeight.val(Math.ceil(e.height));
			$cropRotate.val(Math.ceil(e.rotate));
			$cropScaleX.val(Math.ceil(e.scaleX));
			$cropScaleY.val(Math.ceil(e.scaleY));

			var imageData = $(this).cropper('getImageData');
			var previewAspectRatio = e.width / e.height;

			$previews.each(function ()
			{
				var $preview = $(this);
				var previewWidth = $preview.width();
				var previewHeight = previewWidth / previewAspectRatio;
				var imageScaledRatio = e.width / previewWidth;

				$preview.height(previewHeight).find('img').css({
					width: imageData.naturalWidth / imageScaledRatio,
					height: imageData.naturalHeight / imageScaledRatio,
					marginLeft: -e.x / imageScaledRatio,
					marginTop: -e.y / imageScaledRatio
				});
			});
		};

		$cropper.cropper(options);
		$cropper.replaceSrc = function (src)
		{
			var ts = (new Date()).getTime();
			$cropper.cropper('replace', src+'?ts='+ts);

			$previews.each(function ()
			{
				$(this).find('img').attr('src', src+'?ts='+ts);
			});
		};

		return $cropper;
	}
})(jQuery);

/*
 $('#ava_crop_base').cropper({
 aspectRatio: 1 / 1,
 zoomable: false,
 checkOrientation: false,
 crop: function(e)
 {


 // Output the result data for cropping image.
 console.log("==============");
 console.log("");
 console.log("e.x = " + e.x);
 console.log("e.y = " + e.y);
 console.log("e.width = " + e.width);
 console.log("e.height = " + e.height);
 console.log("e.rotate = " + e.rotate);
 console.log("e.scaleX = " + e.scaleX);
 console.log("e.scaleY = " + e.scaleY);
 console.log("");
 console.log("==============");

 var imageData = $(this).cropper('getImageData');
 var previewAspectRatio = e.width / e.height;

 $previews.each(function () {
 var $preview = $(this);
 var previewWidth = $preview.width();
 var previewHeight = previewWidth / previewAspectRatio;
 var imageScaledRatio = e.width / previewWidth;
 $preview.height(previewHeight).find('img').css({
 width: imageData.naturalWidth / imageScaledRatio,
 height: imageData.naturalHeight / imageScaledRatio,
 marginLeft: -e.x / imageScaledRatio,
 marginTop: -e.y / imageScaledRatio
 });
 });

 }
 });
 */