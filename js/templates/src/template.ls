# JEFRi template.ls 0.1.0
# (c) 2012 David Souther
# JEFRi is freely distributable under the MIT license.
# For all details and documentation:
# http://jefri.org

let $ = jQuery
	'use strict'
	$.fn.merge = (doms) ->
		doms.filter("[id]").each !(i, dom) ~>
			dom = $(dom)
			id = dom.attr("id")
			child = this.children(\# + id)
			if child.length is 0
				@append(dom)
			else
				child.merge(dom.children())
		rest = doms.filter(":not([id])")
		#[id]s handled, replace kids
		if rest.length
			@children(":not([id])").remove()
			@append(rest)
		@

	$.fn.stamp = (data) ->
		return if not @length
		# Stamp the children
		@children().stamp(data)
		# Replace data-stamp-*
		@each ->
			mold = $(@).data()
			for key, value of mold
				if /^stamp/.test(key)
					attribute = key.substring(5).toLowerCase()
					switch attribute
						when "text" then $(@).text(data[value])
						else $(@).attr(attribute, data[value])
		@

let $=jQuery
	'use strict'

	# Global Binding settings.
	settings =
		paths:
			root: \JEFRi
			theme: \_default_theme

	# Detached DOM node to hold templates.
	template = null
	_clear = !->
		template := $("<div id='_jefri_binding_templates'></div>");
		template.clear = _clear
		true
	_clear!

	# Add a new root block to our templates.
	mergeTemplate = (html) ->
		template.merge($(html))

	# Load several templates
	loadTemplates = (templates) ->
		d = _.Deferred()
		templates := if _.isArray(templates) then templates else Array.prototype.slice.call(arguments)
		# Load each template
		for T, i in templates
			templates[i] = _.get(T)

		_.when.apply(null, templates).done ->
			# When behaves differently if there are 1 or 2+ args.
			args = if templates.length is 1 then [arguments] else arguments
			for tmpl in args
				mergeTemplate(if tmpl.length? then tmpl[0] else tmpl)
			JEFRi.Template.loaded <: {}
			d.resolve()
		d.promise()

	# Finders to coalesce different templates into a single hierarchical system
	find = (path) ->
		path = if _.isString(path) then path.split('.') else if _.isArray(path) then path else []
		for x, i in path
			path[i] = null if path[i] is ""
		[root, theme, entity, property, view] = path
		switch path.length
			when 1 then find.root(root)
			when 2 then find.theme(root, theme)
			when 3 then find.entity(root, theme, entity)
			when 4 then find.property(root, theme, entity, property)
			when 5 then find.view(root, theme, entity, property, view)

	$.extend find,
		root: (root = settings.paths.root) ->
			_root = template.children(\# + root)
			if _root.length is 0
				throw "Template root not loaded."
			_root.clone()

		theme: (root = settings.paths.root, theme = settings.paths.theme) ->
			_root = find.root(root);
			_theme = _root.children(\# + theme);
			if _theme.length isnt 1
				_theme = _root.children(\# + settings.paths.theme)
			_theme.clone()

		entity: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity") ->
			_theme = find.theme(root, theme)
			_entity = _theme.find(\# + entity)
			if _entity.length isnt 1
				_entity = _theme.children(\#_default_entity)
			_entity.clone()

		property: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity", property = "_default_property") ->
			property = if property is \? then \_view else property
			_entity = find.entity(root, theme, entity)
			_property = _entity.find(\# + property)
			if _property.length isnt 1
				_property = _entity.children(\#_default_property)
				#If there STILL isn't a property, fall back to using `_default_entity`
				if _property.length isnt 1
					_property = find.property(root, theme, \_default_entity, property)
			_property.clone()

		view: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity", property = "?", view = "view") ->
			_property = find.property(root, theme, entity, property)
			_view = _property.find("#{view}")
			if _view.length isnt 1
				_view = _property.find(\#view);
			_view.clone()

	# The renderer returns the built and bound DOM for a JEFRi renderable thing.
	render = (thing) ->
		if JEFRi.isEntity(thing)
			render.entity(thing)
		else
			render.page(thing)

	$.extend render,
		page: (page) ->
			find(".._page")

		entity: (entity, view = "view") ->
			entity_view = find("..#{entity._type()}.?.#{view}")
			entity_view.addClass("_entity #{entity._type()} #{view}").removeAttr("id")
			definition = entity._definition()
			for own property, property_def of definition.properties
				entity_view.children(".properties").append(render.property(entity._type(), property, entity[property](), view)) 
			for own rel_name, relationship of definition.relationships
				entity_view.children(".relationships").append(render.relationship(entity, rel_name, relationship, view)) 
			if entity_view.find(".relationships ._entity").length == 0
				entity_view.children('.relationships').remove()
			JEFRi.Template.rendered.entity <: [entity, entity_view]
			entity_view

		property: (type, name, property, view = "view") ->
			property_view = find("..#{type}.#{name}.#{view}")
			data = {}
			data._name = name
			data[name] = data._value = property
			property_view.addClass("#{type} _property #{name} _#{view}").
				removeAttr('id').
				stamp(data)

		relationship: (entity, rel_name, relationship, view = "view") ->
			if relationship.type is \has_many
				rel = find("..#{entity._type()}.#{rel_name}.list");
				rels = entity[rel_name]()
				for ent in rels
					rel.append(render.entity(ent, \list))
				return rel
			else
				return render.entity(entity[rel_name]())

	do ->
		key = {}

		lock = (entity) ->
			if key[entity.id(true)]
				return false
			return key[entity.id(true)] = true;

		unlock = (entity) ->
			delete key[entity.id(true)]
			return

		r_e = render.entity
		render.entity = (entity, view) ->
			e = $("");
			if lock(entity)
				e = r_e(entity, view)
				unlock(entity)
			return e

	init = (options) ->
		_clear()
		$.extend(true, settings, options)
		loadTemplates(settings.templates).promise()

	JEFRi.Template =
		init: init
		templates: -> template
		loadTemplates: loadTemplates
		settings: settings
		find: find
		render: render
		rendered: {}