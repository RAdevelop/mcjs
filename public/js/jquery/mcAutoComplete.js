(function($) {

	if (!!$.fn.mcAutoComplete === true)
		return ;

	$.fn.mcAutoComplete = function(params)
	{
		/* значение по умолчанию */
		var defaults = {
			mode: 'comma',
			minLength: 2,
			tags: [],
			key_name: '',
			onSelect: null,
			onTyping: null
		};

		/*при многократном вызове функции настройки будут сохранятся, и замещаться при необходимости*/
		var options = $.extend({}, defaults, params);
		/**/

		options.modeComma = (options.mode == 'comma');
		options.modeCustom = (options.mode == 'custom');

		var tags = (options.tags||[]).map(function (tag)
		{
			if (options.modeComma && !!tag[options.key_name])
			return tag[options.key_name];

			return tag;
		});

		options.tags = tags;

		var $self = $(this);

		if (!$self.length || !options.tags.length)
			return;

		$self.val($self.val().trim());

		if(options.modeComma && $self.val() !='')
			$self.val($self.val() +', ');

		function split( val )
		{
			return val.split( /,\s*/ );
		}
		function extractLast( term )
		{
			return split( term ).pop();
		}

		switch(options.mode)
		{
			default:
			case 'comma':
				$self
				// don't navigate away from the field on tab when selecting an item
					.on( "keydown", function( event )
					{
						if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active )
						{
							event.preventDefault();
							if (typeof options.onTyping === 'function')
								options.onTyping();
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

							if (typeof options.onSelect === 'function')
								options.onSelect(event, ui);

							return false;
						}
					});
				break;

			case 'custom':

				$self.autocomplete({
					minLength: options.minLength,
					source: tags,
					focus: function( event, ui )
					{
						//console.log('ui.item = ', ui.item);

						$self.val( ui.item.label );
						return false;
					},
					select: function( event, ui )
					{
						$self.val( ui.item.value );

						if (typeof options.onSelect === 'function')
							options.onSelect(event, ui);

						return false;
					}
				})
					.autocomplete( "instance" )._renderItem = function( ul, item )
				{
					//console.log('item = ', item);

					if (typeof options.onTyping === 'function')
						options.onTyping();

					return $( "<li>" )
						.append( "<div>" + item.label + "</div>" )
						.appendTo( ul );
				};
				break;
		}

		return $self;
	}
})(jQuery);