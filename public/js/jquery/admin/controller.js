/**
 * Created by RA on 28.02.2016.
 */
(function($)
{
	var $cmFormBody = $('#controllerMethodsFormBody');
	var $cmAddForm = $('#cmAddForm');
	var $cmName = $cmAddForm.find('#s_cm_method');
	
	$cmAddForm.postRes({btnId: 'btn_add_cmethod',
		onSuccess: function($dialog, respData)
		{
			//console.log(respData);
			$cmName.val('');

			if ($cmFormBody.find('#cmDelForm'+respData['ui_cm_id']).length)
				return true;

			var methodForm = '<div class="col-md-3 ">' +
				'<form id="cmDelForm'+respData['ui_cm_id']+'" class="form-inline" action="'+$cmAddForm.attr('action')+'" method="post">' +
				'<input type="hidden" id="ui_controller_id" name="ui_controller_id" value="'+respData['ui_controller_id']+'"/>' +
				'<input type="hidden" id="ui_cm_id" name="ui_cm_id" value="'+respData['ui_cm_id']+'"/>' +
				'<div class="form-group col-sm-12">' + respData['s_cm_method'] +
				' <button class="btn btn-primary btn-xs" type="button" name="btn_controller_save"  value="delete_method" style="float: right;">удалить</button>' +
				'</div></form></div>';

			$cmFormBody.find('.js-methodsList').prepend(methodForm);

			return true;
		}
	});
	
	/*function add_click(event)
	{
		event.preventDefault();
		
		var formData = $cmAddForm.serialize();
		
		$.ajax({
				url: $cmAddForm.attr('action'),
				method: "POST",
				data: formData,
				dataType: "json"
			})
			.done(function(data)
			{
				if(respData['formError.error == true)
				{
					var $formHtml = $(respData['html).find('#cmAddForm');
					$cmAddForm.html($formHtml.html());
					$cmAddForm.find('#btn_add_rm_method').bind('click', add_click);
				}
				else
				{
					$cmAddForm.find('.form-group').removeClass("has-error");
					$cmAddForm.find('.formError').hide();
					$cmName.val('');
				var methodForm = '<div class="col-md-3 ">' +
					'<form id="cmDelForm<%= method'+respData['cm_id+'" class="form-inline" action="<%= _reqOriginalUrl %>/method/del" method="post">' +
					'<input type="hidden" id="i_controller_id" name="i_controller_id" value="'+respData['controllerId+'"/>' +
					'<input type="hidden" id="i_method_id" name="i_method_id" value="'+respData['cm_id+'"/>' +
					'<div class="form-group col-sm-12">' +
					respData['s_cm_method+' <button class="btn btn-primary btn-xs" type="button" name="btn_del_cm_method" id="btn_del_cm_method'+respData['cm_id+'" value="del" style="float: right;">удалить</button>' +
					'</div></form></div>';
					
					$cmFormBody.find('.js-methodsList').prepend(methodForm);
				}
			})
			.fail(function(data)
			{
				//console.log( data );
			}
		);
		return false;
	}*/
	
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