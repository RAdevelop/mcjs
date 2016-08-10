/**
 * Created by RA on 28.02.2016.
 */
$(function()
{
	var $rmFormBody = $('#controllerMethodsFormBody');
	var $rmAddForm = $('#rmAddForm');
	var $rmName = $rmAddForm.find('#s_rm_method');
	var $btnAddMethod = $rmAddForm.find('#btn_add_rm_method');
	
	function add_click(event)
	{
		event.preventDefault();
		
		var formData = $rmAddForm.serialize();
		
		$.ajax({
				url: $rmAddForm.attr('action'),
				method: "POST",
				data: formData,
				dataType: "json"
			})
			.done(function(data)
			{
				if(data.formError.error == true)
				{
					var $formHtml = $(data.html).find('#rmAddForm');
					$rmAddForm.html($formHtml.html());
					$rmAddForm.find('#btn_add_rm_method').bind('click', add_click);
				}
				else
				{
					$rmAddForm.find('.form-group').removeClass("has-error");
					$rmAddForm.find('.formError').hide();
					$rmName.val('');
				var methodForm = '<div class="col-md-3 ">' +
					'<form id="rmDelForm<%= method'+data.rmId+'" class="form-inline" action="<%= _reqOriginalUrl %>/method/del" method="post">' +
					'<input type="hidden" id="i_controller_id" name="i_controller_id" value="'+data.controllerId+'"/>' +
					'<input type="hidden" id="i_method_id" name="i_method_id" value="'+data.rmId+'"/>' +
					'<div class="form-group col-sm-12">' +
					data.s_rm_method+' <button class="btn btn-primary btn-xs" type="button" name="btn_del_rm_method" id="btn_del_rm_method'+data.rmId+'" value="del" style="float: right;">удалить</button>' +
					'</div></form></div>';
					
					$rmFormBody.find('.methodsList').prepend(methodForm);
				}
			})
			.fail(function(data)
			{
				//console.log( data );
			}
		);
		return false;
	}
	
	$btnAddMethod.click(add_click);
	
	//Delete action
	
	var $btnDelMethod = $('button[name="btn_del_rm_method"]');
	var $formDelMethod;
	$btnDelMethod.click(function(event)
	{
		event.preventDefault();
		
		$formDelMethod = $(this).closest('form[id^="rmDelForm"]'); //начинается с rmDelForm 
		
		var formData = $formDelMethod.serialize();
		
		$.ajax({
				url: $formDelMethod.attr('action'),
				method: "POST",
				data: formData,
				dataType: "json"
			})
			.done(function(data)
			{				
				if(!data.formError.error)
				{
					$formDelMethod.parent().remove();
				}
			})
			.fail(function(data)
			{
				//console.log( data );
			}
		);
		
		return false;
	});
});