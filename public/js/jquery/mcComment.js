(function($)
{
	if (!!$.fn.mcComment)
		return;

	$.fn.mcComment = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			uri: null
			, formAddComment: null
			, commentList: null
			, commentItem: null
			, commentCount: null
			, commentActions: null
			, commentText: null
			, objId: null
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		//var $formAddComment = $(options.formAddComment);
		//var formAddCommentAction = $formAddComment.attr('action');
		
		addComment($(options.formAddComment), options);

		$(document).on('click', options.commentActions, function(event)
		{
			event.preventDefault();
			event.stopPropagation();

			var $self = $(this);
			var action = $self.data('action');
			
			var $commentItem = $self.parents(options.commentItem);
			var cmId = $commentItem.data('cmId');
			console.log('action = ', action);
			console.log('options.commentItem = ', options.commentItem);
			console.log('cmId = ', cmId);

			switch (action)
			{
				default:
					break;
				
				case 'cancel':
					$self.parents('form').remove();
					return;
				break;
				
				case 'add':
					var $form = $(commentForm(options, cmId));
					$form.appendTo($commentItem.find(options.commentText));
					$form = $('#'+$form.attr('id'));
					$form.find('textarea').focus();
					
					console.log($form);
					addComment($form, options);
					return;
				break;
			}
		});
		

		return $(this);
	};

	function addComment($formAddComment, options)
	{
		$formAddComment.postRes({
			btnId: 'btn_add_comment',
			buttons: [
				{
					title: 'Ok'
					,name: 'btn_add_error'
					,cssClass: 'btn-danger'
					,func: {
						'click': function($mcDialog)
						{
							$(window).scrollTo($formAddComment, 4, {axis:'y', interrupt: true, limit: false});
							$mcDialog.modal('hide');
						}
					}
				}
			],
			onSuccess: function($dialog, respData)
			{
				addCommentToPage(respData, options, $formAddComment);
				return false;
			}
		});
	}

	function commentForm(options, cmPid)
	{
		var html = '<form action="/blog/comment/" method="post" class="text-center form-add-comment js-form-add-comment" id="formAddComment'+cmPid+'">';
		html += '<input type="hidden" name="ui_obj_id" id="ui_obj_id" value="'+options.objId+'">';
		html += '<input type="hidden" name="ui_cm_pid" id="ui_cm_pid" value="'+cmPid+'">';
		html += '<div class="form-group t_comment">';
		//html += '<div class="col-sm-6">';
		html += '<textarea class="form-control" id="t_comment" name="t_comment" autofocus="true" placeholder="комментарий" maxlength="1000"></textarea>';
		//html += '</div>';
		html += '</div>';
		html += '<div class="form-group">';
		html += '<input type="hidden" name="btn_save_comment" value="add">';
		html += '<button type="button" class="btn btn-xs btn-primary" id="btn_add_comment" value="1" data-loading-text="добавляю..." autocomplete="off">добавить</button>';
		html += '&nbsp;';
		html += '<button type="button" class="btn btn-xs btn-danger js-comment-action" data-action="cancel" autocomplete="off">отменить</button>';
		html += '</div>';
		html += '</form>';
		
		return html;
	}

	function addCommentToPage(respData, options, $formAddComment)
	{
		var html = '<li class="comment-item js-comment-item" data-cm-id="'+respData['cm_id']+'" data-cm-pid="'+respData['cm_pid']+'" style="margin-left: '+respData['cm_level']+'00px;">';
		
		html += userHtml(respData['user']);
		
		html += respData['u_id'];
		html += respData['cm_hide'];
		html += respData['dt_create_ts'];
		html += respData['cm_text'];
		html += '</li>';
		var $commentList = $(options.commentList);
		//var $options = $(options.commentItem);
		//commentList
		
		console.log('respData = ', respData);
		
		$formAddComment.find('textarea').val('');
		commentCountUpdate($(options.commentCount), '+');
		
		var $uiCmPid = $formAddComment.find('input#ui_cm_pid');
		if ($uiCmPid.length && parseInt($uiCmPid.val(), 10) > 0)
		{
			$formAddComment.remove();
		}
		
		if (respData['cm_pid'] == 0)
			$commentList.append(html);
		else
		{
			var $last = $('[data-cm-pid="'+respData['cm_pid']+'"]').last();
			if (!$last.length)
				$last = $('[data-cm-id="'+respData['cm_pid']+'"]');
			
			$last.after(html);
		}
	}
	
	function userHtml(user_owner)
	{
		var ava = (!!user_owner['previews'] && user_owner['previews']['100_100']);
		var avaSrc = (ava ? user_owner['previews']['100_100'] : '/_0.gif');
		
		var html = '<div class="owner">';
		html += '<a class="owner_ava" href="/profile/'+user_owner['u_id']+'/">';
		html += '<img class="img-circle img-responsive '+(ava ? '':'hidden')+'" src="'+avaSrc+'" alt="'+user_owner['u_display_name']+'" />';
		html += '<i class="fa fa-user '+(ava ? 'hidden':'')+'"></i>';
		html += '</a>';
		html += '<div class="owner_info">';
		html += '<div class="owner_info_name"><a href="/profile/'+user_owner['u_id']+'/">'+user_owner['u_display_name']+'</a></div>';
		html += '<div class="owner_info_location" data-toggle="tooltip" data-placement="auto" title="'+user_owner['l_full_name']+'"><i class="fa fa-fw fa-map-marker"></i>'+(user_owner['l_name']||'не указано')+'</div>';
		html += '</div>';
		html += '</div>';
		
		return html;
	}
	
	function commentCountUpdate($commentCount, type)
	{
		var cnt = parseInt($commentCount.text(), 10);

		if (type == '+')
			cnt = (!cnt ? 0 : cnt) + 1;
		else if (type == '-')
			cnt = (!cnt ? 0 : cnt) - 1;

		$commentCount.text(cnt);
	}
})(jQuery);