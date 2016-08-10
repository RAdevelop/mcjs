"use strict";
function _htmlDialog(data)
{
	var defaults = {
		id: '',
		title: 'Заголовок диалога',
		body: 'контентная часть диалога',
		buttons: []
	};
	var options = $.extend({}, defaults, data);
	
	var htmlDialog = '';
	htmlDialog += '<div class="modal fade" id="'+options.id+'" tabindex="-1" role="dialog" aria-labelledby="'+options.id+'">';
	htmlDialog += '<div class="modal-dialog" role="document">';
	htmlDialog += '<div class="modal-content">';
	htmlDialog += '<div class="modal-header">';
	htmlDialog += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
	htmlDialog += '<h4 class="modal-title" id="myModalLabel">'+options.title+'</h4>';
	htmlDialog += '</div>';
	if (options.body != '')
	{
		htmlDialog += '<div class="modal-body">';
		htmlDialog += options.body;
		htmlDialog += '</div>';
	}
	htmlDialog += '<div class="modal-footer">';

	for (var i in options.buttons)
	{
		if (options.buttons[i].hasOwnProperty('cssClass') && options.buttons[i].hasOwnProperty('name') && options.buttons[i].hasOwnProperty('title'))
		htmlDialog += '<button type="button" class="btn '+options.buttons[i].cssClass+' mcDialogBtn'+options.buttons[i].name+'">'+options.buttons[i].title+'</button>';
	}
	/*htmlDialog += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
	htmlDialog += '<button type="button" class="btn btn-primary">Save changes</button>';*/
	
	htmlDialog += '</div>';
	htmlDialog += '</div>';
	htmlDialog += '</div>';
	htmlDialog += '</div>';
	
	return htmlDialog;
}

(function($)
{
	$.fn.mcDialog = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			id: 'mcDialog'+this.selector.replace('#', '')
			,title: ''
			,body: ''
			,buttons: [
				{
					title: 'Ok',
					name: 'close',
					cssClass: 'btn-primary',
					func:
					{
						"click": function($dialog, event)
						{
							$(this).modal('hide');
						}
					}
				}
			]
			,postRes: true //результат POST запроса формы... успешен или нет
			,onOpen: function onOpen($self){}
			,onClose: function onClose($self){}
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		if (options.buttons.hasOwnProperty("length") && options.buttons.length == 0)
		{
			options.buttons = defaults.buttons;
		}
		
		if ($('#'+options.id).size()) $('#'+options.id).remove();
		
		var $mcDialog = $(_htmlDialog(options)).appendTo('body').modal({});;
		
		if (options.postRes)
			$mcDialog.find('.modal-header').removeClass('text-danger').addClass('text-success');
		else
			$mcDialog.find('.modal-header').removeClass('text-success').addClass('text-danger');

		var i;
		for (i = 0; i  < options.buttons.length; i++)
		{
			var funcList = options.buttons[i]["func"];
			if (!funcList) continue;

			for (var fName in funcList)
			{
				if (!funcList.hasOwnProperty(fName)) continue;

				$mcDialog
					.find('.mcDialogBtn'+options.buttons[i]["name"])
					.on(fName, function(event)
					{
						(funcList[fName]).apply($mcDialog, [$mcDialog, event, options.postRes]);
					});
			}
		}
		//onOpen
		$mcDialog.on('shown.bs.modal', function (event)
		{
			options.onOpen($(this));
			console.log("$mcDialog.on('shown.bs.modal', function (event)");
		});
		//onClose
		$mcDialog.on('hidden.bs.modal', function (event)
		{
			options.onClose($(this));
			$(this).remove();
			console.log("$mcDialog.on('hidden.bs.modal', function (event)");
		});
		return $mcDialog;
	}
})(jQuery);