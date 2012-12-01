#     JEFRi LocalStore.coffee 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For full details and documentation:
#     http://jefri.org


	class ObjectStore
		(options) ->
			@settings = { version: "1.0", size: Math.pow(2, 16) }
			_.extend @settings, options
			@{}_store
			if not @settings.runtime
				throw {message: "LocalStore instantiated without runtime to reference."}

		# #### _set*(key, value)*
		# Generic key/value setter, should be overwritten by extending classes.
		_set: !(key, value)->
			@_store[key] = value

		# #### _get*(key)*
		# Generic key/value getter, should be overwritten by extending classes.
		_get: (key)->
			@_store[key] || '{}'

		# ### execute*(type, transaction)*
		# Run the transaction.
		execute: (type, transaction) ->
			transaction = _transactify transaction
			@sending <: transaction
			@"do_#{type}" transaction
			@settings.runtime.expand transaction
			_.Deferred!resolve transaction

		# #### get*(transaction)*
		# Execute as a `get` transaction.
		get: (transaction)->
			@execute 'get', transaction

		# #### persist*(transaction)*
		# Execute as a `persist` transaction.
		persist: (transction)->
			@execute 'persist', transction

		# ### do_persist*(transction)*
		# Treat the transaction as a persistence call. Save the data.
		do_persist: (transaction) ->
			transaction.entities =
				for entity in transaction.entities
					@_save entity

		# #### _save*(entity)*
		# Save the data in the store's storage.
		_save: (entity) ->
			# Merge the new data over the old data.
			entity = @_find(entity) <<<< entity
			# Store the JSON of the entity.
			@_set @_key(entity), JSON.stringify(entity)
			# Register the entity with the type map.
			@_type entity._type, entity._id
			# Return the bare encoded object.
			entity

		# ### do_get*(transaction)*
		# Treat the transaction as a lookup. Find all data matching the specs.
		do_get: (transaction) ->
			# Let _lookup handle the actual lookups. Each spec is an `or` op, so flatten then remove duplicates.
			ents = for entity in transaction.entities
				@_lookup entity
			ents = _.flatten ents
			transaction.entities = _.uniq(
				# The lookup
				_(ents).filter -> it
				false,
				# Uniq based on type.id
				~> it._type + '.' + it[@settings.runtime.definition(it._type).key]
			)
			transaction

		# #### _find*(entity)*
		# Return an entity directly, or pass a spec to _lookup.
		_find: (entity) ->
			JSON.parse @_get @_key entity

		# #### _lookup*(spec)*
		# Given a transaction spec, pull all entities (including relationships) that match.
		# See JEFRi Core documentation 5.1.1 Gory Get Details for rules.
		_lookup: (spec) ->
			# Need the key, properties, and relationships details
			def = @settings.runtime.definition spec._type
			# Get everything for this type
			results = for id in _.keys(@_type(spec._type))
				JSON.parse @_get @_key spec, id

			# If we didn't find anything, don't return anything. Rule 0.
			if results.length is 0
				return  

			# Start immediately with the key to pear down results quickly. Rule 1.
			if def.key of spec
				results = [results[spec[def.key]]]

			# Filter based on property specifications
			for name, property of def.properties
				if name of spec and name isnt def.key
					results = _(results).filter(_sieve(name, property, spec[name]))

			# Include relationships
			for name, relationship of def.relationships
				if name of spec
					# For all the entities found so far, include their relationships as well
					give = []
					take = []
					for entity, i in results
						related = do ~>
							relspec = _.extend {}, spec[name], {_type: relationship.to.type}
							relspec[relationship.to.property] = entity[relationship.property]
							# Just going to use
							@_lookup relspec

						# Giveth, or taketh away
						if  related.length
							give.push  related
						# else
						# 	take.push i
					# Remove the indicies which didn't have a relation.
					take.reverse!
					#
					for i in take
						j = i+1
						end = results[j til results.length]
						results = results[0 til i]
						[].push.apply results, end
					[].push.apply results, give

			# Return the filtered results.
			results

		# #### _type*(type[, id])*
		# Get a set of stored IDs for a particular type. If an ID is passed in, add it to the set.
		_type: (type, id=null) ->
			# Get the current set
			list = JSON.parse @_get(type) || "{}"
			if id
				# Indexed by ID, so just need an empty set.
				list[id] = ""
				# Restringify. Silly hashmaps being string -> string
				@_set type, JSON.stringify list
			# Return the list.
			list

		# #### _key*(entity)*
		# Return the full key type/id string for an entity, since this is the bare entity with no methods.
		_key: (entity, id) ->
			_type = entity._type
			_id = id || entity._id
			"#{_type}/#{_id}"

		# ### _sieve*(name, property, spec)*
		# Return a function to use to filter on a particular spec field. These functions implement
		# the logic described in JEFRi Core docs 5.1.1
		_sieve = (name, property, spec) ->
			# Normalize rules 2 and 3 to operator array
			if _.isNumber spec
				if spec % 1 is 0
					spec = ['=', spec]
				else
					spec = [spec, 8]

			# Rule 4, string behaves as SQL "Like"
			if _.isString spec
				spec = ['REGEX', '.*' + spec + '.*']

			# Guard against bad specs
			if not spec
				spec = ['=', undefined]

			# Spec should be an array by now, if it isn't, there's a problem.
			if not _.isArray spec
				throw { message: "Lookup specification is invalid (in LocalStore::_sieve).", name: name, property: property, spec: spec}

			# Rule 3, only floats are allowed in operator position
			if _.isNumber spec[0]
				return (entity) ->
					Math.abs(entity[name] - spec[0]) < Math.pow 2, -spec[1]

			# Rule 8, AND specs.
			if _.isArray spec[0]
				spec[i] = for s, i in spec
					_sieve name, property, spec[i]
				return (entity) ->
					for filter in spec
						if not filter entity
							return false
					return true

			# Rule 6, several valid operators.
			switch spec[0]
				when "="  then return (entity) -> entity[name] == spec[1]
				when "<=" then return (entity) -> entity[name] <= spec[1]
				when ">=" then return (entity) -> entity[name] >= spec[1]
				when "<"  then return (entity) -> entity[name] <  spec[1]
				when ">"  then return (entity) -> entity[name] >  spec[1]
				when "REGEX" then return (entity) -> ("" + entity[name]).match spec[1]
				# Rule 7, IN list
				else return (entity) ->
					while field = spec.shift
						if entity[name] is field
							return true
					return false

		_transactify = (transaction)->
			if not _(transaction.encode).isFunction!
				transaction = new JEFRi.Transaction transaction
			return transaction.encode!


	JEFRi.store 'ObjectStore', -> ObjectStore
