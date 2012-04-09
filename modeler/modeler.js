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
		div.find('.field-list li:last > a').aclick(this._add_field, this);
		div.find('.relationship-list li:last > a').aclick(this._add_relationship, this);
		jsPlumb.draggable(this.element);
		div.draggable().resizable({handles: "e"});
	},

	_header_clicked: function(e) {
		var text = $(e.target).text();
		var input =
 			$("<input type='text' class='name' />")
				.val(text)
				.blur($.proxy(function(e){
					text = $(e.target).val() || text;
					$(e.target).parents(".entity").attr("id", "entity_" + text);
					$(e.target).parents('h3').html(
						$("<span class='name' />").text(text)
							.click($.proxy(this._header_clicked, this))
					);
				}, this));
		$(e.target).parents("h3").html(input);
		input.focus()
	},

	name: function(name) {
		if(name === undefined) {
			return this.element.find(".name").text();
		} else {
			this.element.find(".name").text(name);
			this.element.attr("id", "entity_" + name);
			return this;
		}
	},

	addField: function(field){
		var new_field = $("#templates .new_field").clone();
		new_field.find('.name').text(field.name);
		new_field.find('.type').text(field.type);
		this.element.find('.field-list > li:last').before(new_field);
		new_field.find('a').aclick(this._expand_field, this);
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

	addRelationship: function(relationship) {
		var new_field = $("#templates .new_relationship").clone();
		new_field.find('a').aclick(this._expand_relationship, this);

		new_field.find(".name").text(relationship.name);
		new_field.find(".type").text(relationship.type);
		new_field.find(".from").text(relationship.from.property);
		new_field.find(".to .entity").text(relationship.to.type);
		new_field.find(".to .field").text(relationship.to.property);

		this.element.find('.relationship-list > li:last').before(new_field);
	},

	_add_relationship: function(e) {
		var new_field = $("#templates .new_relationship").clone();
		$(e.target).parents('li').before(new_field);
		new_field.find('a').aclick(this._expand_relationship, this);
	},

	_expand_relationship: function(e) {
		var li = $(e.target).parents('li');
		var field = li.find('a').text();

		var edit_field = $("#templates .edit_relationship").clone();

		edit_field.find(".name").val(field);
		edit_field.find(".type").val(li.find(".type").text());

		li.parents(".entity").find(".field-list .name").each(function(){
			edit_field.find("select.from").append($("<option>" + $(this).text() + "</option>"));
		});
		edit_field.find("select.from").val(li.find(".from").text());

		$(".entity .ui-widget-header .name").each(function(){
			edit_field.find("select.to_entity").append($("<option>" + $(this).text() + "</option>"));
		});

		edit_field.find("select.to_entity").change(function(){
			var entity = $("#entity_" + edit_field.find("select.to_entity :selected").text());
			var fields = entity.find(".field-list .name").each(function(){
				edit_field.find("select.to_field").append($("<option>" + $(this).text() + "</option>"));
			});
		}).val(li.find(".to .entity").text()).change();
		edit_field.find("select.to_field").val(li.find(".to .field").text());

		edit_field.find('.done').click($.proxy(this._close_relationship, this));

		li.html(edit_field);
	},

 	_close_relationship: function(e) {
 		var li = $(e.target).parents('li');
 		var field = li.find('.name').val();
 		var type = li.find('.type').val();
 		var attributes = li.find('.attributes').val();
 		var new_li = $('#templates .new_field').clone();
 		new_li.find('a').aclick(this._expand_relationship, this).text(field);
 		new_li.find('.type').text(type);
 		li.replaceWith(new_li);
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

		this.element.find('.relationship-list > li:not(:last)').each(function(){
			var relationship = {
				name: $(this).find('.name').text(),
				type: $(this).find('.type').val(),
				to: {
					type: $(this).find('.to .entity').val(),
					property: $(this).find('.to .field').val(),
				},
				from: {
					type: $(this).parents(".entity").find(".name:first").text(),
					property: $(this).find('.from').val()
				}
			}
			entity.relationships.push(relationship);
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
	var connections = [];

	var stateMachineConnector = {
		connector:"StateMachine",
		paintStyle:{lineWidth:3,strokeStyle:"#056"},
		hoverPaintStyle:{strokeStyle:"#dbe300"},
		endpoint:"Blank",
		anchor:"Continuous",
		overlays:[ ["PlainArrow", {location:1, width:20, length:12} ]]
	};

	$.each(rawContext.entities, function(){
		var entity = $("#templates .entity").clone().entity()
		.entity("name", this.name);
		$.each(this.properties, function(){
			entity.entity('addField', this);
		});

		$.each(this.relationships, function(){
			entity.entity('addRelationship', this);
			connections.push({
				source: "entity_" + this.from.type,
				target: "entity_" + this.to.type
			});
		});

		entity.appendTo($("#entities"));
	});

	$.each(connections, function(){
		jsPlumb.connect(this, stateMachineConnector);
	});
};

var saveContext = function(){
	var context = {
		meta: {},
		entities: []
	}
	$("#entities div.entity").each(function(){
		context.entities.push($(this).entity('save'));
	});
	return window.JSON.stringify(context);
};

});
