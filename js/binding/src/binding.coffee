# JEFRi Binding.js 0.1.0
# (c) 2012 David Souther
# JEFRi is freely distributable under the MIT license.
# For all details and documentation:
# http://jefri.org

((($) ->
	$.fn.merge = (doms) ->
		doms.filter("[id]").each (i, dom) =>
			dom = $(dom)
			id = dom.attr("id")
			child = this.children("#" + id)
			if child.length is 0
				this.append(dom)
			else
				child.merge(dom.children())
			null
		rest = doms.filter(":not([id])")
		#[id]s handled, replace kids
		if rest.length
			this.children(":not([id])").remove()
			this.append(rest)
		this
).call(this, jQuery))

(((_, $, JEFRi)->
	# Need to make some different assumptions about Templating
	_.templateSettings = {
		escape: /{{-([\s\S]+?)}}/g,
		evaluate: /{{([\s\S]+?)}}/g,
		interpolate: /{{=([\s\S]+?)}}/g
	}

	# Global Binding settings.
	settings = {
		paths : {
			root: "JEFRi"
			theme: '_default_theme'
		}
	}

	# Detached DOM node to hold templates.
	template = $()
	_clear = () ->
		template = $("<div id='_jefri_binding_templates'></div>");
		template.clear = _clear
		true

	# Add a new root block to our templates.
	mergeTemplate = (html) ->
		template.merge($(html))

	# Load several templates
	loadTemplates = (templates) ->
		d = _.Deferred()
		templates = if _.isArray(templates) then templates else Array.prototype.slice.call(arguments)
		# Load each template
		templates[i] = _.get(T) for T, i in templates
		_.when.apply(null, templates).done(() ->
			# When behaves differently if there are 1 or 2+ args.
			args = if templates.length is 1 then [arguments] else arguments
			mergeTemplate(if _.isArray(tmpl) then tmpl[0] else tmpl) for tmpl in args
			d.resolve()
			null
		)
		d.promise()

	# Finders to coalesce different templates into a single hierarchical system
	find = (path) ->
		path = if _.isString(path) then path.split('.') else if _.isArray(path) then path else []
		(path[i] = null if path[i] is "") for x, i in path
		[root, theme, entity, property, view] = path
		switch path.length
			when 1 then find.root(root)
			when 2 then find.theme(root, theme)
			when 3 then find.entity(root, theme, entity)
			when 4 then find.property(root, theme, entity, property)
			when 5 then find.view(root, theme, entity, property, view)

	_.extend(find, {
		root: (root = settings.paths.root) ->
			_root = template.children("#" + root)
			if _root.length isnt 1
				_root = template.children("#" + settings.paths.root)
			_root.clone()

		theme: (root = settings.paths.root, theme = settings.paths.theme) ->
			_root = find.root(root);
			_theme = _root.children("#" + theme);
			if _theme.length isnt 1
				_theme = _root.children("#" + settings.paths.theme)
			_theme.clone()

		entity: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity") ->
			_theme = find.theme(root, theme)
			_entity = _theme.find("#" + entity)
			if _entity.length isnt 1
				_entity = _theme.children("#_default_entity")
			_entity.clone()

		property: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity", property = "_default_property") ->
			property = if property is "?" then "_views" else property
			_entity = find.entity(root, theme, entity)
			_property = _entity.find("#" + property)
			if _property.length isnt 1
				_property = _entity.children("#_default_property")
				#If there STILL isn't a property, fall back to using `_default_entity`
				if _property.length isnt 1
					_property = find.property(root, theme, "_default_entity", property)
			_property.clone()

		view: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity", property = "?", view = "view") ->
			_property = find.property(root, theme, entity, property)
			_view = _property.find("##{view}")
			if _view.length isnt 1
				_view = _property.find("#view");
			_view.clone()
	})

	# The renderer returns the built and bound DOM for a JEFRi renderable thing.
	render = (thing) ->
		if JEFRi.isEntity(thing)
			render.entity(thing)
		else
			render.page(thing)

	_.extend(render, {
		page: (page) ->
			find(".._page")

		entity: (entity, view = "view") ->
			entity_view = find("..#{entity._type()}.?.#{view}")
			definition = entity._definition()
			entity_view.children(".properties").append(render.property(entity._type(), property, entity[property](), view)) for own property, property_def of definition.properties
			entity_view.children(".relationships").append(render.relationship(entity, rel_name, relationship, view)) for own rel_name, relationship of definition.relationships
			entity_view

		property: (type, name, property, view = "view") ->
			property_view = find("..#{type}.#{name}.#{view}")
			data = {}
			data._name = name
			data[name] = data._value = property
			property_view.addClass("#{type} _property #{name} _#{view}").
			    removeAttr('id').
				html(_.template(property_view.html(), data))

		relationship: (entity, rel_name, relationship, view = "view") ->
			if relationship.type is "has_many"
				rel = $()
				rels = entity[rel_name]()
				rel.append(render.entity(ent)) for ent in rels
				return rel
			else
				return render.entity(entity[rel_name]())
	})

	(()->
		key = {}

		lock = (entity) ->
			if key[entity.id(true)]
				return false
			return key[entity.id(true)] = true;

		unlock = (entity) ->
			delete key[entity.id(true)]

		r_e = render.entity
		render.entity = (entity, view = "view") ->
			e = $("");
			if lock(entity)
				e = r_e(entity, view)
				unlock(entity)
			return e
	)()

	init = (options) ->
		_clear()
		_.extend(true, settings, options)
		loadTemplates(settings.templates).promise()

	JEFRi.Binding = {
		init: init
		templates: () -> template
		loadTemplates: loadTemplates
		settings: settings
		find: find
		render: render
	}

	return

).call(this, _, jQuery || null, JEFRi))
