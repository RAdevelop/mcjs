(function($) {

	if (!!$.fn.mcAutoComplete === true)
		return ;

	$.fn.mcAutoComplete = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			minLength: 2,
			tags: [],
			key_name: [],
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		var tags = (options.tags||[]).map(function (tag)
		{
			return tag[options.key_name];
		});

		options.tags = tags;

		var $self = $(this);
		$self.val($self.val().trim());
		
		if($self.val() !='')
			$self.val($self.val() +', ');

		function split( val )
		{
			return val.split( /,\s*/ );
		}
		function extractLast( term )
		{
			return split( term ).pop();
		}

		$self
		// don't navigate away from the field on tab when selecting an item
			.on( "keydown", function( event )
			{
				if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active )
				{
					event.preventDefault();
				}
			})
			.autocomplete({
				minLength: options.minLength,
				source: function( request, response )
				{
					// delegate back to autocomplete, but extract the last term
					response( $.ui.autocomplete.filter(options.tags, extractLast( request.term )));
				},
				focus: function()
				{
					// prevent value inserted on focus
					return false;
				},
				select: function( event, ui )
				{
					var terms = split( this.value );
					// remove the current input
					terms.pop();
					// add the selected item
					terms.push( ui.item.value );
					// add placeholder to get the comma-and-space at the end
					terms.push( "" );
					this.value = terms.join( ", " );
					return false;
				}
			});

		return $self;
	}
})(jQuery);