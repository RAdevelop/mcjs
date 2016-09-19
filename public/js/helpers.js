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

	Helpers.sharingSocNet = {
		init: function ()
		{
			var self = this;
			var $sharingSocNet = $('.sharingSocNet');
			var socList = $sharingSocNet.attr('data-soc-list').split(',') || [];
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
				socLinks = 'поделиться в: '+socLinks;
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