# JEFRi Binding.js 0.1.0
# (c) 2012 David Souther
# JEFRi is freely distributable under the MIT license.
# For all details and documentation:
# http://jefri.org

(((_, $, JEFRi)->
	# A deferred to handle Binding's ready state.
	ready = $.Deferred()

	# Global Binding settings.
	settings = {
		paths : {
			root: "JEFRi"
			theme: '_default_theme'
		}
	}

	# Detached DOM node to hold templates.
	template = $("<div id='_jefri_binding_templates'></div>");

	# Add a new root block to our templates.
	mergeTemplate = (html) ->
		template.append($(html))

	# Load several templates
	loadTemplates = (templates) ->
		templates = if _.isArray(templates) then templates else Array.prototype.slice.call(arguments)
		# Load each template
		templates[i] = $.get(T) for T, i in templates
		$.when.apply(null, templates).done () ->
			# When behaves differently if there are 1 or 2+ args.
			args = if templates.length is 1 then [arguments] else arguments
			mergeTemplate tmpl[0] for tmpl in args
			ready.resolve()

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
			_property.clone()

		view: (root = settings.paths.root, theme = settings.paths.theme, entity = "_default_entity", property = "?", view = "view") ->
			_property = find.property(root, theme, entity, property)
			_view = _property.find("." + view)
			if _view.length isnt 1
				_view = _property.find(".view");
			_view.clone()
	})

	init = (options) ->
		$.extend(true, settings, options)
		loadTemplates(settings.templates).done(->ready.resolve())

	JEFRi.Binding = {
		ready: ready.promise()
		init: init
		templates: () -> template
		loadTemplates: loadTemplates
		settings: settings
		find: find
	}

	return

).call(this, _, jQuery, JEFRi))
