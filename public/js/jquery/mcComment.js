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
		
		addComment(options, 0, 'add');
		
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
				
				case 'delete':
					deleteComment(options, cmId, $commentItem);
				break;
				
				case 'add':
					addComment(options, cmId, action, $commentItem);
					return;
				break;
				
				case 'edit':
					var $formAddComment = addComment(options, cmId, action, $commentItem);
					if ($formAddComment)
					{
						var comment = findComment(cmId);
						//console.log(comment);
						$formAddComment.find('textarea').val(comment['cm_text']);
					}
				break;
			}
		});
		
		return $(this);
	};
	
	function findComment(cmId)
	{
		var comment = {};
		var list = MCJS['comments']||[];
		if (!list.length)
		return comment;
		
		list.some(function(item)
		{
			if (item['cm_id'] == cmId)
			{
				comment = item;
				return true;
			}
			return false;
		});
		return comment;
	}
	
	function deleteComment(options, cmId, $commentItem)
	{
		var formBtnId = 'btn_del_comment';
		var formId = 'formDelComment';
		var formBody = '<form class="form-horizontal" action="'+options.uri+'" method="post" id="'+formId+'"><input type="hidden" name="ui_obj_id" id="ui_obj_id" value="'+options.objId+'"><input type="hidden" name="btn_save_comment" value="delete"><input type="hidden" name="ui_cm_id" value="'+cmId+'"><div class="form-group"><div class="col-sm-12 text-center">Удалить комментарий?</div></div></form>';
		
		$('__del_comment_dialog__').mcDialog({
			title: 'Удаление комментария'
			, body: formBody
			, onOpen: function ($dialog)
			{
				$dialog.find('#'+formId).postRes({
					btnId: $dialog.find('#'+formBtnId),
					onSuccess: function($respDialog, resp)
					{
						$dialog.modal('hide');
						$respDialog.modal('hide');
						
						$(window).scrollTo($commentItem, 4, {axis:'y', interrupt: true, limit: false});
						$commentItem.remove();
						//TODO передавать кол-во удаленных комментариев
						alert('TODO передавать кол-во удаленных комментариев');
						commentCountUpdate($(options.commentCount), '-');
						return false;
					},
					onFail: function ($respDialog, resp)
					{
						//$dialog.hide();
						//$respDialog.modal('hide');
						return true;
					},
					onClose: function ($respDialog)
					{
						$dialog.show().css('overflow', 'visible');
					}
				});
			}
			, buttons: [
				{
					title: 'да'
					, name: formBtnId
					, cssClass: 'btn-success'
				},
				{
					title: 'нет'
					,name: 'btn_del_comment_cancel'
					,cssClass: 'btn-danger'
					,func:
					{
						"click": function($mcDialog)
						{
							$mcDialog.modal('hide');
							$(window).scrollTo($commentItem, 4, {axis:'y', interrupt: true, limit: false});
						}
					}
				}
			]
		});
	}
	
	function addComment(options, cmId, action, $commentItem)
	{
		var $formAddComment;
		if ($commentItem)
		{
			$formAddComment = $(commentForm(options, cmId, action));
			var $commentText = $commentItem.find(options.commentText);
			if ($commentText.find('form').length)
			{
				$('#'+$formAddComment.attr('id')).remove();
				return;
			}
			
			$formAddComment.appendTo($commentText);
			$formAddComment = $('#'+$formAddComment.attr('id'));
			$formAddComment.find('textarea').focus();
		}
		else 
		{
			$formAddComment = $(options.formAddComment+'#formAddComment0');
		}
		
		$formAddComment.postRes({
			btnId: 'btn_comment_'+action,
			buttons: [
				{
					title: 'Ok'
					,name: 'btn_error_'+action
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
				if (action == 'add')
				addCommentToPage(respData, options, $formAddComment);
				
				else if (action == 'edit')
					updateComment(respData, $formAddComment, $commentText);
				return false;
			}
		});
		
		return $formAddComment;
	}
	
	function commentForm(options, cmIid, action)
	{
		var btnText='';
		if (action == 'add')
		{
			btnText = 'добавить';
		}
		else
		{
			action = 'edit';
			btnText = 'сохранить';
		}
		var html = '<form action="'+options.uri+'" method="post" class="text-center form-add-comment js-form-add-comment" id="formAddComment'+cmIid+'">';
		html += '<input type="hidden" name="ui_obj_id" id="ui_obj_id" value="'+options.objId+'">';
		
		if (action == 'add')
			html += '<input type="hidden" name="ui_cm_pid" id="ui_cm_pid" value="'+cmIid+'">';
		
		if (action == 'edit')
			html += '<input type="hidden" name="ui_cm_id" id="ui_cm_id" value="'+cmIid+'">';
		
		html += '<div class="form-group t_comment">';
		//html += '<div class="col-sm-6">';
		html += '<textarea class="form-control" id="t_comment" name="t_comment" autofocus="true" placeholder="комментарий" maxlength="1000" rows="5"></textarea>';
		//html += '</div>';
		html += '</div>';
		html += '<div class="form-group">';
		html += '<input type="hidden" name="btn_save_comment" value="'+action+'">';
		html += '<button type="button" class="btn btn-xs btn-primary" id="btn_comment_'+action+'" value="1" data-loading-text="добавляю..." autocomplete="off">'+btnText+'</button>';
		html += '&nbsp;';
		html += '<button type="button" class="btn btn-xs btn-danger js-comment-action" data-action="cancel" autocomplete="off">отменить</button>';
		html += '</div>';
		html += '</form>';
		
		return html;
	}
	
	function updateComment(respData, $formAddComment, $commentText)
	{
		$formAddComment.remove();
		
		if (!!$commentText === false || !$commentText.length || !!respData['cm_text_array'] === false)
			return;
		
		$commentText.html('<p>'+respData['cm_text_array'].join('</p><p>')+'</p>');
		
		respData['cm_id'];
		
		(MCJS['comments']||[]).forEach(function(item, inx, arr)
		{
			if (item['cm_id'] == respData['cm_id'])
			{
				arr[inx] = respData;
			}
		});
	}
	function addCommentToPage(respData, options, $formAddComment)
	{
		var comment_level = 'comment-level-'+(!!respData['cm_level'] && respData['cm_level']>=10 ? 10 : respData['cm_level']);
		var html = '<li data-cm-id="'+respData['cm_id']+'" data-cm-pid="'+respData['cm_pid']+'" class="comment-item '+comment_level+' js-comment-item">';
					
		html += userHtml(respData['user']||{});
		html += '<div class="comment-data">';
		
			html += '<div class="comment-date">'+respData['dt_create_ts']+'</div>';
			html += '<div class="comment-action">';
				html += '<a class="js-comment-action" data-action="add">комментировать</a>';
				if (respData['cm_editable'])
				{
					html += '<a class="js-comment-action" data-action="delete" title="удалить" data-toggle="tooltip" data-placement="auto"><i class="fa fa-fw fa-trash-o"  aria-hidden="true"></i></a>';
					html += '<a class="js-comment-action" data-action="edit" title="изменить" data-toggle="tooltip" data-placement="auto"><i class="fa fa-fw fa-pencil-square-o" aria-hidden="true"></i></a>';
				}
				if (!respData['cm_owner'])
				{
					html += '<a style="color: #5cb85c;" class="js-comment-action" data-action="like" title="нравится" data-toggle="tooltip" data-placement="auto"><i class="fa fa-fw fa-thumbs-o-up" aria-hidden="true"></i><sup class="badge">21</sup></a>';
					html += '<a style="color: #cc0000;" class="js-comment-action" data-action="dislike" title="не нравится" data-toggle="tooltip" data-placement="auto"><i class="fa fa-fw fa-thumbs-o-down" aria-hidden="true"></i><sub class="badge">21</sub></a>';
					html += '';
				}
			html += '</div>';
			
			html += '<div class="comment-text js-comment-text">';
				html += respData['cm_hide'];
				html += '<p>'+(respData['cm_text_array']||[]).join('</p><p>')+'</p>';
			html += '</div>';
		html += '</div>';
		//html += respData['cm_text'];
		html += '</li>';
		
		var $commentList = $(options.commentList);
		
		if (!!MCJS['comments'])
		{
			MCJS['comments'].push(respData);
		}
		
		console.log('respData = ', respData);
		
		$formAddComment.find('textarea').val('');
		commentCountUpdate($(options.commentCount), '+');
		
		var $uiCmPid = $formAddComment.find('input#ui_cm_pid');
		if ($uiCmPid.length && parseInt($uiCmPid.val(), 10) > 0)
		{
			$formAddComment.remove();
		}
		
		var $last = $('[data-cm-pid="'+respData['cm_pid']+'"]').last();
		if (respData['cm_pid'] == 0)
			$commentList.append(html);
		else
		{
			if (!$last.length)
				$last = $('[data-cm-id="'+respData['cm_pid']+'"]');
			
			$last.after(html);
		}
		
		if ($last.length)
		$(window).scrollTo($last, 4, {axis:'y', interrupt: true, limit: false});
	}
	
	function userHtml(user_owner)
	{
		//console.log("!!user_owner['previews'] = ", !!user_owner['previews']);
		var ava = (!!user_owner['previews'] && user_owner['previews']['100_100']);
		var avaSrc = (ava ? user_owner['previews']['100_100'] : '/_0.gif');
		
		var html = '<div class="comment-user">';
			html += '<div class="owner">';
				html += '<a class="owner_ava" href="/profile/'+user_owner['u_id']+'/">';
				html += '<img class="img-circle img-responsive '+(ava ? '':'hidden')+'" src="'+avaSrc+'" alt="'+user_owner['u_display_name']+'" />';
				html += '<i class="fa fa-user '+(ava ? 'hidden':'')+'"></i>';
				html += '</a>';
				html += '<div class="owner_info">';
				html += '<div class="owner_info_name"><a href="/profile/'+user_owner['u_id']+'/">'+user_owner['u_display_name']+'</a></div>';
				html += '<div class="owner_info_location" data-toggle="tooltip" data-placement="auto" title="'+user_owner['l_full_name']+'"><i class="fa fa-fw fa-map-marker"></i>'+(user_owner['l_name']||'не указано')+'</div>';
				html += '</div>';
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