(function($) {

	//return ;
	$.fn.mcDialog = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			title: '',
			onOpen: function (dBody) {},
			onClose: function (dBody) {},
			buttons: [],
			postRes: false
		};
		
		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/
		
		var $dialog = $(this);
	}	
})(jQuery);