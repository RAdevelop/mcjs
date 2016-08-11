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

	//return ;
	$.fn.mcAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, albumToolbar: null
			, s_token: null
			, i_time: null
			, a_id: null
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/
		
		var $albumToolbar = $(options.albumToolbar);
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
				var filesUploaded = $(this).data('uploadFileData');
				console.log('filesUploaded');
				console.log(filesUploaded);

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
		return $(this);
	}
})(jQuery);

/*

<a class="albumBody" href="<%#=album["a_id"]%>/">
<img src="<%#=imgSrc%>" alt="<%#=album["a_name"]%>"/>
<div class="albumTools">
	<span class="badge"><%#=album["a_img_cnt"]%></span>
	<a href="javascript:void(0)"><span class="fa fa-edit"></span></a>
	<a href="javascript:void(0)"><span class="fa fa-trash-o"></span></a>
	</div>
	<div class="albumTitle">
	<div class="albumName"><%#=album["a_name"]%></div>
	<%# if (album["a_text"]){%><div class="albumText"><%#=album["a_text"]%></div><%}%>
</div>
</a>

*/
