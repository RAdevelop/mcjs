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
			var action = $this.data('action');
			switch(action)
			{
				case 'add_video':

					options.btnSaveAlbumVal = 'add_video';
					var dialogBtn = 'btn_add_video';
					var title = 'Добавить видео в альбом '+videoAlbum['va_name'];
					var formId = 'formAddVideo';

					$('__add_video_dialog__').mcDialog({
						title: title
						, body: formAddVideo(formId, options, videoAlbum)
						, onOpen: function ($dialog)
						{
							var $dialogBtn = $dialog.find('.modal-footer #'+dialogBtn).attr('disabled', true);
							var $formVideo = $dialog.find('#'+formId);
							$formVideo.postRes({
								btnId: $dialogBtn,
								onSuccess: function($respDialog, resp)
								{
									console.log(resp);
									$dialog.modal('hide');
									//TODO добавить ролик в список на страницу
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
									$dialog.show().css('overflow', 'visible');
								}
							});

							$formVideo.find('#get_video').on('click', [$dialog, $dialogBtn, $formVideo.find('#link_v_url')], postRequestVideoLink);
						}
						, buttons: buttonsDialog(dialogBtn, 'сохранить')
					});
					break;

				case 'edit':
				case 'add':
					var dialogBtn, title, formId;

					if (action == 'add')
					{
						options.btnSaveAlbumVal = 'add_album';
						dialogBtn = 'btn_add_video_album';
						title = 'Создание нового альбома';
						formId = 'formAddAlbum';
					}
					else
					{
						options.btnSaveAlbumVal = 'edit_album';
						dialogBtn = 'btn_edit_video_album';
						title = 'Редактирование альбома';
						formId = 'formEditAlbum';
					}

					$('__add_album_dialog__').mcDialog({
						title: title
						, body: formAddAlbum(formId, options, videoAlbum)
						, onOpen: function ($dialog)
						{
							$dialog.find('#'+formId).postRes({
								btnId: $dialog.find('#'+dialogBtn),
								onSuccess: function($respDialog, resp)
								{
									var redir_to = [options.uri, options.u_id,resp["va_id"],resp["va_alias"]].join('/')+'/';
									if (action == 'add')
									{
										if(resp["va_id"])
										window.location.href = redir_to;
									}
									else
									{
										if (resp["s_va_name"] != videoAlbum['va_name'])
										{
											window.location.href = redir_to;
										}
										else
										{
											$(options.albumName).text(resp["s_va_name"]);
											$(options.albumText).text(resp["t_va_text"]);
											videoAlbum['va_name'] = resp["s_va_name"];
											videoAlbum['va_text'] = resp["t_va_text"];

											$dialog.modal('hide');
										}
									}

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
									$dialog.show().css('overflow', 'visible');
								}
							});
						}
						, buttons: buttonsDialog(dialogBtn, 'сохранить')
					});
					break;

				case 'delete':
					var dialogBtn = 'btn_del_video_album';
					var formId = 'formDelVideoAlbum';
					$('__del_video_album_dialog__').mcDialog({
						title: 'Удаление видео-альбома'
						, body: formDelVideoAlbum(formId, videoAlbum, options)
						, onOpen: function ($dialog)
						{
							$dialog.find('#formDelVideoAlbum').postRes({
								btnId: $dialog.find('#'+dialogBtn),
								onSuccess: function($respDialog, resp)
								{
									if (resp.hasOwnProperty("formError") && resp["formError"].hasOwnProperty("error") && !resp["formError"]["error"])
									{
										window.location.href = [options.uri,options.u_id].join('/')+'/';
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
									$dialog.show().css('overflow', 'visible');
								}
							});
						}
						, buttons: buttonsDialog(dialogBtn, 'да')
					});

					break;
			}
		});

		function loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, err_msg)
		{
			$dialogBtn.attr('disabled', true);
			$loadingInfo.hide();

			$loadingError.html(err_msg).show();

			$dialog.find('#videoData').hide();

			$dialog.find('#link_v_img').val('');
			$dialog.find('#embed_image').attr('src', '');
			$dialog.find('#t_v_content').val('');
			$dialog.find('#embed_content').html('');
			$dialog.find('#s_v_name').val('');
			$dialog.find('#t_v_text').val('');
		}
		var videoLink;
		function postRequestVideoLink(event)
		{
			event.stopPropagation();

			var $dialog = event['data'][0];
			var $dialogBtn = event['data'][1];
			var $self = event['data'][2];

			if (videoLink ==  $self.val())
				return;

			if (!videoLink)
				videoLink = $self.val();

			var $loadingInfo = $dialog.find('#loadingVideoData').show();
			var $loadingError = $dialog.find('#loadingError').hide();

			var uri = $self.val();
			if (!isLink(uri))
			{
				loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, 'Укажите cсылку на видеоролик');
				return;
			}

			//https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/
			var postData = {
				"b_load_embed_content": "1",
				"s_uri": uri
			};

			$.ajax({
				url: $dialog.find('form').attr('action'),//'embed_content',
				method: "POST",
				data: postData,
				dataType: "json"
			})
				.done(function(respData)
				{
					if (!respData["embed_url_video"])
					{
						loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, 'Не удалось загрузить видео по данной ссылке.');
						return;
					}
					var	embedContent = '<iframe src="'+respData["embed_url_video"]+'" data-link="'+uri+'" class="iframeVideoEmbed" frameborder="0" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" allowfullscreen="allowfullscreen" scrolling="no"></iframe>';

					$dialog.find('#link_v_img').val(respData.embed_image);
					$dialog.find('#embed_image').attr('src', respData.embed_image);
					$dialog.find('#t_v_content').val(embedContent);
					$dialog.find('#embed_content').html(embedContent);
					$dialog.find('#s_v_name').val(respData.embed_title);
					$dialog.find('#t_v_text').val(respData.embed_text);

					$loadingInfo.hide();
					$dialog.find('#videoData').show();
					$dialogBtn.attr('disabled', false);

				})
				.fail(function(respData)
				{
					console.log(respData);
				});
		}

		function buttonsDialog(dialogBtn, title)
		{
			return [
				{
					title: title
					, name: dialogBtn
					, cssClass: 'btn-success'
				},
				{
					title: 'отменить'
					,name: 'btn_album_dialog_cancel'
					,cssClass: 'btn-danger'
					,func: {
						"click": function($mcDialog) {
							$mcDialog.modal('hide');
						}
					}
				}
			];
		}
		
		function formAddVideo(formId, options, album)
		{
			var va_id = (album['va_is_owner'] ? album['va_id'] : null);

			return '<form class="" action="'+options.uri+'" method="post" id="'+formId+'">' +
				'<input type="hidden" name="btn_save_album" value="'+options.btnSaveAlbumVal+'"/>' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>' +
				(va_id ?'<input type="hidden" name="ui_va_id" value="'+va_id+'"/>' : '') +

				'<div class="form-group">' +
					'<div class="col-sm-12 text-center">Вы можете указать ссылку на страницу видеозаписи на таких сайтах, как<br/> Вконтакте, Youtube, Rutube, Vimeo и др.</div>' +
				'</div>' +
				'<div class="form-group text-center link_v_url">' +
					'<label for="link_v_url">cсылка на видеоролик *</label><br/>' +
					'<input type="text" class="input-sm" style="width: 80%;" id="link_v_url" name="link_v_url" value="https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/" placeholder="cсылка на видеоролик *" required />' +
					'<button type="button" class="btn-primary btn-xs" id="get_video">загрузить видео</button>' +
				'</div>' +
				'<div class="form-group text-center">' +

				'<div id="loadingVideoData" style="display: none;" class="text-center"><i class="fa fa-spinner fa-spin fa-fw"></i>&nbsp;<span>Загрузка...</span></div>' +
				'<div id="loadingError" style="display: none;" class="text-center alert alert-danger" role="alert alert"></div>' +
				'<div id="videoData" style="display: none;">' +
					'<div class="form-group text-center link_v_img">' +
						'<input type="text" class="form-control hidden" id="link_v_img" name="link_v_img" value="" />' +
						'<img  src="" id="embed_image" width="100%" style="width: 100%"/>' +
					'</div>' +
					'<div class="form-group text-center t_v_content">' +
						'<div class="col-sm-12">' +
						'<textarea class="form-control hidden" id="t_v_content" name="t_v_content"></textarea>' +
						'<div id="embed_content"></div>' +
						'</div>' +
					'</div>' +
					'<div class="form-group s_v_name">' +
						'<label for="s_v_name">название видео *</label>' +
						'<input type="text" class="form-control" id="s_v_name" name="s_v_name" value="" placeholder="название видео *" required maxlength="100"/>' +
					'</div>' +
					'<div class="form-group t_v_text">' +
						'<label for="t_v_text">описание видео</label>' +
						'<textarea class="form-control" id="t_v_text" name="t_v_text" placeholder="описание видео" maxlength="255"></textarea>' +
					'</div>'+
				'</div>'+
				'</form>';
		}

		function formAddAlbum(formId, options, album)
		{
			var aName = (album['va_name'] || '').htmlspecialchars(album['va_name'] || '');
			var aText = (album['va_text'] || '').htmlspecialchars(album['va_text'] || '');

			var va_id = (album['va_is_owner'] ? album['va_id'] : null);

			return '<form class="form-horizontal" action="'+options.uri+'" method="post" id="'+formId+'">' +
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

		function formDelVideoAlbum(formId, album, options)
		{
			var html = '<form class="form-horizontal" action="'+options.uri+'/" method="post" id="'+formId+'">' +
				'<input type="hidden" name="btn_save_video_album" value="del_video_album"/>' +
				'<input type="hidden" name="ui_va_id" value="'+album['va_id']+'"/>' +
				'<div class="form-group">' +
				'<div class="col-sm-12 text-center">Удалить видео-альбом: ' + album['va_name'] + '?</div>' +
				'</div>' +
				'</form>';

			return html;
		}
	};
})(jQuery);