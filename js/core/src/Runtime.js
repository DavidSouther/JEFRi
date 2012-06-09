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
			contextUri     : contextUri,
			updateOnIntern : true,
			store          : JEFRi.PostStore,
			storeURI       : ""
		}, options);

		this._context = {
			meta: {},
			contexts: {},
			entities: {}
		};
		this._instances = {};
		this._new = [];
		this._modified = {};
		this._store = new this.settings.store(ec, {target: this.settings.storeURI});

		// Some helper methods to manage modified entities.
		this._modified.set = function(entity){
			if(!self._modified[entity._type()]) {
				// Add the type, since we didn't have it before.
				self._modified[entity._type()] = {};
			}
			self._modified[entity._type()][entity.id()] = entity;
		};

		this._modified.remove = function(entity) {
			delete self._modified[entity._type()][entity.id()];
		};

		// #### Private helper functions
		// These handle most of the heavy lifting of building Entity classes.

		// A few default types.
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
			ec._context.attributes = context.attributes;

			// Prepare each entity
			_.each(context.entities, function(definition, name) {
				ec._context.entities[name] = definition;
				ec._instances[name] = {};
				var key = definition.key;

				//Store the properties
				var props = {};
				_.each(definition.properties, function(property, name) {
					props[name] = property;
				});
				definition.properties = props;

				// Store the relationships
				var rels = {};
				_.each(definition.relationships, function(relationship, name){
					//`this` is the relationship
					rels[name] = relationship;
				});
				definition.relationships = rels;

				// Build an entity's constructor.
				definition.Constructor = function(proto) {
					var self = this;
					this.__new = true;
					this.__type = name;
					this.__modified = {};
					this.__fields = {};
					this.__relationships = {};
					proto = proto || {};

					// Set a bunch of default values, so they're all available.
					_.each(props, function(property, key){
						var field = '_' + key;
						var def = proto[key] || _default(property.type);
						self[key](def);
					});

					// Set the key, if it wasn't set by the proto.
					if ( ! proto[key] ) { this[key](_.UUID.v4()); }

					//Add/extend our methods
					_.extend(this.prototype, proto.prototype);

					//Set a few event handlers
					_.on(this, 'persisted', _.bind(function(){
						this.__new = false;
						this.__modified = {
							__count: 0
						};
						//TODO remove this from the _new array.
						//ec._new = _.remove(ec._new, _.bind(JEFRi.EntityComparator, null, a));
						ec._modified.remove(this, JEFRi.EntityComparator);
					}, ec._context.entities[name]));
				};

				//Set up the prototype for any of this entity.
				_build_prototype(name, definition, (protos && protos[name]));
			});
		};

		// Set up all the required methods - id(), _type(), and the mutaccs.
		var _build_prototype = function(name, definition, proto) {
			var ec = self;

			// Get this entity's type. Use the closure'd reference.
			definition.Constructor.prototype._type = function() {
				return name;
			};

			// Get this entity's ID.
			definition.Constructor.prototype.id = function(full) {
				return (full ? this._type() + "/" : "") + this[definition.key]();
			};

			// Add this entity to the persist transaction
			definition.Constructor.prototype.persist = function(transaction, callback) {
				var deferred = _.Deferred().then(callback);

				var self = this;
				var top = !transaction;
				transaction = top ? new JEFRi.Transaction() : transaction;
				transaction.add(this);

				//Call the on_persist handler
				if(this.on_persist) { this.on_persist(transaction); }
				this.trigger('onPersist', transaction);

				//If we're on top, run the transaction...
				if( top ) { transaction.persist(callback); }

				return deferred.promise();
			};

			// Find the status of an entity.
			definition.Constructor.prototype._status = function() {
				var state = "MODIFIED";
				if(this.__new) {
					state = "NEW";
				} else if(_.isEmpty(this.__modified)) {
					state = "PERSISTED";
				}
				return state;
			};

			// Prep the property mutaccs
			_.each(definition.properties, function(property, prop_name) {
				_build_mutacc(definition, prop_name, property);
			});

			// Prep all the navigation mutaccs.
			_.each(definition.relationships, function(relationship, rel_name){
				_build_relationship(definition, rel_name, relationship);
			});

			// Encode returns the bare object.
			definition.Constructor.prototype._encode = function() {
				var self = this, min = {};

				min._type = this._type();

				//Add all the properties to the writer.
				_.each(definition.properties, function(prop, name){
					min[name] = self[name]();
				});

				return min;
			};

			definition.Constructor.prototype._definition = function() {
				return definition;
			};

			if(proto) {_.extend(definition.Constructor.prototype, proto.prototype);}
		};

		// Prepare a mutacc for a specific property.
		// The property mutacc must handle entity accounting details.
		var _build_mutacc = function(definition, prop_name, property) {
			var field = '_' + prop_name;
			definition.Constructor.prototype[prop_name] = function(value) {
				// Overloaded getter and setter.
				if(undefined !== value) {
					// Value is defined, so this is a setter
					return this[prop_name].set.call(this, value);
				} else {
					// Just a getter.
					return this[prop_name].get.call(this);
				}
			};
			_.extend(definition.Constructor.prototype[prop_name], {
				set: function(value){
					// Only actually update it if it is a new value.
					if(value !== this.__fields[field]) {
						// Update it if not set...
						if(!this.__modified[field]) {
							this.__modified[field] = this.__fields[field];
							this.__modified._count += 1;
							ec._modified.set(this);
						} else {
							// Setting it back to the old value...
							if(this.__modified[field] === value) {
								delete this.__modified[field];
								this.__modified.__count -= 1;
							}
							// If it was the last property, remove from the context's modified list.
							if(this.__modified.__count === 0) {
								ec._modified.remove(this);
							}
						}
						this.__fields[field] = value;
						_.trigger(this, "modify", [prop_name, value]);
					}
				},
				get: function(){
					// Just a getter.
					return this.__fields[field];
				}
			});
		};

		// Attach the mutators and accessors (mutaccs) to the prototype.
		/* TODO Thoroughly debug these functions... */
		var _build_relationship = function(definition, rel_name, relationship) {
			var ec = self;
			var field = '_' + rel_name;

			//Build the getter
			var get = ("has_many" === relationship.type) ?
				'get_empty' : 'get_first';

			definition.Constructor.prototype[rel_name] = function(entity){
				if(arguments.length > 0){
					var set = (relationship.type === "has_many") ? "add" : "set";
					return this[rel_name][set].call(this, entity);
				} else {
					return this[rel_name].get.call(this);
				}
			};

			if ("has_many" === relationship.type) {
				_.extend(definition.Constructor.prototype[rel_name], {
					get: function(longGet) {
						if(longGet) {
							// Lazy load
							// This needs a bit of thought
							//TODO
						}
						if(undefined === this.__relationships[field]) {
							// The field hasn't been set, so we haven't ever gotten this relationship before.
							// We'll need to go through and fix that.
							// We'll need to grab everything who points to us...
							var self = this;
							this.__relationships[field] = [];
							_.each(ec._instances[relationship.to.type], function(type){
								if(type[relationship.to.property]() === self[relationship.property]()) {
									// Add it
									self.__relationships[field].push(this);
								}
							});
						}
						return this.__relationships[field];
					},
					set: function(entity) {
						// ??
					},
					add: function(entity) {
						if(_.isArray(entity)){
							for(var _i=0; _i<entity.length; _i++){
								this[rel_name].add.call(this, entity[_i]);
							}
							return this;
						}

						if(undefined === this.__relationships[field]) {
							//Lazy load
							this[rel_name].get.call(this);
						}

						if(_.indexBy(this.__relationships[field], _.bind(JEFRi.EntityComparator, null, entity)) < 0) {
							//The entity is _NOT_ in this' array.
							this.__relationships[field].push(entity);

							//Call the reverse setter
							//Need to find the back relationship...
							var back_rel = ec.back_rel(this._type(), rel_name, relationship);
							//Make sure it exists
							if(back_rel) {
								entity[back_rel.name].set.call(entity, this);
							}
						}

						return this;
					}
				});
			// Mutaccs for has_a and is_a
			} else {
				_.extend(definition.Constructor.prototype[rel_name], {
					get: function(longGet) {
						if(longGet) {
							// Lazy load
							// This needs a bit of thought
							//TODO
						}
						if(undefined === this.__relationships[field]) {
							// Just need the one...
							this.__relationships[field] = ec._instances[relationship.to.type][this[relationship.property]()];
							// Make sure we found one
							if(undefined === this.__relationships[field]){
								// If not, create it.
								var key = {};
								key[ec.definition(relationship.to.type).key] = this[relationship.to.property]();
								this[rel_name](ec.build(relationship.to.type, key))
							}
						}
						return this.__relationships[field];
					},
					set: function(entity) {
						var id = entity[relationship.to.property]();
						if( id !== this[relationship.property]()) {
							//Changing
							this.__relationships[field] = entity;
							this[relationship.property](id);
							if( "is_a" !== relationship.type ) {
								//Add or set this to the remote entity
								//Need to find the back relationship...
								var back_rel = ec.back_rel(this._type(), rel_name, relationship);
								var back = ("has_many" === back_rel.type) ?
									'add' :
									'set';
								entity[back_rel.name][back].call(entity, this);
							}
						}
						return this;
					}
				});
			}
		};

		// Prepare a promise for completing context loading.
		var ready = _.Deferred();
		this.ready = ready.promise();

		if(options && options.debug) {
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
					ready.resolve();
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
		back_rel: function(type, rel_name, relationship) {
			var ec = this;
			var def = ec.definition(relationship.to.type);
			var back = null;
			_.each(def.relationships, function(rel, srel_name){
				if(rel.to.type === type && srel_name !== rel_name) {
					//Found it
					back = rel;
					back.name = srel_name;
				}
			});
			return back;
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
				_.extend(ret.__fields, entity.__fields);
			} else {
				//Take the stored one if possible, otherwise use the given entity.
				ret = this._instances[entity._type()][entity.id()] || entity;
			}
			//Update the saved entity
			this._instances[entity._type()][entity.id()] = ret;
			return ret;
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
				if(false !== instance) {
					// Local instance, extend it with the new obj and return local.
					instance = instance[0];
					_.extend(instance.__fields, r.__fields);
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
			var ret = false;

			if(spec.hasOwnProperty(r.key)) {
				// If a key is set, return only that result.
				ret = results[spec[r.key]] || false;
			}

			// Add results to an array to clean up the return for the user.
			_.each(results, function(result){
				to_return.push(result);
			});

			return to_return || ret || false;
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
					entity.persist(transaction);
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

	// ### Transactions

	// Object to handle transactions.
	JEFRi.Transaction = function(spec, store) {
		this.attributes = {};
		this.store = store;
		this.entities = (spec instanceof Array)?spec:[spec];

		this.toString = function() {
			var store = this.store;
			var transaction = {};
			transaction.attributes = this.attributes;
			transaction.entities = [];
			_.each(this.entities, function(entity) {
				// var self = entity;
				var ent = entity._encode();
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		};
	};

	// Execute the transaction as a GET request
	JEFRi.Transaction.prototype.get = function(store) {
		var d = new _.Deffered();
		_.trigger(this, 'getting');
		_.one(this, 'gotten', function(e, data){d.resolve(data);});
		// return
		if( this.store ) { this.store.get(this); }
		return d.promise();
	};

	// Execute the transaction as a POST request
	JEFRi.Transaction.prototype.persist = function(callback) {
		var d = _.Deferred().then(callback);
		_.trigger(this, 'persisting');
		_.trigger(this, 'persisted', function(e, data){
			_.each(e.entities, function(ent){
				_.trigger(ent, 'persisted');
			});
			d.resolve(data);
		});
		if( this.store ) { this.store.persist(this); }
		return d.promise();
	};

	// Add several entities to the transaction
	JEFRi.Transaction.prototype.add = function(spec) {
		//Force spec to be an array
		spec = (spec instanceof Array)?spec:[spec];
		var ents = this.entities;
		_.each(spec, function(s) {
			// TODO switch to direct lookup.
			if(_.indexBy(ents, _.bind(JEFRi.EntityComparator, s)) < 0) {
				//Hasn't been added yet...
				ents.push(s);
			}
		});
		return this;
	};

	// Set several attributes on the transaction
	JEFRi.Transaction.prototype.attributes = function(attributes) {
		_.extend(this.attributes, attributes);
		return this;
	};

	// ### Persistence Stores
	// TODO move this out

	// #### PostStore
	//
	// Handles POSTing a transaction to a remote JEFRi instance.
	JEFRi.PostStore = function(ec, options) {
		this.ec = ec;
		this.target = options && options.target;
		var self = this;

		var _send = function(url, transaction, pre, post) {
			_.trigger(transaction, pre);
			_.trigger(self, pre, transaction);
			_.trigger(self, 'sending', transaction);
			return _.post(url, {
				data    : transaction.toString(),
				dataType: "application/json"
			}).done(
				function(data) {
					//Always updateOnIntern
					ec.expand(data, true);
					_.trigger(self, 'sent', data);
					_.trigger(self, post, data);
					_.trigger(transaction, post, data);
				}
			);
		};

		if(this.target) {
			//Configured correctly, so we can safely transact.
			this.get = function(transaction) {
				var url = (this.target + "get");
				return _send(url, transaction, 'getting', 'gotten');
			};

			this.persist = function(transaction) {
				var url = (this.target + "persist");
				return _send(url, transaction, 'persisting', 'persisted');
			};
		} else {
			//No backing data store, so do nothing.
			this.get = this.persist = function(transaction) {
				return _.Deferred().resolve().promise();
			};
		}

		// Always asynchronous.
		this.is_async = function(){
			return true;
		};
	};
}.call(this, _));
