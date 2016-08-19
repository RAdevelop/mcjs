/**
 * Created by ra on 28.07.16.
 */
$(function ()
{
	if (window["Helpers"])
		return;

	var Helpers = {};
	
	Helpers.initTooltip = function ()
	{
		$('[data-toggle="tooltip"]').tooltip();
		return Helpers;
	};
	Helpers.initTooltip();

	Helpers.initPopover = function ()
	{
		$('[data-toggle="popover"]').popover();
		return Helpers;
	};
	Helpers.initPopover();


	window["Helpers"] = Helpers;
});