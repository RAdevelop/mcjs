"use strict";
(function($)
{
	$.fn.postRes = function(params)
	{
		var defaults = {
			formId: '',
			btnId: '',
			prefix:'',
			buttons: [],
			onFail: function($dialog){return true},
			onSuccess: function($dialog){return true},
		};
		var self = this;
		var options = $.extend({}, defaults, params);
		var $formBase = $(self.selector);
		var $btnSaveBase = $formBase.find('#'+options.btnId);
		
		$btnSaveBase.on('click', function (event)
		{
			if (this.type == 'submit') return;

			$formBase.submit();
		});
		$formBase.on('submit', function (event)
		{
			event.preventDefault();
			
			$btnSaveBase.button('loading');
			
			var _formData = $formBase.serialize();
			
			$.ajax({
				url: $formBase.attr('action'),
				method: "POST",
				data: _formData,
				dataType: "json"
			})
			.done(function(data)
			{
				//console.log(data);
				
				var formError = 
				{
					message: '',
					text:'',
					error: null,
					errorName: '',
					fields: []
				};
				
				if (data[options.prefix])
				formError = $.extend({}, formError, data[options.prefix].formError);
				else
				formError = $.extend({}, formError, data.formError);
				
				//if(formError || formError.error == false)
				
				var text = formError.text.trim() || '';
				var title = formError.message.trim();
				
				if (title == '') title = 'Данные успешно сохранены';
				
				$formBase.find('.form-group').removeClass("has-error");
				
				if(formError && formError.error == true)
				{
					$.each(formError.fields,  function(fId, fV)
					{
						if(fV)
						{
							text += '<li>' + fV + '</li>';
							$formBase.find('.' + fId).addClass("has-error");
						}
					});
					
					if (text != '') text = '<ul>'+text+'</ul>';
				}
				
				$btnSaveBase.button('reset');
				var showDialog = true;
				
				if(formError && formError.error == true)
					showDialog = options.onFail($('#mcDialog_'+self.selector.replace('#', '')));
				else
					showDialog = options.onSuccess($('#mcDialog_'+self.selector.replace('#', '')));
				
				if (showDialog)
					_postResDialogBase(self.selector, title, text, options.buttons, !formError.error);
				
				//console.log('mcDialog_'+self.selector.replace('#', ''));
			})
			.fail(function(data)
			{
				console.log(data);
				
				var text = '';
				
				switch (data.status)
				{
					default:
						text = 'Невозможно выполнить операцию';
						break;
					case 401:
						text = 'Требуется авторизация';
						break;
					case 403:
						text = 'Доступ запрещен для выполнения этой операции';
						break;
				}
				_postResDialogBase(self.selector, 'Ошибка', text, options.buttons, false);
				
				$btnSaveBase.button('reset');
			});
			
			return false;
		});
		
		return $formBase;
	}
})(jQuery);

function _postResDialogBase(dName, title, text, buttons, postRes)
{
	//buttons = buttons || ;
	$('_'+dName).mcDialog({
		title: title,
		body: text,
		buttons: buttons,
		postRes: postRes
	});
}