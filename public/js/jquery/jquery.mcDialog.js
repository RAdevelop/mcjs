"use strict";
function _htmlDialog(data)
{
	var defaults = {
		id: '',
		large: false, //стандартный или широкий (true)
		title: 'Заголовок диалога',
		body: 'контентная часть диалога',
		buttons: []
	};
	var options = $.extend({}, defaults, data);
	var modal_size = (options.large ? 'modal-lg' : '');

	var htmlDialog = '';
	htmlDialog += '<div class="modal fade" id="'+options.id+'" tabindex="-1" role="dialog" aria-labelledby="'+options.id+'">';
	htmlDialog += '<div class="modal-dialog '+modal_size+' " role="document">';
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
	htmlDialog += '<div class="textCenter modal-footer">';

	for (var i in options.buttons)
	{
		if (options.buttons[i].hasOwnProperty('cssClass') && options.buttons[i].hasOwnProperty('name') && options.buttons[i].hasOwnProperty('title'))
		{
			options.buttons[i].name = options.buttons[i].name.replace('#', '_').replace(/\s+/, '_').replace(/\./, '_');

			htmlDialog += '<button type="button" class="btn '+options.buttons[i].cssClass+' '+options.buttons[i].name+'" id="'+options.buttons[i].name+'" >'+options.buttons[i].title+'</button>';
		}
	}
	
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
			id: 'mcDialog'+this.selector.replace('#', '_').replace(/\s+/, '_').replace(/\./, '_')
			,title: ''
			,large: false //стандартный или широкий диалог (true)
			,body: ''
			,buttons: [
				{
					title: 'Ok',
					name: 'btn_close',
					cssClass: 'btn-primary',
					func:
					{
						"click": function(event)
						{
							$(event.data[0]).modal('hide');
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
		
		$(_htmlDialog(options)).appendTo('body')
			.modal('hide')
			.on('shown.bs.modal', function (event)
			{
				options.onOpen($(this));
				console.log("$mcDialog.on('shown.bs.modal', function (event)");
			})
			.on('hidden.bs.modal', function (event)
			{
				options.onClose($(this));
				$(this).remove();
				console.log("$mcDialog.on('hidden.bs.modal', function (event)");
			}).modal('show');

		var $mcDialog = $('#'+options.id);

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

				options.buttons[i]["name"] = options.buttons[i]["name"].replace('#', '_').replace(/\s+/, '_').replace(/\./, '_');

				//var btn = '#'+options.buttons[i]["name"]+"_mcDialogBtn";
				var btn = '#'+options.buttons[i]["name"];

				$mcDialog
					.find(btn)
					.on(fName, [$mcDialog, options.postRes], funcList[fName]);
			}
		}

		/*//onOpen
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
		});*/
		return $mcDialog;
	}
})(jQuery);