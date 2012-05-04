define = define || (module, required, fn) ->
	# Utility to add a value to an object at a certain point in its tree.
	path = (obj, path, val) ->
		path = path.split('.')
		field = path.pop()
		piece = obj
		for part in path
			piece = piece[part] ?= {}
		piece[field] = val

	path(window, module, fn(_))

define "JEFRi.Divine.JSON", ["Underscore"], (_) ->
	# Simple counter.
	next = (->
		i=0
		-> ++i
	)()

    # Hash to verify two objects are similar. In this case, they're similar if they
    # have the same keys.
	intern = (->
		objects = {};

		(object) ->
			#Build a hash of the object's keys.
			h = _(object).keys().sort().join('');
			objects[h] = objects[h] || {name: '', key: '', properties: [], attributes: [], relationships: []}
	)()

	# Given an object with keys, either attach keys as properties of the entities,
	# or as a new entity and relationship
	divineObject = (key, object, context) ->
		entity = intern(object)
		entity.name = key
		for field of object
			property = {name: field, atributes:{}}
			if _.isNumber(object[field])
				property.type = "int"
			else
				property.type = "string"
			entity.properties.push(property)
			if entity.key == ''
				entity.key = field
		context.entities.push(entity)
		context

	# Verify that each thing in an array is similar
	divineArray = (arr, context, field) ->
		field = field || "Field_" + next()
#		hash = intern(arr[0])
#		for obj in arr
#			if hash isnt intern(obj)
#				throw { object: arr[i], hash: hash, pos: i, message: "Object at #{i} does not match hash."}
		divineObject(field, arr[0], context)

	# Divine the structure of a JSON data source.
	(json) ->
		if _.isString(json)
		 	json = window.JSON.parse(json)

		sampleContext = {meta: {}, entities: []}

		if _.isArray(json)
			divineArray(json, sampleContext)
		else if _.isObject(json)
			for field of json
				divineObject(field, json[field], sampleContext)
		sampleContext