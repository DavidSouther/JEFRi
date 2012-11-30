#     JEFRi CouchStore.coffee 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For full details and documentation:
#     http://jefri.org


	root = @

	root.JEFRi = if root.JEFRi then root.JEFRi else {}

	class CouchStore
		constructor: (options) ->
			@settings = { version: "1.0", size: Math.pow(2, 16) }
			_.extend(@settings, options)
			if not @settings.runtime
				throw {message: "CouchStore instantiated without runtime to reference."}

		# ### execute*(type, transaction)*
		# Run the transaction.
		execute: (type, transaction) ->
			transactionEvent = JSON.parse(transaction.toString())
			_(@).trigger('sending', [type, 'couchStorage:', transactionEvent, @])
			if (type == "persist")
				d = @persist(transaction)
			else if (type == "get")
				d = @get(transaction)
			d.resolve({}).promise();

		# ### persist*(transction)*
		# Treat the transaction as a persistence call. Save the data.
		persist: (transaction) ->

			_.Deferred()

		# ### get*(transaction)*
		# Treat the transaction as a lookup. Find all data matching the specs.
		get: (transaction) ->
			_.Deferred()


	root.JEFRi.CouchStore = CouchStore