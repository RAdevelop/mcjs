/**
 * Created by ra on 28.07.16.
 */
jQuery(document).ready(function ()
{
	if (window["Helpers"])
		return;

	var Helpers = {};
	
	Helpers.initTooltip = function ()
	{
		$(document).tooltip({
			selector:'[data-toggle="tooltip"]'
			,trigger:'hover focus'
			,container: 'body'
			,placement: 'auto'
		});

		return Helpers;
	};
	Helpers.initTooltip();

	Helpers.initPopover = function ()
	{
		$('[data-toggle="popover"]').popover({
			trigger:'hover'
			,container: 'body'
			,placement: 'auto'
		});

		$(document).popover({
			selector:'.popoverHelp'
			,trigger:'hover'
			,container: 'body'
			,placement: 'auto'
			,html: true
			,content: function ()
			{
				return $('[data-popover-for="#'+this.id+'"]').html();
			}
		});

		return Helpers;
	};
	Helpers.initPopover();

	window["Helpers"] = Helpers;
});