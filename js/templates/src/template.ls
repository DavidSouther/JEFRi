# JEFRi template.ls 0.1.0
# (c) 2012 David Souther
# JEFRi is freely distributable under the MIT license.
# For all details and documentation:
# http://jefri.org

let $ = jQuery
	'use strict'
	$.fn.merge = ($doms) ->
		# Remove all comments
		$doms.clean!
		$doms.filter("[id]").each !(i, dom) ~>
			$dom = $(dom)
			id = $dom.attr "id"
			$child = this.children \# + id
			if $child.length is 0
				@append($dom)
			else
				$child.merge($dom.children!)
		$rest = $doms.filter ":not([id])"
		#[id]s handled, replace kids
		if $rest.length
			@children(":not([id])").remove!
			@append $rest
		@

	$.fn.stamp = (data) ->
		return if not @length
		# Stamp the children
		@children!stamp(data)
		# Replace data-stamp-*
		@each ->
			mold = $(@).data!
			for key, value of mold
				if /^stamp/.test key
					attribute = key.substring(5).toLowerCase!
					switch attribute
						when "text" then $(@).text data[value]
						else $(@).attr attribute, data[value]
		@

	cleanComments = !(node) ->
		len$ = (ref$ = node.childNodes).length
		for i$ from len$ - 1 to 0 by -1
			cleanComments ref$[i$]
		if node.nodeType is 8
			node.parentNode.removeChild node

	$.fn.clean = ->
		@each -> cleanComments &1
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
		template := $ "<div id='_jefri_binding_templates'></div>"
		template.clear = _clear
	_clear!

	# Add a new root block to our templates.
	mergeTemplate = (html) ->
		template.merge $(html)

	# Load several templates
	loadTemplates = (templates) ->
		d = _.Deferred!
		templates := if _.isArray templates then templates else Array.prototype.slice.call arguments
		# Store the deferred of each get request.
		for T, i in templates
			templates[i] = _.get T

		_.when.apply(null, templates).done ->
			# When behaves differently if there are 1 or 2+ args.
			args = if templates.length is 1 then [arguments] else arguments
			for tmpl in args
				# The actual HTML is at position 0 for most requests.
				mergeTemplate(if tmpl.length? then tmpl[0] else tmpl)
			JEFRi.Template.loaded <: {}
			d.resolve!
		d.promise!

	# Finders to coalesce different templates into a single hierarchical system
	find = (path) ->
		path = if _.isString path then path.split \. else if _.isArray path then path else []
		for x, i in path
			path[i] = null if path[i] is ""
		[root, theme, entity, property, view] = path
		switch path.length
			| 1 => find.root root
			| 2 => find.theme root, theme
			| 3 => find.entity root, theme, entity
			| 4 => find.property root, theme, entity, property
			| 5 => find.view root, theme, entity, property, view

	find <<<
		root: (root = settings.paths.root) ->
			$root = template.children \# + root
			if $root.length is 0
				throw "Template root not loaded."
			$root.clone!

		theme: (root = settings.paths.root, theme = settings.paths.theme) ->
			$root = find.root root
			$theme = $root.children \# + theme
			if $theme.length isnt 1
				$theme = $root.children \# + settings.paths.theme
			$theme.clone!

		entity: (root = settings.paths.root, theme = settings.paths.theme, entity = \_default_entity) ->
			$theme = find.theme root, theme
			$entity = $theme.find \# + entity
			if $entity.length isnt 1
				$entity = $theme.children \#_default_entity
			$entity.clone!

		property: (root = settings.paths.root, theme = settings.paths.theme, entity = \_default_entity, property = \_default_property) ->
			# Use ? as shorthand for the _views special property.
			property = if property is \? then \_views else property
			$entity = find.entity root, theme, entity
			$property = $entity.find \. + property
			if $property.length isnt 1
				$property = $entity.children \._default_property
				#If there STILL isn't a property, fall back to using `_default_entity`
				if $property.length isnt 1
					$property = find.property root, theme, \_default_entity, property
			$property.clone!

		view: (root = settings.paths.root, theme = settings.paths.theme, entity = \_default_entity, property = \?, view = \view) ->
			$property = find.property root, theme, entity, property
			$view = $property.find ".#{view}"
			if $view.length isnt 1
				$view = $property.find \.view
			$view.clone!

	# The renderer returns the built and bound DOM for a JEFRi renderable thing.
	render = (thing) ->
		if JEFRi.isEntity thing
			render.entity thing
		else
			render.page thing

	render <<<
		page: (page) ->
			find \.._page

		entity: (entity, view = \view) ->
			$entity_view = find "..#{entity._type!}.?.#{view}"
			stamp =
				_name: entity._type!
				_value: entity
			$entity_view
				.addClass "_entity #{entity._type!} #{view}"
				.removeAttr \id
				.stamp stamp
			$entity_view <<< {entity, view}
			render.entity.properties $entity_view
			render.entity.relationships $entity_view
			JEFRi.Template.rendered.entity <: [entity, $entity_view]
			$entity_view

		property: (type, name, property, view = \view) ->
			$property_view = find "..#{type}.#{name}.#{view}"
			data =
				_name: name
				_value: property
			data[name] = data._value
			$property_view
				.addClass "#{type} _property #{name} _#{view}"
				.removeAttr \id
				.stamp data

		relationship: (entity, rel_name, relationship, view = \view) ->
			if relationship.type is \has_many
				rel = find "..#{entity._type!}.#{rel_name}.list"
				rels = entity[rel_name]!
				for ent in rels
					rel.append render.entity ent, \list
				return rel
			else
				return render.entity entity[rel_name]!

	render.entity <<<
		properties: !($entity_view) ->
			definition = $entity_view.entity._definition!
			$entity_view
				.children "[data-stamp-properties]"
					.addClass \properties
			for own property, property_def of definition.properties
				$entity_view
					.children "[data-stamp-properties]"
						.append render.property $entity_view.entity._type!, property, $entity_view.entity[property]!, $entity_view.view

		relationships: !($entity_view) ->
			definition = $entity_view.entity._definition!
			$entity_view
				.children "[data-stamp-relationships]"
					.addClass \relationships
			for own rel_name, relationship of definition.relationships
				$related_view = render.relationship $entity_view.entity, rel_name, relationship, $entity_view.view
				$entity_view
					.children "[data-stamp-relationships]"
						.append $related_view
			if $entity_view.find("[data-stamp-relationships] ._entity").length == 0
				$entity_view
					.children "[data-stamp-relationships]" .remove!

	do ->
		key = {}

		lock = (entity) ->
			if key[entity.id true]
				false
			else 
				key[entity.id true] = true;

		unlock = !(entity) ->
			delete key[entity.id true]

		r_e = render.entity
		render.entity = (entity, view) ->
			e = $ ""
			if lock entity
				e = r_e entity, view
				unlock entity
			e
		render.entity <<<< r_e

	init = (options) ->
		_clear!
		settings <<< options
		loadTemplates(settings.templates).promise!

	JEFRi.Template =
		init: init
		templates: -> template
		loadTemplates: loadTemplates
		settings: settings
		find: find
		render: render
		rendered: {}
