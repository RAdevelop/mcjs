(function($)
{
	$.fn.topTools = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			u_id: ''
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);

		options.u_id = parseInt(options.u_id, 10)||null;
		/**/
		var $topTools = $(this);
		
		function feedBackForm(formId)
		{
			var html = '<form class="form-horizontal" action="/feedback" method="post" id="'+formId+'">' +
				'<input type="hidden" name="ui_u_id" value="'+options.u_id+'"/>';
			
				if (!options.u_id)
				{
					html += '<div class="form-group m_email">' +
					'<div class="col-sm-12">' +
					'<input type="text" class="form-control" id="m_email" name="m_email" value="" placeholder="ваш e-mail" required maxlength="100"/>' +
					'</div>' +
					'</div>';
				}
			
			html += '<div class="form-group s_feedback_subject">' +
					'<div class="col-sm-12">' +
						'<input type="text" class="form-control" id="s_feedback_subject" name="s_feedback_subject" value="" placeholder="тема сообщения" required maxlength="100"/>' +
					'</div>' +
				'</div>' +
				'<div class="form-group t_feedback_text">' +
					'<div class="col-sm-12">' +
						'<textarea class="form-control" id="t_feedback_text" name="t_feedback_text" required placeholder="текст сообщения"></textarea>' +
					'</div>' +
				'</div>'+
				'<div class="form-group b_user_agreement">' +
					'<div class="col-sm-12 checkbox">' +
						'<label><input type="checkbox" name="b_user_agreement">принимаю</label>' +
						'<span class="help-block">отправляя письмо, принимаю <a href="/user_agreement.html" target="_blank">пользовательское соглашение?</a></span>' +
					'</div>' +
				'</div>' +
			'</form>';

			return html;
		}

		$topTools.click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();
			
			var $self = $(this);
			
			var action = $self.data('action');
			//console.log('action = ', action);
			switch (action)
			{
				case 'feedback':
					var formId = 'feedBackForm';
					var btn = 'btn_feedback';
					
					$('__feedback_dialog__').mcDialog({
						title: 'Обратная связь'
						, body: feedBackForm(formId)
						, onOpen: function ($dialog)
						{
							var $form = $dialog.find('#'+formId);
							$form.postRes({
								btnId: $dialog.find('#'+btn),
								onSuccess: function($respDialog, resp)
								{
									$form.html('<p>Письмо успешно отправлено.</p>');
									setTimeout(function ()
									{
										$dialog.modal('hide');
									}, 1500);

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
						, buttons: [
							{
								title: 'отправить'
								, name: btn
								, cssClass: 'btn-success'
							},
							{
								title: 'нет'
								,name: 'btn_cancel_'+btn
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

		return $topTools;
	};
})(jQuery);