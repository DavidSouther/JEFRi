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
 			$("<input type='text' class='name' />")
				.val(text)
				.blur($.proxy(function(e){
					text = $(e.target).val() || text;
					$(e.target).parents('h3').html(
						$("<span class='name' />").text(text)
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
	},

	name: function(name) {
		if(name === undefined) {
			return this.element.find(".name").text();
		} else {
			this.element.find(".name").text(name);
			return this;
		}
	},

	addField: function(name, type, attributes){
		var new_field = $("#templates .new_field").clone();
		new_field.find('.name').text(name);
		new_field.find('.type').text(type);
		this.element.find('.field-list > li:last').before(new_field);
	},

	save: function(){
		var entity = {
			name: this.element.find('.name:first').text(),
			key: "",
			properties: [],
			relationships: [],
			attributes: {}
		};

		this.element.find('.field-list > li:not(:last)').each(function(){
			var field = {
				name: $(this).find('.name').text(),
				type: $(this).find('.type').text(),
				attributes: {}
			};
			entity.properties.push(field);
		});
		return entity;
	}
});

$("#dialogs > div").dialog({width: '90%', modal: true, autoOpen: false});

$("#new_entity").click(function(){
	$("#templates .entity").clone().entity().appendTo($("#entities"));
});

$("#load_context").click(function(){
	$("#loadSave").dialog("open");
	$("#loadSave_do").val("Load").click(function(){
		loadContext($("#loadSave > textarea").val());
		$("#loadSave").dialog("close");
	})
});

$("#save_context").click(function(){
	$("#loadSave").dialog("open");
	$("#loadSave > textarea").val(saveContext());
	$("#loadSave_do").val("Done").click(function(){
		$("#loadSave").dialog("close");
	})
});

var loadContext = function(text){
	var rawContext = window.JSON.parse(text);
	$.each(rawContext.entities, function(){
		var entity = $("#templates .entity").clone().entity()
		.entity("name", this.name);
		$.each(this.properties, function(){
			entity.entity('addField', this.name, this.type);
		});
		entity.appendTo($("#entities"));
	});
	console.log(rawContext);
};

var saveContext = function(){
	var context = {
		meta: {},
		entities: []
	}
	$("#entities .entity").each(function(){
		context.entities.push($(this).entity('save'));
	});
	return window.JSON.stringify(context);
};

});
