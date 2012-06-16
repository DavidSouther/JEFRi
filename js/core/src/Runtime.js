//     JEFRi Runtime.js 0.1.0
//     (c) 2011-2012 David Souther
//     JEFRi is freely distributable under the MIT license.
//     For all details and documentation:
//     http://jefri.org

(function(_){
	var root = this;

	// ## JEFRi Namespace
	root.JEFRi = {
		// Compare two entities for equality. Entities are equal if they
		// are of the same type and have equivalent IDs.
		EntityComparator: function(a, b) {
			var cmp =
				a && b &&
				a._type() === b._type() &&
				a.id() === b.id();
			return cmp;
		},
		//Duck type check if an object is an entity.
		isEntity: function(obj){
			return obj._type && obj.id &&
				_.isFunction(obj._type) && _.isFunction(obj.id);
		}
	};

	// ### Runtime Constructor
	root.JEFRi.Runtime = function(contextUri, options, protos) {
		// Private variables we'll be using throughout the class.
		var self = this;
		var ec = this;
		this.settings = _.extend({
			// The location of our context
			contextUri     : contextUri,
			// If an entity already exists, does JEFRi update or replace?
			updateOnIntern : true,
			// The constructor for the default store.
			store          : JEFRi.PostStore
		}, options);

		// Prepare a promise for completing context loading.
		var ready = _.Deferred();
		this.ready = ready.promise();

		// In-memory representation of the loaded context.
		this._context = {
			meta: {},
			contexts: {},
			entities: {}
		};
		// In-memory store of JEFRi entities.
		this._instances = {};
		// List of entities that have been built, but not persisted.
		this._new = [];
		// Collection of entities that have modifications since their inception or last persistence. Partitioned by types.
		this._modified = {};
		// The default store
		this._store = new this.settings.store(ec);

		// Some helper methods to manage modified entities.
		// Add an entity to the modified set.
		this._modified.set = function(entity){
			// Check if the type exists yet
			if(!self._modified[entity._type()]) {
				// Add the type, since we didn't have it before.
				self._modified[entity._type()] = {};
			}
			// Add the entity to the bucket.
			self._modified[entity._type()][entity.id()] = entity;
		};

		// Remove an entity from the modified set.
		this._modified.remove = function(entity) {
			delete self._modified[entity._type()][entity.id()];
		};

		// #### Private helper functions
		// These handle most of the heavy lifting of building Entity classes.

		// A few default property values.
		var _default = function(type){
			switch(type) {
				case "boolean": return false;
				case "int":
				case "float": return 0;
				case "string": return "";
				default: return "";
			}
		};

		// Takes a "raw" context object and orders it into the internal _context
		// storage.  Also builds constructors and prototypes for the context.
		var _set_context = function(context, protos) {
			// Save the attributes
			_.extend(ec._context.attributes, context.attributes);

			// Prepare each entity
			_.each(context.entities, function(definition, name) {
				// Keep the definition locally, modifying it directly with the ctor and prototypes.
				ec._context.entities[name] = definition;
				// Ready the instances bucket
				ec._instances[name] = {};

				// Build an entity's constructor.
				definition.Constructor = function(proto) {
					var self = this;

					// Set the privileged accounting and property data.
					this._new = true;
					this._modified = {};
					this._fields = {};
					this._relationships = {};
					// Check for runtime prototype override.
					proto = proto || {};

					// Set a bunch of default values, so they're all available.
					_.each(definition.properties, function(property, name){
						// Use the value provided to the constructor, or the default.
						var def = proto[name] || _default(property.type);
						self[name](def);
					});

					// Set the key, if it wasn't set by the proto.
					if ( ! proto[definition.key] ) { this[definition.key](_.UUID.v4()); }
					// Attach a privileged copy of the full id, more for debugging than use.
					this._id = this.id(true);

					// Add runtime methods
					_.extend(this.prototype, proto.prototype);

					// Set a few event handlers
					// Manage accounting after an entity has been persisted
					_.on(this, 'persisted', _.bind(function(){
						this._new = false;
						this._modified = {
							_count: 0
						};
						ec._modified.remove(this);
					}, ec._context.entities[name]));
				};

				//Set up the prototype for any of this entity.
				_build_prototype(name, definition, (protos && protos[name]));
			});

			ready.resolve();
		};

		// Set up all the required methods - id(), _type(), and the mutaccs.
		var _build_prototype = function(name, definition, proto) {
			var ec = self;

			_.extend(definition.Constructor.prototype, {
				// Get this entity's type. Use the closure'd reference.
				_type: function(full) {
					full = full || false;
					return name;
				},

				// Get this entity's ID.
				id: function(full) {
					return (full ? this._type() + "/" : "") + this[definition.key]();
				},

				// Find the status of an entity.
				_status: function() {
					var state = "MODIFIED";
					if(this._new) {
						state = "NEW";
					} else if(_.isEmpty(this._modified)) {
						state = "PERSISTED";
					}
					return state;
				},

				_definition: function() {
					return definition;
				},

				// Add this entity to the persist transaction
				_persist: function(transaction, callback) {
					var deferred = _.Deferred().then(callback);
					var top = !transaction;
					transaction = top ? new JEFRi.Transaction() : transaction;
					transaction.add(this);

					//Call the on_persist handler
					this.trigger('persisting', this, transaction);

					//If we're on top, run the transaction...
					if( top ) { transaction.persist(callback); }

					return deferred.promise();
				},

				// Encode returns the bare object.
				_encode: function() {
					var min = {};

					min._type = this._type();

					//Add all the properties to the writer.
					_.each(definition.properties, _.bind(function(prop, name){
						min[name] = this[name]();
					}, this));

					// Don't add relationships. Any walker will be responsible for adding only the entities they need.

					return min;
				}
			});

			// Alias _encode as toJSON for ES5 JSON.stringify()
			definition.Constructor.prototype.toJSON = definition.Constructor.prototype._encode;

			// Prepare property mutaccs.
			_.each(definition.properties, function(property, field) {
				_build_mutacc(definition, field, property);
			});

			// Prepare navigation mutaccs.
			_.each(definition.relationships, function(relationship, rel_name){
				_build_relationship(definition, rel_name, relationship);
			});


			if(proto) {_.extend(definition.Constructor.prototype, proto.prototype);}
		};

		// Prepare a mutacc for a specific property.
		// The property mutacc must handle entity accounting details.
		var _build_mutacc = function(definition, field, property) {
			// Each field name is its own function combining getters and setters, depending on arguments.
			definition.Constructor.prototype[field] = function(value) {
				// Overloaded getter and setter.
				if(undefined !== value) {
					// Value is defined, so this is a setter
					return this[field].set.call(this, value);
				} else {
					// Just a getter.
					return this[field].get.call(this);
				}
			};
			// Add the actual getters and setters to the new field
			_.extend(definition.Constructor.prototype[field], {
				// The setter has some accounting details to handle
				set: function(value){
					// Only actually update it if it is a new value.
					if(value !== this._fields[field]) {
						// Update it if not set...
						if(!this._modified[field]) {
							this._modified[field] = this._fields[field];
							this._modified._count += 1;
							ec._modified.set(this);
						} else {
							// It might be getting set to the old value...
							if(this._modified[field] === value) {
								delete this._modified[field];
								this._modified._count -= 1;
							}
							// If it was the last property, remove from the context's modified list.
							if(this._modified._count === 0) {
								ec._modified.remove(this);
							}
						}
						// The actual set
						this._fields[field] = value;
						// Notify observers
						_.trigger(this, "modify", [field, value]);
					}
				},
				get: function(){
					// Just a getter.
					return this._fields[field];
				}
			});
		};

		// Attach the mutators and accessors (mutaccs) to the prototype.
		/* TODO Thoroughly debug these functions... */
		var _build_relationship = function(definition, field, relationship) {
			var ec = self;

			// The relationship is the name of a function that acts as getter/setter
			definition.Constructor.prototype[field] = function(entity){
				// Use arguments, since we might have a few things coming.
				if(arguments.length > 0){
					var set = (relationship.type === "has_many") ? "add" : "set";
					return this[field][set].apply(this, arguments);
				} else {
					return this[field].get.call(this);
				}
			};

			// The multiple relations functions.
			if ("has_many" === relationship.type) {
				_.extend(definition.Constructor.prototype[field], {
					// Return the set of entities in the relationship.
					get: function(longGet) {
						// Lazy load
						if(longGet) {
							// This needs a bit of thought
							//TODO
						}
						// Check if the field has ever been set
						if(undefined === this._relationships[field]) {
							// The field hasn't been set, so we haven't ever gotten this relationship before.
							// We'll need to go through and fix that.
							// We'll need to grab everything who points to us...
							var self = this;
							this._relationships[field] = [];
							// Loop over every entity this relationship could point to
							_.each(ec._instances[relationship.to.type], function(type){
								// If these are related
								if(type[relationship.to.property]() === self[relationship.property]()) {
									// Add it
									self._relationships[field].push(this);
								}
							});
						}
						return this._relationships[field];
					},
					set: function(entity) {
						// ??
					},
					// Add an entity to the relationship.
					add: function(entity) {
						if(_.isArray(entity)){
							for(var _i=0; _i<entity.length; _i++){
								this[field].add.call(this, entity[_i]);
							}
							return this;
						}

						if(undefined === this._relationships[field]) {
							//Lazy load
							this[field].get.call(this);
						}

						if(_.indexBy(this._relationships[field], _.bind(JEFRi.EntityComparator, null, entity)) < 0) {
							//The entity is _NOT_ in this' array.
							this._relationships[field].push(entity);

							//Call the reverse setter
							//Need to find the back relationship...
							var back_rel = ec.back_rel(this._type(), field, relationship);
							//Make sure it exists
							if(back_rel) {
								entity[back_rel.name].set.call(entity, this);
							}
						}

						// Notify observers
						_.trigger(this, "modify", [field, entity]);

						return this;
					}
				});
			// Mutaccs for has_a and is_a
			} else {
				_.extend(definition.Constructor.prototype[field], {
					get: function(longGet) {
						if(longGet) {
							// Lazy load
							// This needs a bit of thought
							//TODO
						}
						if(undefined === this._relationships[field]) {
							// Just need the one...
							this._relationships[field] = ec._instances[relationship.to.type][this[relationship.property]()];
							// Make sure we found one
							if(undefined === this._relationships[field]){
								// If not, create it.
								var key = {};
								key[ec.definition(relationship.to.type).key] = this[relationship.to.property]();
								this[field](ec.build(relationship.to.type, key));
							}
						}
						return this._relationships[field];
					},
					set: function(entity) {
						var id = this[relationship.property]();
						if( id !== entity[relationship.to.property]()) {
							//Changing
							this._relationships[field] = entity;
							entity[relationship.to.property](id);
							if( "is_a" !== relationship.type ) {
								//Add or set this to the remote entity
								//Need to find the back relationship...
								var back_rel = ec.back_rel(this._type(), field, relationship);
								var back = ("has_many" === back_rel.type) ?
									'add' :
									'set';
								entity[back_rel.name][back].call(entity, this);
							}
						}

						// Notify observers
						_.trigger(this, "modify", [field, entity]);

						return this;
					}
				});
			}
		};

		if(options && options.debug) {
			// The context object was provided by the caller
			_set_context(options.debug.context, protos);
		} else if(!this.settings.contextUri) {
		} else {
			_.get(this.settings.contextUri, {
				dataType: "application/json"
			}).done(
				function(data) {
					if(!data){throw {
						message: "Context loaded, but invalid."
					};}
					data = _.isString(data) ? JSON.parse(data) : data;
					_set_context(data, protos);
				}
			);
		}
	};

	// #### Entity Array helper
	var pushResult = function(entity){
		var type = entity._type();
		if(!this[type]) {
			this[type] = [];
		}
		this[type].push(entity);
	};


	// #### Runtime Prototype
	root.JEFRi.Runtime.prototype = _.extend({}, JEFRi.Runtime.prototype, {
		// Reset the runtime's data, maintains context definitions.
		clear: function(){
			this._modified = {};
			this._new = [];
			this._instances = {};
			return this;
		},

		// Get the definition of an entity type.
		definition: function(name) {
			name = (typeof name === "string") ? name : name._type();

			return this._context.entities[name];
		},

		// Find the relationship back to this entity, if it exists
		back_rel: function(type, field, relationship) {
			var ec = this;
			var def = ec.definition(relationship.to.type);
			var back = null;
			_.each(def.relationships, function(rel, srel_name){
				if(rel.to.type === type && srel_name !== field) {
					//Found it
					back = rel;
					back.name = srel_name;
				}
			});
			return back;
		},

		// Add the methods in the extend prototype to the prototype of type specified
		// affecting _ALL_ instances, both current and future, of type.
		extend: function(type, extend) {
			if(this._context.entities[type]) {
				_.extend(
					this._context.entities[type].Constructor.prototype,
					extend.prototype
				);
			}
		},

		// Return the canonical memory reference of the entity.
		intern: function(entity, updateOnIntern) {
			updateOnIntern = !!updateOnIntern || this.settings.updateOnIntern;

			if(entity.length && ! entity._type) {
				//Array-like
				var q = entity.length, i;
				for(i = 0 ; i < q ; i++){
					entity[i] = this.intern(entity[i], updateOnIntern);
				}
				return entity;
			}

			var ret;
			if(updateOnIntern) {
				//Merge the given entity into the stored entity.
				ret = this._instances[entity._type()][entity.id()] || entity;
				_.extend(ret._fields, entity._fields);
			} else {
				//Take the stored one if possible, otherwise use the given entity.
				ret = this._instances[entity._type()][entity.id()] || entity;
			}
			//Update the saved entity
			this._instances[entity._type()][entity.id()] = ret;
			return ret;
		},

		// Return a new instance of an object described in the context.
		build: function(type, obj) {
			var def = this.definition(type);
			obj = obj || {};
			// We are going to build the new entity first, then, if there is a local
			// instance, we will extend the local instance with the new instance.
			var r = new def.Constructor(obj);
			if(undefined !== obj[def.key]) {
				// If the entity key is specified in obj, check the local storage.
				var demi = {_type : type};
				demi[def.key] = obj[def.key];
				var instance = this.find(demi);
				if(instance.length > 0) {
					// Local instance, extend it with the new obj and return local.
					instance = instance[0];
					_.extend(instance._fields, r._fields);
					return instance;
				}
			}
			this._instances[type][r.id()] = r;
			this._new.push(r);
			return r;
		},

		// Expand and intern a transaction.
		expand: function (transaction) {
			var self = this;
			var entities = transaction.entities;

			var ret = [];
			_.each(entities, function(entity) {
				var e = self.build(entity._type, entity);
				e = self.intern(e, true);
				//Make the entity not new...
				_.trigger(e, 'persisted');
				ret.push(e);
			});

			transaction.entities = ret;
			return ret;
		},

		// Prepare a new transaction
		transaction: function(spec) {
			spec = spec || [];

			return new JEFRi.Transaction(spec, this._store);
		},

		// Return an interned entity from the local instance matching spec.
		//
		// Spec requires an _type property and the entity key.
		find: function(spec) {
			if(typeof spec === "string") {
				spec = {_type : spec};
			}
			var to_return = [];
			var r = this.definition(spec._type);
			var results = this._instances[spec._type];

			if(spec.hasOwnProperty(r.key)) {
				// If a key is set, return only that result.
				if (results[spec[r.key]]) {
					to_return.push(results[spec[r.key]]);
				}
			} else {
				// Add results to an array to clean up the return for the user.
				_.each(results, function(result){
					to_return.push(result);
				});
			}

			return to_return;
		},

		// Return a non-array of interned entities matching spec.
		//
		// If spec is an array with multiple elements, and ANY ONE matches, the
		// result array will have only the matching entities. If NONE matches, the
		// result array will have one entity per spec.
		get: function(spec, callback) {
			spec = (spec instanceof Array) ? spec : [spec];
			return this.get_empty(spec).then(callback);
		},

		// Pass the spec to get, and just pop the first entity.
		get_first: function(spec, callback) {
			spec = (spec instanceof Array) ? spec : [spec];
			var d = _.Deferred().then(callback);

			this.get(spec).then(function(data, meta){
				var _type = spec._type instanceof Function ?
					spec._type() :
					spec._type;
				d.resolve(data[_type].pop(), meta);
			});

			return d.promise();
		},

		// Return a possibly empty array of entities matching the spec.
		get_empty: function(spec, callback) {
			spec = (spec instanceof Array) ? spec : [spec];
			var self = this;
			var results = {};
			var transaction = this.transaction();
			var deferred = _.Deferred().done(callback);

			results.push = pushResult;

			var q = spec.length, i;
			for(i=0 ; i < q ; i++) {
				//Add the queries
				var _spec = spec[i],
					_type = (_spec._type instanceof Function) ?
						_spec._type() :
						_spec._type;
				var def = this.definition(_type);
				var id = _spec[def.key];

				//Check if the ID is set and exists locally
				if( (undefined !== id) && this._instances[_type][id]) {
					//It is local, so use that one
					results.push(this._instances[_type][id]);
				}
				else {
					//Otherwise, add to transaction
					transaction.add(_spec);

					if(this.hasOwnProperty("_page")) {
						//Add the page to the meta
						transaction.attributes({page : this._page});
						delete this._page;
	/*
					TODO: If there are multiple specs, this will not work!
					TODO: Need to figure out what a page means for multiple specs.
					Page format: {on : 1, lines : 10, sort:[{'Type.field':order},{'Type.field':order}]}
	*/
					}
				}
			}

			// If transaction is not empty
			if(transaction.entities.length > 0) {
				// Run the transaction
				transaction.get(function(transaction){
					// Merge the result sets, adding `gotten` things to `had` things.
					_.each(transaction.entities, function(entity){
						results.push(entity);
					});
					deferred.resolve(results, transaction.attributes);
				});
			} else {
				// just resolve...
				deferred.resolve(results, {});
			}
			return deferred.promise();
		},

		// Save all the new entities.
		save_new: function(store) {
			var transaction = this.transaction();
			_.trigger(this, 'saving');

			//Add all new entities to the transaction
			transaction.add(this._new);

			return this._save(store, transaction);
		},

		// Save all entities with changes, including new entities.
		save_all: function(callback) {
			var transaction = this.transaction();
			_.trigger(this, 'saving');

			//Add all new entities to the transaction
			// Modified is keyed by type...
			_.each(this._modified, function(modified){
				// ...and each key contains an object of entity instances
				_.each(modified, function(entity) {
					entity._persist(transaction);
				});
			});

			_.each(this._new, function(neu){
				this.persist(neu);
			});

			return transaction.persist(callback);
		},

		_save: function(store, transaction){
			return store.execute('persist', transaction).then(
				_.bind(this.expand, this)
			);
		},

		// Returns transaction of all entities in local cache.
		get_transaction_dump: function() {
			var transaction = this.transaction();

			//Add all entities to the transaction
			// _instances is keyed by type...
			_.each(this._instances, function(instance){
				// ...and each key contains an object of entity instances
				_.each(instance, function(entity) {
					transaction.add(entity);
				});
			});

			return transaction;
		}
	});
}.call(this, _));
