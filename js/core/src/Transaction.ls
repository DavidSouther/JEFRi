#     JEFRi PostStore.js 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For all details and documentation:
#     http://jefri.org

# ## Transactions
	# ### Transaction
	# Object to handle transactions.
	JEFRi.Transaction = (spec, store) ->
		@ <<<
			attributes: {}
			store: store
			entities: if (spec instanceof Array) then spec else [spec]

	# ### Prototype
	JEFRi.Transaction:: <<<
		# ### toString
		toString: ->
			store = @store
			transaction =
				attributes: @attributes
				entities: []

			for entity in @entities
				transaction.entities.push if _.isEntity(entity) then entity._encode! else entity

			return JSON.stringify(transaction)

		# ### get*([store])*
		# Execute the transaction as a GET request
		get: (store) ->
			d = new _.Deferred!
			@getting <: {}
			@gotten :> once = ->
				d.resolve(@)
				@ -:> once

			store = store || @store
			store.execute('get', @)
			d.promise!

		# ### persist*([store])*
		# Execute the transaction as a POST request
		persist: (store) ->
			d = _.Deferred!
			store = store || @store
			@persisting <: {}
			@persisted <: (e, data) ->
				for entity in e.entities
					entity.persisted <: {}
				d.resolve data
			if @store 
				@store.persist(@)

			d.promise!

		# ### add*(spec...)*
		# Add several entities to the transaction
		add: (spec) ->
			#Force spec to be an array
			spec = if _.isArray(spec) then spec else [].slice.call(arguments, 0)
			for s in spec
				# TODO switch to direct lookup.
				if _.indexBy(@entities, JEFRi.EntityComparator s) < 0
					#Hasn't been added yet...
					@entities.push(s)
			return @


		# ### attributes*(attributes)*
		# Set several attributes on the transaction
		attributes: (attributes) ->
			@attributes <<< attributes
			@
