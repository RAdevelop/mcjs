(function($) {
	var $formUserSearch = $('#formUserSearch');
	var $country_list = $formUserSearch.find('.js-country-list a');
	var $city_list = $formUserSearch.find('.js-city-list');
	var $ui_country = $formUserSearch.find('#ui_country');
	var $s_country = $formUserSearch.find('#s_country');
	var $ui_city = $formUserSearch.find('#ui_city');
	var $s_city = $formUserSearch.find('#s_city');
	var $city_dropdown = $formUserSearch.find('.js-city-dropdown');
	
	function countrySelect(countryId)
	{
		if ($ui_country.val() == countryId || city_list[countryId])
		{
			$city_dropdown.removeClass('disabled');
			return;
		}
		
		$ui_country.val(countryId);
		
		var _formData = {
			"btn_user_search": 1,
			"ui_country": countryId
		};
		
		$city_list.empty();
		$ui_city.val('');
		$s_city.val('');
		$city_dropdown.addClass('disabled');
		
		$.ajax({
			url: $formUserSearch.attr('action'),
			method: "POST",
			data: _formData,
			dataType: "json"
		})
			.done(function(respData)
			{
				if (!!respData['city_list'] == false || respData['city_list']['list'].length == 0)
					return;
				
				var li = '';
				respData['city_list']['list'].forEach(function (item)
				{
					li = '<li><a href="javascript:void(0);" data-city-id="'+item['l_id']+'" data-city-name="'+item['l_name']+'">'+item['l_name']+'</a></li>';
					$city_list.append(li);
				});
				
				city_list[countryId] = cityListForAutoComplete(respData['city_list']['list']);
				
				$city_dropdown.removeClass('disabled');
			})
			.fail(function(respData)
			{
				console.log(respData);
			});
	}
	
	$country_list.click(function (event)
	{
		event.preventDefault();
		//event.stopPropagation();
		
		var $self = $(this);
		var countryId = $self.data('countryId');
		
		if (!countryId)
		{
			$s_country.val('');
			$ui_country.val('');
			$s_city.val('');
			$ui_city.val('');
			return;
		}
		
		$s_country.val($self.data('countryName'));
		countrySelect($self.data('countryId'));
	});
	
	$(document).on('click', $city_list.selector + ' a', function (event)
	{
		event.preventDefault();
		var $self = $(this);
		var cityId = $self.data('cityId');
		if (!cityId)
		{
			$s_city.val('');
			$ui_city.val('');
			return;
		}
		
		$ui_city.val($self.data('cityId'));
		$s_city.val($self.data('cityName'));
	});
	
	var country_list = MCJS['country_list']['list']||[];
	var city_list = MCJS['city_list']['list']||{};
	
	country_list.forEach(function (item, indx, country_list)
	{
		country_list[indx]['label'] = item['l_name'];
		country_list[indx]['value'] = item['l_name'];
	});
	
	function cityListForAutoComplete(city_list)
	{
		city_list.forEach(function (item, indx, city_list)
		{
			city_list[indx]['label'] = item['l_full_name'];
			city_list[indx]['value'] = item['l_name'];
		});
		
		$s_city.mcAutoComplete({
			tags: city_list,
			mode: 'custom',
			onSelect: function(event, ui)
			{
				$s_city.val(ui.item['l_name']);
				$ui_city.val(ui.item['l_id']);
			}
		});
		
		return city_list;
	}
	
	if ($ui_country.val())
		city_list[$ui_country.val()] = cityListForAutoComplete(city_list);
	
	$s_country.mcAutoComplete({
		tags: country_list,
		mode: 'custom',
		onSelect: function(event, ui)
		{
			$s_country.val(ui.item['l_name']);
			countrySelect(ui.item['l_id']);
		},
		onTyping: function()
		{
			city_list = [];
			$city_list.empty();
			$s_city.val('');
			$ui_city.val('');
			$ui_country.val('');
			$city_dropdown.addClass('disabled');
		}
	});
})(jQuery);