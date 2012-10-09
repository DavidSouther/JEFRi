#   JEFRi Runtime.js 0.1.0
#   (c) 2011-2012 David Souther
#   JEFRi is freely distributable under the MIT license.
#   For all details and documentation:
#   http://jefri.org

	root = @

	# ## JEFRi Namespace
	root.JEFRi =
		# Compare two entities for equality. Entities are equal if they
		# are of the same type and have equivalent IDs.
		EntityComparator: (a, b) -->
			cmp =
				a && b &&
				a._type! is b._type! &&
				a.id! is b.id!
			return cmp

		#Duck type check if an object is an entity.
		isEntity: (obj) ->
			return obj._type && obj.id &&
				_.isFunction obj._type && _.isFunction obj.id

	# Add isEntity to the underscore function.
	_.mixin isEntity: JEFRi.isEntity

	# ### Runtime Constructor
	root.JEFRi.Runtime = (contextUri, options, protos) ->
		# The ec reference for entity prototypes
		ec = @

		# Prepare a promise for completing context loading.
		ready = _.Deferred!

		# Fill in all the privileged properties
		settings =
				# The location of our context
				contextUri: contextUri,
				# If an entity already exists, does JEFRi update or replace?
				updateOnIntern: true,
				# The constructor for the default store.
				store: JEFRi.LocalStore
		settings <<<< options

		@ <<<<
			settings: settings

			ready: ready.promise!

			# In-memory representation of the loaded context.
			_context:
				meta: {}
				contexts: {}
				entities: {}
				attributes: {}

			# In-memory store of JEFRi entities.
			_instances: {}

			# List of entities that have been built, but not persisted.
			_new: []

			# Collection of entities that have modifications since their inception or last persistence. Partitioned by types.
			_modified:
				# Some helper methods to manage modified entities.
				# Add an entity to the modified set.
				set: !(entity) ~>
					# Check if the type exists yet
					if not @_modified[entity._type!]
						# Add the type, since we didn't have it before.
						@_modified[entity._type!] = {}

					# Add the entity to the bucket.
					@_modified[entity._type!][entity.id!] = entity

				# Remove an entity from the modified set.
				remove: !(entity) ~>
					id = entity.id!
					type = @_modified[entity._type!]
					type[id] = null
					delete type[id]

		# Build the default store
		@_store = new @settings.store {runtime: @}

		# #### Private helper functions
		# These handle most of the heavy lifting of building Entity classes.

		# A few default property values.
		_default = (type) ->
			switch type
				when \boolean then false
				when \int or \float then 0
				when \string then ""
				else ""

		# Takes a "raw" context object and orders it into the internal _context
		# storage. Also builds constructors and prototypes for the context.
		_set_context = (context, protos) ~>
			# Save the attributes
			@_context.attributes <<< (context.attributes || {})

			# Prepare each entity. Uses _.each to put (definition, type) in a closure.
			# _.each context.entities, (definition, type) ~> # NO SERIOUSLY, definition MUST BE IN A CLOSURE!
			for type, definition of context.entities
				_build_constructor definition, type

			ready.resolve!

		_build_constructor = (definition, type) ~>
			# Keep the definition locally, modifying it directly with the ctor and prototypes.
			@_context.entities[type] = definition
			# Ready the instances bucket
			@_instances[type] = {}

			# Build an entity's constructor.
			definition.Constructor = (proto) ->
				# Set the privileged accounting and property data.
				@ <<<
					_new: true
					_modified: {_count: 0}
					_fields: {}
					_relationships: {}

				# Check for runtime prototype override.
				proto = proto || {}

				# Set the key generate if not set by proto.
				proto[definition.key] = proto[definition.key] || _.UUID.v4!

				# Set a bunch of default values, so they're all available.
				for name, property of definition.properties
					# Use the value provided to the constructor, or the default.
					def = proto[name] || _default(property.type)
					@[name](def)

				# Attach a privileged copy of the full id, more for debugging than use.
				@_id = @id true

				# Add runtime methods
				@:: <<< proto::

				# Set a few event handlers
				# Manage accounting after an entity has been persisted
				@persisted :> ->
					@ <<<
						_new: false
						_modified:
							_count: 0
					ec._modified.remove(@)
				return @

			#Set up the prototype for any of this entity.
			_build_prototype(type, definition, (protos && protos[type]))

		# Set up all the required methods - id!, _type!, and the mutaccs.
		_build_prototype = !(type, definition, proto) ~>
			definition.Constructor:: <<<
				# Get this entity's type. Use the closure'd reference.
				_type: (full) ->
					full = full || false
					type

				# Get this entity's ID.
				id: (full) ->
					(if full then "#{@_type!}/" else "") + @[definition.key]!

				# Find the status of an entity.
				_status: ->
					state = \MODIFIED
					if @_new
						state = \NEW
					else if _.isEmpty @_modified
						state = \PERSISTED
					state

				_definition: -> definition

				# Add this entity to the persist transaction
				_persist: (transaction, callback) ->
					deferred = _.Deferred!.then(callback)
					top = !transaction
					transaction = if top then new JEFRi.Transaction! else transaction
					transaction.add(@)

					#Call the on_persist handler
					@persisting <: transaction

					#If we're on top, run the transaction...
					if top then transaction.persist(callback)

					deferred.promise!

				# Encode returns the bare object.
				_encode: ->
					min = {_type: @_type!}

					#Add all the properties to the writer.
					for prop of definition.properties
						min[prop] = @[prop]!

					# Don't add relationships. Any walker will be responsible for adding only the entities they need.
					min

				# Delete this entity.
				# Remove it from all relationships, invalidate the ID.
				_destroy: _.lock !->
					for rel_name, relationship of definition.relationships
						if relationship.type is \has_many
							@[rel_name].remove
						@[rel_name] null
					ec.destroy @
					@[definition.key] 0


			# Alias _encode as toJSON for ES5 JSON.stringify!
			definition.Constructor::toJSON = definition.Constructor::_encode

			# Prepare property mutators and accsessors.
			for field, property of definition.properties
				_build_mutacc definition, field, property

			# Prepare navigation mutaccs.
			for rel_name, relationship of definition.relationships
				_build_relationship definition, rel_name, relationship

			for method, func of definition.methods
				_build_method definition, method, func

			# Add any additional prototypes functions
			if (proto) then definition.Constructor:: <<< proto::

		# Prepare a mutacc for a specific property.
		# The property mutacc must handle entity accounting details.
		_build_mutacc = !(definition, field, property) ~>
			# Each field name is its own function combining getters and setters, depending on arguments.
			definition.Constructor::[field] = (value) ->
				# Overloaded getter and setter.
				if &.length > 0
					# Value is defined, so this is a setter
					@[field].set.call(@, value)
				else
					# Just a getter.
					@[field].get.call(@)

			# Add the actual getters and setters to the new field
			definition.Constructor::[field] <<<
				# The setter has some accounting details to handle
				set: (value) ->
					# Only actually update it if it is a new value.
					if (value isnt @_fields[field])
						# The actual set
						@_fields[field] = value

						# Update the modified list if not set...
						if (!@_modified[field])
							@_modified[field] = @_fields[field]
							@_modified._count += 1
							ec._modified.set(@)
						else
							# It might be getting set to the old value...
							if (@_modified[field] is value)
								delete @_modified[field]
								@_modified._count -= 1
							# If it was the last property, remove from the context's modified list.
							if (@_modified._count is 0)
								ec._modified.remove(@)

						# Notify observers
						@modify <: [field, value]

				get: ->
					# Just a getter.
					return @_fields[field]

		# Attach the mutators and accessors (mutaccs) to the prototype.
		#/* TODO Thoroughly debug these functions... */
		_build_relationship = !(definition, field, relationship) ->
			# The relationship is the name of a function that acts as getter/setter
			definition.Constructor::[field] = (entity) ->
				# Use arguments, since we might have a few things coming.
				if &.length > 0
					if &0 is null
						return @[field].remove.call @, &0
					if relationship.type is \has_many
						return @[field].add.apply(@, _.flatten &)
					else
						return @[field].set.call @, &0
				else
					return @[field].get.call @

			# The multiple relations functions.
			if \has_many is relationship.type
				definition.Constructor::[field] <<<
					# Return the set of entities in the relationship.
					get: ->
						# Check if the field has ever been set
						if !(field of @_relationships)
							# The field hasn't been set, so we haven't ever gotten this relationship before.
							# We'll need to go through and fix that.
							# We'll need to grab everything who points to us...
							@_relationships[field] = []
							# Loop over every entity this relationship could point to
							for type in ec._instances[relationship.to.type]
								# If these are related
								if (type[relationship.to.property]! is @[relationship.property]!)
									# Add it
									@_relationships[field].push type
						@_relationships[field]

					# Add an entity to the relationship.
					add: (...) ->
						if !(field of @_relationships)
							#Lazy load
							@[field].get.call @

						for entity in &
							if _(@_relationships[field]).indexBy(_.bind(JEFRi.EntityComparator, null, entity)) < 0
								#There is not a local reference to the found entity.
								@_relationships[field].push entity

								#Call the reverse setter
								#	Need to find the back relationship...
								back_rel = ec.back_rel(@_type!, field, relationship)
								#	Make sure it exists
								if back_rel then entity[back_rel.name].set.call(entity, @)

						# Notify observers
						@modify <: [field, &]
						@

					remove: (related)->
						t = _ @_relationships[field] .indexBy JEFRi.EntityComparator related
						if (t > -1) then @_relationships[field][t to t] = []
						@

			# Mutaccs for has_a and is_a
			else
				definition.Constructor::[field] <<<
					set: _.lock (related) ->
						@_relationships[field] = related
						resolve_ids.call @, related
						if \is_a isnt relationship.type
							back_rel = ec.back_rel @_type!, field, relationship
							related[back_rel.name] @
						# Notify observers
						@modify <: [field, related]
						@

					remove: _.lock ->
						if \is_a isnt relationship.type
							back_rel = ec.back_rel @_type!, field, relationship
							if \has_a is relationship.type
								@_relationships[field][back_rel.name].remove.call @_relationships[field], @
							else
								@_relationships[field][back_rel.name] null
						@_relationships[field] = null
						@[relationship.property] undefined
						@

					get: ->
						if @_relationships[field] is undefined
							# Just need the one...
							@_relationships[field] = ec._instances[relationship.to.type][@[relationship.property]!]
							# Make sure we found one
							if @_relationships[field] is undefined
								# If not, create it.
								key = "#{relationship.to.property}": @[relationship.property]!
								@[field](ec.build(relationship.to.type, key))

						return @_relationships[field]

			# Helper for has_a::set
			resolve_ids = !(related) ->
				# If @'s key is relprop, use it for related
				if definition.key is relationship.property # Always use this' ID if we can
					related[relationship.to.property] @[relationship.property]!
				else if related._definition!key is relationship.to.property # Back-up ID
					@[relationship.property] related[relationship.to.property]!
				else # No IDs. If one is set, set the other to that
					if @[relationship.property]!match _.UUID.rvalid
						related[relationship.to.property] @[relationship.property]!
					else if related[relationship.to.property]!match _.UUID.rvalid
						@[relationship.property] related[relationship.to.property]!
					else #Nothing is set, use this' id
						id = _.UUID.v4!
						@[relationship.property] id
						related[relationship.to.property] id

		_build_method = ! (definition, method, func) ->
			body = func.@definitions.javascript || ""
			params = func.@@order
			if body && ! body.match /window/
				params.push body
				fn = Function.apply null, params
			else
				fn = _.noop
			definition.Constructor::[method] = fn

		@load = (contextUri) ->
			_.get contextUri, {dataType: \application/json}
			.done (data) ->
				if (!data) then throw { message: "Context loaded, but invalid." }
				data = if _.isString(data) then JSON.parse(data) else data
				_set_context(data, protos)

		# Prepare the runtime with the given contexts.
		if (options && options.debug)
			# The context object was provided by the caller
			_set_context(options.debug.context, protos)
		else if @settings.contextUri?
			@load @settings.contextUri
		@

	# #### Entity Array helper
	pushResult = (entity) ->
		type = entity._type!
		if (!@[type]) then @[type] = []
		@[type].push(entity)

	# #### Runtime Prototype
	root.JEFRi.Runtime:: <<< JEFRi.Runtime::

	root.JEFRi.Runtime:: <<<
		# Reset the runtime's data, maintains context definitions.
		clear: ->
			@_modified = {}
			@_new = []
			@_instances = {}
			@

		# Get the definition of an entity type.
		definition: (name) ->
			name = name._type?! || name
			@_context.entities[name]

		# Find the relationship back to this entity, if it exists
		back_rel: (type, field, relationship) ->
			ec = @
			def = ec.definition(relationship.to.type)
			back = null
			for srel_name, rel of def.relationships
				if (rel.to.type is type && srel_name isnt field)
					#Found it
					back = rel
					back.name = srel_name
			back

		# Add the methods in the extend prototype to the prototype of type specified
		# affecting _ALL_ instances, both current and future, of type.
		extend: (type, extend) ->
			if (@_context.entities[type])
				@_context.entities[type].Constructor:: <<< extend::

		# Return the canonical memory reference of the entity.
		intern: (entity, updateOnIntern) ->
			updateOnIntern = !!updateOnIntern || @settings.updateOnIntern

			if (entity.length && ! entity._type)
				#Array-like
				entities = for ent in entity
					@intern(ent, updateOnIntern)
				return entities

			if (updateOnIntern)
				#Merge the given entity into the stored entity.
				ret = @_instances[entity._type!][entity.id!] || entity
				ret._fields <<< entity._fields
			else
				#Take the stored one if possible, otherwise use the given entity.
				ret = @_instances[entity._type!][entity.id!] || entity

			#Update the saved entity
			@_instances[entity._type!][entity.id!] = ret
			ret

		# Return a new instance of an object described in the context.
		build: (type, obj) ->
			def = @definition(type)
			if !def
				throw "JEFRi::Runtime::build '#{type}' is not a defined type in this context."
			obj = obj || {}
			# We are going to build the new entity first, then, if there is a local
			# instance, we will extend the local instance with the new instance.
			r = new def.Constructor obj
			if def.key of obj
				# If the entity key is specified in obj, check the local storage.
				demi = {_type : type}
				demi[def.key] = obj[def.key]
				instance = @find(demi)
				if (instance.length > 0)
					# Local instance, extend it with the new obj and return local.
					instance = instance[0]
					instance._fields <<< r._fields
					return instance
			@_instances[type][r.id!] = r
			@_new.push(r)
			return r

		# Expand and intern a transaction.
		expand: (transaction, action) ->
			action = action || "persisted"

			built = []
			for entity in transaction.entities || []
				e = @build(entity._type, entity)
				e = @intern(e, true)
				#Make the entity not new...
				e[action] <: true
				built.push(e)

			transaction.entities = built

		# Completely remove an entity from this runtime
		destroy: (entity)->
			@_modified.remove entity
			delete @_instances[entity._type!][entity.id!]
			t = _ @_new .indexBy JEFRi.EntityComparator entity
			if (t > -1) then @_new[t to t] = []
			@

		# Prepare a new transaction
		transaction: (spec) ->
			spec = spec || []
			return new JEFRi.Transaction(spec, @_store)

		# Return an interned entity from the local instance matching spec.
		#
		# Spec requires an _type property and the entity key.
		find: (spec) ->
			if (typeof spec is "string")
				spec = {_type : spec}
			to_return = []
			r = @definition(spec._type)
			results = @_instances[spec._type]

			if (spec.hasOwnProperty(r.key))
				# If a key is set, return only that result.
				if (results[spec[r.key]])
					to_return.push(results[spec[r.key]])
			else
				# Add results to an array to clean up the return for the user.
				for key, result of results
					to_return.push result

			return to_return

		# Return a non-array of interned entities matching spec.
		#
		# If spec is an array with multiple elements, and ANY ONE matches, the
		# result array will have only the matching entities. If NONE matches, the
		# result array will have one entity per spec.
		get: (spec) ->
			spec = if _.isArray(spec) then spec else [spec]
			results = {}
			transaction = @transaction!
			deferred = _.Deferred!

			results.push = pushResult

			for _spec in spec
				#Add the queries
				_type = if (_spec._type instanceof Function) then _spec._type! else _spec._type
				def = @definition(_type)
				id = _spec[def.key]

				#Check if the ID is set and exists locally
				if ( id? && @_instances[_type][id])
					#It is local, so use that one
					results.push(@_instances[_type][id])
				else
					#Otherwise, add to transaction
					transaction.add(_spec)

			# If transaction is not empty
			if (transaction.entities.length > 0)
				# Run the transaction
				transaction.get!.done (transaction) ->
					# Merge the result sets, adding `gotten` things to `had` things.
					for entity in transaction.entities
						results.push entity
					deferred.resolve(results, transaction.attributes)
			else
				# just resolve...
				deferred.resolve(results, {})

			return deferred.promise!

		# Pass the spec to get, and just pop the first entity.
		get_first: (spec) ->
			spec = (spec instanceof Array) ? spec : [spec]
			d = _.Deferred!

			@get(spec).then (data, meta) ->
				_type = if spec._type instanceof Function then spec._type! else spec._type
				d.resolve(data[_type].pop!, meta)

			return d.promise!

		# Save all the new entities.
		save_new: (store) ->
			transaction = @transaction!
			@saving <: {}

			#Add all new entities to the transaction
			transaction.add(@_new)

			return @_save(transaction, store)

		# Save all entities with changes, including new entities.
		save_all: (store) ->
			transaction = @transaction!
			@saving <: {}

			#Add all new entities to the transaction
			# Modified is keyed by type...
			for t, modified of @_modified
				# ...and each key contains an object of entity instances
				for k, entity of modified
					entity._persist(transaction)

			for neu in @_new
				@persist neu

			@_save transaction, store

		_save: (transaction, store) ->
			store = store || @_store
			return store.execute('persist', transaction).then _.bind(@expand, @)
