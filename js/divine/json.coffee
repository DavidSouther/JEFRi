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
	# Given an object with keys, either attach keys as properties of the entities,
	# or as a new entity and relationship
	divineObject = (key, object, context) ->
		entity = {name: key, key: '', properties: [], attributes: [], methods: []}
		for field of object
			property = {name: field, atributes:{}}
			if _.isNumber(object[field])
				property.type = "int"
			else
				property.type = "string"
			entity.properties.push(property)
		context.entities.push(entity)
		context

	# Simple counter.
	next = (=>
		i=0
		=> ++i
	)()

    # Has to verify two objects are similar. In this case, they're similar if they
    # have the same keys.
	hashObject = (object) ->
		h = ""
		keys = (->
			for key of object
				h += key)()
		keys.join('');

	# Verify that each thing in an array is similar
	divineArray = (arr, context) ->
		hash = hashObject(arr[0])
		for obj in arr
			if hash isnt hashObject(obj)
				throw { object: arr[i], hash: hash, pos: i, message: "Object at #{i} does not match hash."}
		divineObject("Field_" + next(), arr[0], context)

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