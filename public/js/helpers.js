/**
 * Created by ra on 28.07.16.
 */
jQuery(document).ready(function ()
{
	var $gotoUp = $('.goto-up');
	var gotoUpTimeout = null;
	function gotoUpHideShow($self, display)
	{
		clearTimeout(gotoUpTimeout);
		gotoUpTimeout = null;

		//display = display||false;
		var opacity = (display ? 0.3 : 0);

		$self.css('opacity', opacity);
		if (display)
			$self.css('display', 'block');
		else
			$self.hide();
	}

	$(window).on('scroll', function ()
	{
		gotoUpTimeout = setTimeout(function ()
		{
			var wH = $(this).outerHeight()/2;
			if (window.scrollY >= wH)
				gotoUpHideShow($gotoUp, true);
			else
				gotoUpHideShow($gotoUp, false);
		}, 800);
	});
	$gotoUp.click(function ()
	{
		$(window).scrollTo(0, 1000, {axis:'y', interrupt: true, limit: false});

		gotoUpHideShow($gotoUp, false);
	});

	if (window["Helpers"])
		return;

	var Helpers = {};

	Helpers.tabList = function ()
	{
		var hash = window.location.hash;
			hash = hash.split('#')[1];
		var $tabList = $('[role="tablist"]').find('[role="presentation"]');
		if (!$tabList.length)
			return;

		var find = false;
		$tabList.each(function (i, item)
		{
			//$(item).removeClass('active');

			if ($(item).find('[aria-controls="'+hash+'"]').length)
			{
				find = true;
				//$(item).addClass('active');
				$(item).find('[role=tab]').click();
			}
		});

		if (!find)
			$tabList.first().addClass('active');

		$tabList.find('[role=tab]').on('click', function ()
		{
			if ($(this).attr('aria-controls'))
			window.location.hash = $(this).attr('aria-controls');
		});
	};

	Helpers.tabList();

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

	Helpers.sharingSocNet = {
		init: function ()
		{
			var self = this;
			var $sharingSocNet = $('.sharingSocNet');
			var socList = ($sharingSocNet.attr('data-soc-list')||'').split(',') || [];
			var socLinks = '';

			socList.forEach(function (socName)
			{
				switch (socName)
				{
					case 'vk':

						socLinks += '<a rel="nofollow" title="ВКонтакте" href="javascript:void(0);" class=""><i class="fa fa-fw fa-vk"></i></a>';

						$(document).on('click', '.sharingSocNet .fa-vk', function ()
						{
							self.socialSharing(socName);
						});
						
						break;

					case 'ok':
						socLinks += '<a rel="nofollow" title="Одноклассники" href="javascript:void(0);"><i class="fa fa-fw fa-odnoklassniki"></i></a>';

						$(document).on('click', '.sharingSocNet .fa-odnoklassniki', function ()
						{
							self.socialSharing(socName);
						});
						break;

					case 'fb':
						socLinks += '<a rel="nofollow" title="FaceBook" href="javascript:void(0);"><i class="fa fa-fw fa-facebook"></i></a>';

						$(document).on('click', '.sharingSocNet .fa-facebook', function ()
						{
							self.socialSharing(socName);
						});
						break;

					case 'tw':
						socLinks += '<a rel="nofollow" title="Twitter" href="javascript:void(0);"><i class="fa fa-fw fa-twitter"></i></a>';

						$(document).on('click', '.sharingSocNet .fa-twitter', function ()
						{
							self.socialSharing(socName);
						});
						break;

					case 'gp':
						socLinks += '<a rel="nofollow" title="Google+" href="javascript:void(0);"><i class="fa fa-fw fa-google-plus"></i></a>';

						$(document).on('click', '.sharingSocNet .fa-google-plus', function ()
						{
							self.socialSharing(socName);
						});
						break;
				}
			});

			if (socLinks)
			{
				socLinks = '<i class="fa fa-fw fa-share-alt"></i>&nbsp;поделиться: '+socLinks;
				$sharingSocNet.empty().append(socLinks);
			}
		},
		socialSharing: function (socName, shareUrl)
		{
			shareUrl = shareUrl || window.location.href;
			shareUrl = fixedEncodeURIComponent(shareUrl);

			switch(socName)
			{
				case 'vk':
					shareUrl = 'https://vk.com/share.php?url=' + shareUrl;
					break;

				case 'ok':
					shareUrl = 'http://www.ok.ru/dk?st.cmd=addShare&st.s=1&st._surl=' + shareUrl;
					break;

				case 'fb':
					//shareUrl = 'http://www.facebook.com/share.php?u=' + shareUrl +'&title' + shareTitle;
					shareUrl = 'http://www.facebook.com/share.php?u=' + shareUrl;
					break;

				case 'tw':
					//shareTitle = shareTitle.substr(0, 120);
					//shareUrl = 'http://twitter.com/intent/tweet?status='+shareTitle+'+' + shareUrl;
					shareUrl = 'http://twitter.com/intent/tweet?status=' + shareUrl;
					break;

				case 'gp':
					shareUrl = 'https://plus.google.com/share?url=' + shareUrl;
					break;

				case 'moi_mir': //мой мир mail.ru
					shareUrl = 'http://connect.mail.ru/share?share_url=' + shareUrl;
					break;

				default:
					return false;
					break;
			}

			window.open(shareUrl,'socSharing','width=640,height=480');//если меньше 640 VK почему-то сжимает окно...

			return false;
		}
	};
	Helpers.sharingSocNet.init();


	window["Helpers"] = Helpers;
});