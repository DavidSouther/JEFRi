( ->
	root = @

	root.JEFRi = root.JEFRi ? root.JEFRi : {}

	class LocalStore
		@settings = { version: "1.0", size: Math.pow(2, 16) }
		constructor: (options) ->
			_.extend(@settings, options)
			@settings.uri || throw { message: "LocalStore must have a unique name in options.uri" }
			#@store = openDatabase(@settings.uri, @settings.version, "JEFRi LocalStore #{@settings.uri} (#{@settings.version})", @settings.size)

		execute: (type, tranasction) ->
			$(@).trigger('sending', type, 'localStorage:', transaction, @)
			if (type == "persist")
				persist(transaction)
			else if (type == "get")
				get(transaction)
			$.Deferred().resolve(transaction);

		persist: (transaction) ->
			transaction.entities = (_save(entity) for entity in transaction.entities)

		_save = (entity) ->
			entity = _.extend({}, entity, _find(entity))
			localStorage[_key(entity)] = entity;

		get = (transaction) ->
			entities = (_find(entity) for entity in transaction.entities)

		_find = (entity) ->
			localStorage[_key(entity)] || {}

		_key = (entity) -> entity._type() + '.' + entity.id()

	root.JEFRi.LocalStore = LocalStore
)();