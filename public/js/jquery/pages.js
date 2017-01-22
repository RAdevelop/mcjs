/**
 * Created by ra on 20.08.16.
 */
(function($)
{
	if (window["Pagination"])
		return;

	var Pagination = {
		pages: {}
	};

	Pagination.setPages = function (props)
	{
		Object.assign(this.pages, props);
		/*for(var p in props)
		{
			this.pages[p] = props[p];
		}*/
	};

	Pagination.btnNextPage = function ()
	{
		return $('.js-pages-navigation .js-next-pages');
	};
	Pagination.init = function ()
	{
		Pagination.setPages(MCJS["pages"] || null);

		//console.log((!Pagination.pages || !MCJS[Pagination.pages.ajaxDataTarget]));

		if (!Pagination.pages || !MCJS[Pagination.pages['ajaxDataTarget']])
			return;

		//var strPages = md5(Pagination.sPages(Pagination.pages));
		var page = Pagination.pages.page;
		var pagesUri = Pagination.pages.uri;
		var ts = (new Date()).getTime();

		Pagination.btnNextPage().click(function (event)
		{
			event.preventDefault();
			event.stopPropagation();

			var $self = $(this);
			var clickTs = (new Date()).getTime();
			var next = (parseInt(page, 10) + 1);

			//if (clickTs - ts <= 1000 || strPages != md5(Pagination.sPages(Pagination.pages)))
			if (clickTs - ts <= 1000)
				return;
			else
				ts = clickTs;

			if (next > Pagination.pages.total_pages)
			{
				$self.hide();
				return;
			}

			var sendData = {};
			var uri = pagesUri+'/page/'+next+'/';
			
			$self.button('loading');

			$.ajax({
				url: uri,
				method: "GET",
				data: sendData,
				dataType: "json"
			})
				.done(function(resData)
				{
					$self.button('reset');
					//console.log(resData);

					//if (!resData["pages"] || !resData["html"] || !resData["pages"]["ajaxDataSrc"])
					if (!resData["pages"] || !resData["html"])
						return;

					Pagination.setPages(resData["pages"]);

					var dataSrc = [];

					//иначе передача по ссылке идет
					for (var p in Pagination["pages"]["ajaxDataSrc"])
					{
						dataSrc[p] = Pagination["pages"]["ajaxDataSrc"][p];
					}

					var data = Pagination.getDataSrc(dataSrc, resData);

					if (!data.length)
						return;

					page = resData["pages"]["page"];
					$self.attr('href', [Pagination["pages"]["uri"], 'page', (page+1)].join('/')+'/');

					//console.log(data);

					for(var i in data)
					{
						if (data[i].hasOwnProperty("previews"))
							preloadImages(data[i]["previews"]);
					}

					//MCJS[resData["pages"]["ajaxDataTarget"]] = MCJS[resData["pages"]["ajaxDataTarget"]].concat(data);
					MCJS[Pagination["pages"]["ajaxDataTarget"]] = MCJS[Pagination["pages"]["ajaxDataTarget"]].concat(data);

					var $htmlContainer = $(Pagination["pages"]["jQuerySelector"]).parent();

					var minHeight = $(Pagination["pages"]["jQuerySelector"]).height();

					var $html  = $('<div>'+resData["html"]+'</div>').find(Pagination["pages"]["jQuerySelector"]);

					$htmlContainer.append($html);

					if (resData["pages"]["last_page"])
						$self.button('reset').hide();

					var $items = $htmlContainer.children();
					$items.each(function (i, item)
					{
						$(item).css('height', minHeight);
					});

					var $scrollToItem = $($items.get( $items.size() - $html.size() ));

					if ($scrollToItem.size())
					{
						var to = parseInt($scrollToItem.offset().top, 10) - $('#navbarFixedTop').outerHeight();

						$(window).delay(Pagination.scrollDelayMs).scrollTo(to, 1000, {axis:'y', interrupt: true, limit: false});
					}
				})
				.fail(function(resData)
				{
					$self.button('reset');
					//console.log(resData);
				});
		});

		Pagination.scrollDelayMs = 500;

		Pagination.getDataSrc = function (aDataSrc, resData)
		{
			var ajaxDataSrc = aDataSrc || [];

			if (!ajaxDataSrc || !ajaxDataSrc.length || !resData)
				return [];

			for(var i = 0; i < ajaxDataSrc.length; i++)
			{
				var dataSrc = ajaxDataSrc[i];

				if (resData.hasOwnProperty(dataSrc))
				{
					ajaxDataSrc.splice(i, 1);

					if (ajaxDataSrc.length)
						return Pagination.getDataSrc(ajaxDataSrc, resData[dataSrc]);
					else
						return resData[dataSrc] || [];
				}
			}

			return [];
		}
	};

	Pagination.sPages = function (pages)
	{
		var sPages = '';

		for(var i in pages)
		{
			if (pages.hasOwnProperty(i))
				sPages += pages[i].toString();
		}

		return sPages;
	};

	Pagination.clickNextPageBtn = function (cb)
	{
		Pagination.btnNextPage().click();

		if (cb && typeof cb==='function') cb(Pagination.btnNextPage());
	};


	Pagination.init();

	window["Pagination"] = Pagination;

})(jQuery);