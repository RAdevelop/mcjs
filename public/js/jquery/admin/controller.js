/**
 * Created by RA on 28.02.2016.
 */
(function($)
{
	var $cmFormBody = $('#controllerMethodsFormBody');
	var $cmAddForm = $('#cmAddForm');
	var $cmName = $cmAddForm.find('#s_cm_method');
	var $jsMethodsList = $('.js-methodsList');
	$cmAddForm.postRes({btnId: 'btn_add_cmethod',
		onSuccess: function($dialog, respData)
		{
			//console.log(respData);
			$cmName.val('');

			if ($jsMethodsList.find('[data-method-id="'+respData['ui_cm_id']+'"]').length)
				return true;

			var methodHtml = '<div class="col-xs-12 col-sm-6 col-lg-4 method-item js-method-item"><div class="input-group input-group-sm"><span class="input-group-btn"><button class="btn btn-default btn-xs" type="button" data-action="method_update" data-method-id="'+respData['ui_cm_id']+'" data-controller-id="'+respData['ui_controller_id']+'">сохранить</button></span><input type="text" class="form-control" value="'+ respData['s_cm_method'] +'"><span class="input-group-btn"><button class="btn btn-default btn-xs" type="button" data-action="method_delete" data-method-id="'+respData['ui_cm_id']+'" data-controller-id="'+respData['ui_controller_id']+'">удалить</button></span></div></div>';

			$jsMethodsList.prepend(methodHtml);

			return true;
		}
	});


	$(document).on('click', '.js-methodsList [data-method-id]', function (event)
	{
		event.preventDefault();
		var $self = $(this);
		var action = $self.data('action');

		switch (action)
		{
			default:
				return;
				break;
			case 'method_update':
			case 'method_delete':
				var formData = {};
				formData['btn_controller_save'] = action;
				formData['ui_controller_id'] = $self.data('controllerId');
				formData['ui_cm_id'] = $self.data('methodId');
				formData['s_cm_method'] = $self.parents('.js-method-item').find('input[type="text"]').val();

				//console.log(formData);return;

				$.ajax({
					url: $cmAddForm.attr('action'),
					method: "POST",
					data: formData,
					dataType: "json"
				})
					.done(function(respData)
					{
						if (respData['formError']['error'])
						{
							alert(respData['formError']['message']);
							return;
						}
						if(!respData['formError.error'])
						{
							if (action == 'method_delete')
							$self.parents('.js-method-item').remove();
						}
					})
					.fail(function(respData)
					{
						console.log( respData );
					});
				break;
		}
	});
	//Delete action
	
	var $btnDelMethod = $('button[name="btn_del_cm_method"]');
	var $formDelMethod = $cmFormBody.find('form[id^="cmDelForm"]'); //начинается с cmDelForm
	$btnDelMethod.submit(function(event)
	{
		event.preventDefault();
		var $self = $(this);
		var formData = $self.serialize();
		
		$.ajax({
				url: $formDelMethod.attr('action'),
				method: "POST",
				data: formData,
				dataType: "json"
			})
			.done(function(data)
			{				
				if(!respData['formError.error'])
				{
					$self.parent().remove();
				}
			})
			.fail(function(data)
			{
				//console.log( data );
			}
		);
		
		return false;
	});
})(jQuery);