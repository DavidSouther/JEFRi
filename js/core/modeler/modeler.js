$(function(){

/**
 * A Proxy for a[href=#] click events to stop their default behaviors.
 */
$.aproxy = function(context, func){
	if(context instanceof Function)
	{	//Get the function and context in the right variables
		var t = context;
		context = func;
		func = t;
	}
	return function(e) {
		e.preventDefault();
		($.proxy(func, context))(e);
		return false;
	};
};

/**
 * Click event handler that prevents default and optionally proxies a context.
 */
$.fn.aclick = function(func, context) {
	context = context || this;
	return this.click($.aproxy(context, func));
};

$.widget("ui.entity", {
	_create: function() {
		var div = $(this.element);
		div.find('h3 > span').click($.proxy(this._header_clicked, this));
		div.find('ul > li:last > a').aclick(this._add_field, this);
		div.draggable();
	},

	_header_clicked: function(e) {
		var text = $(e.target).text();
		var input =
 			$("<input type='text' />")
				.val(text)
				.blur($.proxy(function(e){
					var text = $(e.target).val();
					$(e.target).parents('h3').html(
						$("<span />").text(text)
							.click($.proxy(this._header_clicked, this))
					);
				}, this));
		$(e.target).parents("h3").html(input);
		input.focus()
	},

	_add_field: function(e) {
		var new_field = $("#templates .new_field").clone();
		$(e.target).parents('li').before(new_field);
		new_field.find('a').aclick(this._expand_field, this);
	},

	_expand_field: function(e) {
		var li = $(e.target).parents('li');
		var field = li.find('a').text();
		var type = li.find('.type').text();
		var edit_field = $("#templates .edit_field").clone();
		li.html(edit_field);
		edit_field.find('.name').val(field);
//		edit_field.find('.type') //Need to select correct element in dropdown...
		edit_field.find('.done').click($.proxy(this._close_field, this));
	},

	_close_field: function(e) {
		var li = $(e.target).parents('li');
		var field = li.find('.name').val();
		var type = li.find('.type').val();
		var attributes = li.find('.attributes').val();
		var new_li = $('#templates .new_field').clone();
		new_li.find('a').aclick(this._expand_field, this).text(field);
		new_li.find('.type').text(type);
		li.replaceWith(new_li);
	}
});

$("#dialogs > div").dialog({width: '90%', modal: true, autoOpen: false});

$("#new_entity").click(function(){
	$("#templates .entity").clone().entity().appendTo($("#entities"));
});

$("#load_context").click(function(){
	$("#loadSave").dialog("open");
});

});
