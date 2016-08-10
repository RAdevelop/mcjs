(function($) {

	function formAddAlbum(options)
	{
		var add_album_form = '<form class="form-horizontal" action="'+options.uri+'" method="post" id="formAddAlbum">' +
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

		return add_album_form;
	}

	//return ;
	$.fn.mcAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, albumToolbar: null
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/
		
		var $albumToolbar = $(options.albumToolbar);
		var	$btnAddAlbum = $albumToolbar.find('#btn_add_album_modal');

		$btnAddAlbum.click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			$('.__add_album_dialog__').mcDialog({
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

		//$('form#formAva #ava_upload').fileUpload('#btn_ava_upload', avaUploadOpts);
	}
})(jQuery);