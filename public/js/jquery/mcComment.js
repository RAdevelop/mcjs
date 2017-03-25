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
		var html = '<li class="comment-item js-comment-item" data-cm-id="'+respData['ui_cm_id']+'" style="margin-left: 0px;">';
			html += respData['t_comment'];
			html += '</li>';
		var $commentList = $(options.commentList);
		//var $options = $(options.commentItem);
		//commentList

		console.log('respData = ', respData);
//TODO подумать как добавить коммент к комменту на клиенте
		$commentList.append(html);

		$formAddComment.find('textarea').val('');
	}
})(jQuery);