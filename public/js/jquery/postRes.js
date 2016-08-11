"use strict";
(function($)
{
	$.fn.postRes = function(params)
	{
		var defaults = {
			formId: '',
			btnId: null,
			prefix:'',
			buttons: [],
			onFail: function($dialog, respData){return true},
			onSuccess: function($dialog, respData){return true},
			onOpen: function onOpen($self){},
			onClose: function onClose($self){}
		};
		var self = this;
		var options = $.extend({}, defaults, params);
		var $formBase = $(self.selector);

		var $btnSaveBase = null;

		if (options.btnId.hasOwnProperty("selector"))
			$btnSaveBase = options.btnId;
		else if (typeof options.btnId == 'string' && options.btnId != '')
			$btnSaveBase = $formBase.find('#'+options.btnId);

		//console.log($btnSaveBase);

		if ($btnSaveBase)
		{
			$btnSaveBase.on('click', function (event)
			{
				console.log("$btnSaveBase.on('click', function (event)");

				if (this.type == 'submit') return;

				$formBase.submit();
			});
		}
		$formBase.on('submit', function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			if ($btnSaveBase)
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

				if ($btnSaveBase)
				$btnSaveBase.button('reset');

				var showDialog = true;

				var sel = '#mcDialog_'+self.selector.replace('#', '').replace(/\s+\./, '_');

				if(formError && formError.error == true)
					showDialog = options.onFail($(sel), data);
				else
					showDialog = options.onSuccess($(sel), data);
				
				if (showDialog)
					_postResDialogBase(self.selector, title, text, options, !formError.error);
				
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
				_postResDialogBase(self.selector, 'Ошибка', text, options, false);

				if ($btnSaveBase)
				$btnSaveBase.button('reset');
			});
			
			return false;
		});
		
		return $formBase;
	}
})(jQuery);

function _postResDialogBase(dName, title, text, options, postRes)
{
	//buttons = buttons || ;
	$('_'+dName).mcDialog({
		title: title,
		body: text,
		buttons: options.buttons,
		postRes: postRes,
		onClose: options.onClose,
		onOpen: options.onOpen
	});
}