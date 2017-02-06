(function($)
{
	$.videoAlbum = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, u_id: null
			, album: null
			, albumToolbar: null
			, albumWrapper: null //родитель списка видео в альбоме
			, albumVideos: null //список видео в альбоме
			, albumVideoTools: null //опции для отдельного видео
			, albumName: null
			, albumText: null
			, sortable: false
		};

		var videoAlbums = MCJS["videoAlbums"] || [];
		var videoAlbum = MCJS["videoAlbum"] || {};

		var videoList = MCJS["videoList"] || {};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);

		$(document).on('click', options.albumVideoTools, function(event)
		{
			event.preventDefault();
			event.stopPropagation();

			var $self = $(this);

			var vId = $self.data('videoId');
			var action = $self.data('action');
			var move = findVideoMove(vId);

			if (!move['video']['u_id'] || options.u_id != move['video']['u_id'])
				return;

			switch (action)
			{
				case 'edit_video':
					editVideoMove(options, videoAlbum, move['video'], move['inx']);
					break;

				case 'delete_video':

					var dialogBtn = 'btn_del_video';
					var formId = 'formDelVideo';
					$('__del_video_dialog__').mcDialog({
						title: 'Удаление видео'
						, body: formDelVideo(formId, move['video'], options)
						, onOpen: function ($dialog)
						{
							$dialog.find('#'+formId).postRes({
								btnId: $dialog.find('#'+dialogBtn),
								onSuccess: function($respDialog, resp)
								{
									if (resp.hasOwnProperty("formError") && resp["formError"].hasOwnProperty("error") && !resp["formError"]["error"])
									{
										MCJS["videoList"].splice(move['inx'], 1);
										$self.parents('.js-media').remove();
										mediaImgCnt(-1);
										$dialog.modal('hide');
										return false;//не показать диалог
									}
									else
										return true;
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

		$(options.albumToolbar).click(function(event)
		{
			event.preventDefault();
			event.stopPropagation();

			var $this = $(this)
			var action = $this.data('action');
			switch(action)
			{
				case 'edit_video':
					var vId = $this.data('videoId');
					var move = findVideoMove(vId);

					editVideoMove(options, videoAlbum, move['video'], move['inx']);
					break;

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
									$dialog.modal('hide');
									videoLink = null;
									prependVideo(resp, options);
									//не показать диалог
									return false;
								},
								onFail: function ($respDialog, resp)
								{
									$dialog.hide();
									videoLink = null;
									return true;
								},
								onClose: function ($respDialog)
								{
									videoLink = null;
									$dialog.show().css('overflow', 'visible');
								}
							});

							$formVideo.find('#get_video').on('click', [$dialog, $dialogBtn, $formVideo.find('#link_v_url')], postRequestVideoLink);
						},
						onClose: function ($mcDialog)
						{
							videoLink = null;
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
						videoAlbum = {};
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
							$dialog.find('#'+formId).postRes({
								btnId: $dialog.find('#'+dialogBtn),
								onSuccess: function($respDialog, resp)
								{
									if (resp.hasOwnProperty("formError") && resp["formError"].hasOwnProperty("error") && !resp["formError"]["error"])
									{
										window.location.href = [options.uri,options.u_id].join('/')+'/';
										return false;//не показать диалог
									}
									else
										return true;
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

		$(document).on('click', options.albumWrapper+' '+options.albumVideos, function (event)
		{
			event.preventDefault();
			event.stopPropagation();
			var vId = $(this).data('videoId');

			MCJS["videoList"].forEach(function (item)
			{
				if (item['v_id'] == vId)
				{
					$('__view_video_dialog__').mcDialog({
						title: item['v_name']
						, body: item['v_content']
						, onOpen: function ($dialog)
						{
							$dialog.find('iframe').css('width', '100%');
						}
					});
					return true;
				}
				return false;
			});
		});

		$(document).on('click', '.js-mediaTitle', function()
		{
			$(this).parent().find('.js-video').click();
		});

		function findVideoMove(vId)
		{
			var video = {}, inx;
			MCJS["videoList"].forEach(function (item, i, videoList)
			{
				if (item['v_id'] == vId)
				{
					inx = i;
					video = videoList[i];
					video['v_name'] = (video['v_name']).htmlspecialchars(video['v_name']);
					video['v_text'] = (video['v_text']).htmlspecialchars(video['v_text']);
					//video['v_content'] = (video['v_content']).htmlspecialchars(video['v_content']);
				}
			});

			return {video:video, inx:inx};
		}

		function editVideoMove(options, videoAlbum, video, inx)
		{
			options.btnSaveAlbumVal = 'edit_video';
			var dialogBtn = 'btn_edit_video';
			var title = 'Редактирование видео '+videoAlbum['va_name'];
			var formId = 'formEditVideo';

			$('__edit_video_dialog__').mcDialog({
				title: title
				, body: formAddVideo(formId, options, videoAlbum, video)
				, onOpen: function ($dialog)
				{
					//https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/
					//https://youtu.be/pNEVFxG_tes

					var $dialogBtn = $dialog.find('.modal-footer #'+dialogBtn).attr('disabled', false);
					var $formVideo = $dialog.find('#'+formId);

					$formVideo.find('#videoData').show();

					$formVideo.postRes({
						btnId: $dialogBtn,
						onSuccess: function($respDialog, resp)
						{
							$dialog.modal('hide');
							MCJS["videoList"][inx] = resp;
							videoLink = null;
							//не показать диалог
							return false;
						},
						onFail: function ($respDialog, resp)
						{
							$dialog.hide();
							videoLink = null;
							return true;
						},
						onClose: function ($respDialog)
						{
							$dialog.show().css('overflow', 'visible');
							videoLink = null;
						}
					});

					$formVideo.find('#get_video').on('click', [$dialog, $dialogBtn, $formVideo.find('#link_v_url')], postRequestVideoLink);
				}
				, buttons: buttonsDialog(dialogBtn, 'сохранить')
			});
		}

		function prependVideo(resp, options)
		{
			var html = '';
			html += '<div class="media js-media" data-video-id="'+resp['v_id']+'">';
				html += '<a class="mediaImg js-video" href="'+[options.uri,'move',resp["v_id"],resp["v_alias"]].join('/')+'/" data-video-id="'+resp['v_id']+'"><img src="'+resp['v_img']+'" /></a>';
				html += '<div class="mediaTools videoTools js-video-tools">';
					html += '<a href="javascript:void(0);" title="редактировать" data-toggle="tooltip" data-action="edit_video" data-video-id="'+resp['v_id']+'"><i class="fa fa-fw fa-edit"></i></a>';
					html += '<a href="javascript:void(0);" title="удалить" data-toggle="tooltip" data-action="delete_video" data-video-id="'+resp['v_id']+'"><i class="fa fa-fw fa-trash-o"></i></a>';
				html += '</div>';
				html += '<div class="mediaTitle js-mediaTitle">';
					html += '<div class="mediaName">'+resp['v_name']+'</div>';
					html += '<div class="mediaText">'+resp['v_text']+'</div>';
				html += '</div>';
			html += '</div>';

			$(options.albumWrapper).prepend(html);
			mediaImgCnt(1);
			MCJS["videoList"].unshift(resp);
		}

		function mediaImgCnt(delta)
		{
			delta = parseInt(delta, 10)||0;

			var $mediaImgCnt = $('.js-mediaImgCnt');
			var cnt = (parseInt($mediaImgCnt.text(), 10)||0)+delta;
			cnt = (cnt<0 ? 0 :cnt);
			$mediaImgCnt.text(cnt);
		}

		var videoLink;
		function loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, err_msg)
		{
			videoLink = null;
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

		function postRequestVideoLink(event)
		{
			event.stopPropagation();

			var $dialog = event['data'][0];
			var $dialogBtn = event['data'][1];
			var $self = event['data'][2];

			if (videoLink ==  $self.val())
				return;

			videoLink = $self.val();

			var $loadingInfo = $dialog.find('#loadingVideoData').show();
			var $loadingError = $dialog.find('#loadingError').hide();

			var uri = $self.val();
			var iframeSrc = false;
			if (!isLink(uri))
			{
				var $iframe = $('<div>'+uri+'</div>').find('iframe');

				iframeSrc = !!$iframe.length;
				if (!iframeSrc)
				{
					loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, 'Укажите cсылку на видеоролик');
					return;
				}

				uri = $iframe.attr('src').replace(/(https?:)?\/\//ig, '');
				//console.log('uri = ', uri);
			}

			//https://rutube.ru/video/aa12ee0f46f4bc1bdc88b4ec3a289c09/
			var postData = {
				"b_load_embed_content": "1",
				"s_uri": uri,
				"b_iframe": iframeSrc
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
						var err_msg = '<p>Не удалось загрузить видео по данной ссылке.</p>';
							err_msg += '<p>Возможно, автор видео запретил встраивание видео на других сайтах.</p>';
						loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, err_msg);
						return;
					}
					var	embedContent = '<iframe src="'+respData["embed_url_video"]+'" data-link="'+uri+'" class="iframeVideoEmbed" frameborder="0" webkitallowfullscreen="webkitallowfullscreen" mozallowfullscreen="mozallowfullscreen" allowfullscreen="allowfullscreen" scrolling="no"></iframe>';


					respData['embed_title'] = respData['embed_title'].htmlspecialchars_decode(respData['embed_title']);
					respData['embed_text'] = respData['embed_text'].htmlspecialchars_decode(respData['embed_text']);
					//приходится дважды
					respData['embed_text'] = respData['embed_text'].htmlspecialchars_decode(respData['embed_text']);

					if(respData['embed_url'])
					$dialog.find('#link_v_url').val(respData['embed_url']);

					$dialog.find('#link_v_img').val(respData['embed_image']);
					$dialog.find('#embed_image').attr('src', respData['embed_image']);
					$dialog.find('#t_v_content').val(embedContent);
					$dialog.find('#embed_content').html(embedContent);
					$dialog.find('#s_v_name').val(respData['embed_title']);
					$dialog.find('#t_v_text').val(respData['embed_text']);

					$loadingInfo.hide();
					$dialog.find('#videoData').show();
					$dialogBtn.attr('disabled', false);

				})
				.fail(function(respData)
				{
					var err_msg = '<p>Не удалось загрузить видео по данной ссылке.</p>';
					err_msg += '<p>Возможно, автор видео запретил встраивание видео на других сайтах.</p>';
					loadingError($dialog, $dialogBtn, $loadingInfo, $loadingError, err_msg);
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
							videoLink = null;
						}
					}
				}
			];
		}

		function formAddVideo(formId, options, album, video)
		{
			var video = video || {};
			var va_id = (album['va_is_owner'] ? album['va_id'] : null);
			var v_id = (album['va_is_owner']&&video['v_id'] ? video['v_id'] : null);

			return '<form class="" action="'+options.uri+'" method="post" id="'+formId+'">' +
				'<input type="hidden" name="btn_save_album" value="'+options.btnSaveAlbumVal+'"/>' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>' +
				(va_id ?'<input type="hidden" name="ui_va_id" value="'+va_id+'"/>' : '') +
				(v_id ?'<input type="hidden" name="ui_v_id" value="'+v_id+'"/>' : '') +

				'<div class="form-group">' +
					'<div class="col-sm-12 text-center">Вы можете указать ссылку на страницу видеозаписи на таких сайтах, как<br/> Вконтакте, Youtube, Rutube, Vimeo и др.</div>' +
				'</div>' +
				'<div class="form-group text-center link_v_url">' +
					'<label for="link_v_url">cсылка на видеоролик или html код для вставки <span class="popoverHelp " id="videoHelpAddMove">*</span></label>' +
					'<div class="popoverContent" data-popover-for="#videoHelpAddMove">' +
						'если по ссылке не удалось загрузить видеоролик, попробуйте html код для вставки, который предлагает видео-ресурс.' +
					'</div>' +
					'<br/><textarea type="text" class="input-sm" style="width: 100%;" id="link_v_url" name="link_v_url" placeholder="cсылка на видеоролик или html код для вставки" required >'+(video['v_url']||'')+'</textarea>' +
				'</div>' +
				'<div class="form-group text-center">' +
					'<button type="button" class="btn-primary btn-xs" id="get_video">загрузить видео</button>' +
				'</div>' +
				'<div class="form-group text-center">' +

				'<div id="loadingVideoData" style="display: none;" class="text-center"><i class="fa fa-spinner fa-spin fa-fw"></i>&nbsp;<span>Загрузка...</span></div>' +
				'<div id="loadingError" style="display: none;" class="text-center alert alert-danger" role="alert alert"></div>' +
				'<div id="videoData" style="display: none;">' +
					'<div class="form-group text-center link_v_img">' +
						'<input type="text" class="form-control hidden" id="link_v_img" name="link_v_img" value="'+(video['v_img']||'')+'" />' +
						'<img  src="'+(video['v_img']||'')+'" id="embed_image" width="100%" style="width: 100%"/>' +
					'</div>' +
					'<div class="form-group text-center t_v_content">' +
						'<div class="col-sm-12">' +
						'<textarea class="form-control hidden" id="t_v_content" name="t_v_content">'+(video['v_content']||'')+'</textarea>' +
						'<div id="embed_content">'+(video['v_content']||'')+'</div>' +
						'</div>' +
					'</div>' +
					'<div class="form-group s_v_name">' +
						'<label for="s_v_name">название видео *</label>' +
						'<input type="text" class="form-control" id="s_v_name" name="s_v_name" value="'+(video['v_name'] || '')+'" placeholder="название видео *" required maxlength="100"/>' +
					'</div>' +
					'<div class="form-group t_v_text">' +
						'<label for="t_v_text">описание видео</label>' +
						'<textarea class="form-control" id="t_v_text" name="t_v_text" placeholder="описание видео" maxlength="255">'+(video['v_text'] || '')+'</textarea>' +
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
				'<input type="hidden" name="btn_save_album" value="del_video_album"/>' +
				'<input type="hidden" name="ui_va_id" value="'+album['va_id']+'"/>' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>' +
				'<div class="form-group">' +
				'<div class="col-sm-12 text-center">Удалить видео-альбом: ' + album['va_name'] + '?</div>' +
				'</div>' +
				'</form>';

			return html;
		}

		function formDelVideo(formId, video, options)
		{
			var html = '<form class="form-horizontal" action="'+options.uri+'/" method="post" id="'+formId+'">' +
				'<input type="hidden" name="btn_save_album" value="del_video"/>' +
				'<input type="hidden" name="ui_va_id" value="'+video['va_id']+'"/>' +
				'<input type="hidden" name="ui_v_id" value="'+video['v_id']+'"/>' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>' +
				'<div class="form-group">' +
				'<div class="col-sm-12 text-center">Удалить видео: ' + video['v_name'] + '?</div>' +
				'</div>' +
				'</form>';

			return html;
		}

		return this;
	};
})(jQuery);