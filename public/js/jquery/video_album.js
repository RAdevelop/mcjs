(function($)
{
	$.fn.videoAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, u_id: null
			, album: null
			, albumToolbar: null
			, albumWrapper: null //родитель списка видео в альбоме
			, albumImages: null //список видео в альбоме
			, albumName: null
			, albumText: null
			, s_token: null
			, i_time: null
			, sortable: false
		};

		var videoAlbums = MCJS["videoAlbums"] || [];
		var videoAlbum = MCJS["videoAlbum"] || {};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);

		$(options.albumToolbar).click(function(event)
		{
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this)
			switch($this.data('action'))
			{
				case 'add':
					options.btnSaveAlbumVal = 'add_album';
					var dialogBtnAdd = 'btn_add_video_album';

					$('__add_album_dialog__').mcDialog({
						title: 'Создание нового альбома'
						, body: formAddAlbum(options)
						, onOpen: function ($dialog)
						{
							$dialog.find('#formAddAlbum').postRes({
								btnId: $dialog.find('#'+dialogBtnAdd),
								onSuccess: function($respDialog, resp)
								{
									if(resp["va_id"])
									window.location.href = [options.uri, options.u_id,resp["va_id"]].join('/')+'/';

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
								, name: dialogBtnAdd
								, cssClass: 'btn-success'
							},
							{
								title: 'отменить'
								,name: 'btn_add_album_cancel'
								,cssClass: 'btn-danger'
								,func:
							{
								"click": function($mcDialog)
								{
									$mcDialog.modal('hide');
								}
							}
							}
						]
					});
					break;

				case 'delete':
					var dialogBtnDel = 'btn_del_video_album';
					$('__del_video_album_dialog__').mcDialog({
						title: 'Удаление видео-альбома'
						, body: formDelVideoAlbum(videoAlbum||{}, options.uri)
						, onOpen: function ($dialog)
						{
							$dialog.find('#formDelVideoAlbum').postRes({
								btnId: $dialog.find('#'+dialogBtnDel),
								onSuccess: function($respDialog, resp)
								{
									if (resp.hasOwnProperty("formError") && resp["formError"].hasOwnProperty("error") && !resp["formError"]["error"])
									{
										window.location.href = '<%=menuItem.m_path%>';
										return false;//не показать диалог
									}
									else
									{
										return true;
									}
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
								title: 'да'
								, name: dialogBtnDel
								, cssClass: 'btn-success'
							},
							{
								title: 'нет'
								,name: 'btn_del_video_album_cancel'
								,cssClass: 'btn-danger'
								,func: {
									"click": function($mcDialog)
									{
										$mcDialog.modal('hide');
									}
								}
							}
						]
					});

					break;
			}
		});

		function formAddAlbum(options, album)
		{
			var aName = (album['va_name'] || '').htmlspecialchars(album['va_name'] || '');
			var aText = (album['va_text'] || '').htmlspecialchars(album['va_text'] || '');

			var va_id = (album['va_is_owner'] ? album['va_id'] : null);

			return '<form class="form-horizontal" action="'+options.uri+'" method="post" id="formAddAlbum">' +
				'<input type="hidden" name="btn_save_album" value="'+options.btnSaveAlbumVal+'"/>' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>' +
				(va_id ?'<input type="hidden" name="ui_va_id" value="'+va_id+'"/>' : '') +
				'<div class="form-group s_va_name">' +
				'<div class="col-sm-12">' +
				'<input type="text" class="form-control" id="s_va_name" name="s_va_name" value="'+aName+'" placeholder="название альбома *" required maxlength="100"/>' +
				'</div>' +
				'</div>' +
				'<div class="form-group t_va_text">' +
				'<div class="col-sm-12">' +
				'<textarea class="form-control" id="t_va_text" name="t_va_text" placeholder="укажите описание альбома" maxlength="255">'+aText+'</textarea>' +
				'</div></div></form>';
		}

		function formDelVideoAlbum(album, uri)
		{
			var html = '<form class="form-horizontal" action="'+uri+'/" method="post" id="formDelVideoAlbum">' +
				'<input type="hidden" name="btn_save_video_album" value="del_video_album"/>' +
				'<input type="hidden" name="ui_video_album_id" value="'+album['va_id']+'"/>' +
				'<div class="form-group">' +
				'<div class="col-sm-12 text-center">Удалить видео-альбом: ' + album['va_name'] + '?</div>' +
				'</div>' +
				'</form>';

			return html;
		}
	};
})(jQuery);