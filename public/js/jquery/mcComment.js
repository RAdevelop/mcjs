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
			, commentsCount: null
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		var $formAddComment = $('#'+options.formAddComment);
		//var formAddCommentAction = $formAddComment.attr('action');
		
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
				addComment(respData, options, $formAddComment);
				return false;
			}
		});

		return $(this);
	};

	function addComment(respData, options, $formAddComment)
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

		if (respData['cm_pid'] == 0)
			$commentList.append(html);
		else
			$('[data-cm-pid="'+respData['cm_pid']+'"]').last().after(html);

		$formAddComment.find('textarea').val('');
		commentsCountUpdate($(options.commentsCount), '+');
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
	
	function commentsCountUpdate($commentsCount, type)
	{
		var cnt = parseInt($commentsCount.text(), 10);

		if (type == '+')
			cnt = (!cnt ? 0 : cnt) + 1;
		else if (type == '-')
			cnt = (!cnt ? 0 : cnt) - 1;

		$commentsCount.text(cnt);
	}
})(jQuery);