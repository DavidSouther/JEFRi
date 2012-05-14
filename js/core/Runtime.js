//     JEFRi Runtime.js 1.0.1
//     (c) 2011-2012 David Souther
//     JEFRi is freely distributable under the MIT license.
//     For all details and documentation:
//     http://jefri.org

// ## Underscore Utilities
_.mixin({
	// The default underscore indexOf uses a literal value; we often want to use an comparator.
	indexBy: function(list, func) {
		for (var i = 0, l = list.length; i < l; i++) {
			if (func(list[i])) return i;
		}
		return -1;
	},
	// noop
	noop: function(){},

	// ### PubSub
	// Register a function to get called when a certain event is published.
	on: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && jQuery){return jQuery(obj).on(event, callback); }

		// Use internal handler for pubsub
		if(this.isString(obj)) {callback = event; event = obj; obj = this; }

		if(this.isUndefined(obj.__event_handlers)) obj.__event_handlers = {};
		if (!(event in obj.__event_handlers)) obj.__event_handlers[event] = [];
		obj.__event_handlers[event].push(callback);
		return this;
	},
	// Register a function that will be called a single time when the event is published.
	once: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && jQuery){return jQuery(obj).one(event, callback); }

		var removeEvent = function() { _.removeEvent(obj, event); };
		callback = _.compose(removeEvent, callback);

		// Register normally
		this.on(obj, event, callback);
	},
	// Publish an event, passing args to each function registered.
	trigger: function(obj, event, args) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && jQuery){return jQuery(obj).trigger(event, callback); }

		// Use internal handler for pubsub
		if(this.isString(obj)) {callback = event; event = obj; obj = this; }

		if(this.isUndefined(obj._events)) return;
		if (event in obj.__event_handlers) {
			var events = obj.__event_handlers[event].concat();
			for (var i = 0, ii = events.length; i < ii; i++) {
				events[i].apply(obj, args === undefined ? [] : args);
			}
		}
		return this;
	},
	// Remove a certain callback from an event chain.
	off: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && jQuery){ return jQuery(obj).off(event, callback); }

		// Use internal handler for pubsub
		if(this.isString(obj)) { event = obj; obj = this; }

		if(this.isUndefined(obj.__event_handlers)) return;
		obj.__event_handlers = _.filter(obj.__event_handlers, function(cb){
			return (cb.toString() === callback.toString());// TODO Make this smarter
		});
		return this;
	}

});

// # JEFRi Namespace
var JEFRi = {
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

(function(){
	// ## Runtime Constructor

	JEFRi.Runtime = function(contextUri, options, protos) {
		// Private variables we'll be using throughout the class.
		var self = this;
		var ec = this;
		this.settings = {
			contextUri     : contextUri,
			updateOnIntern : true,
			store          : JEFRi.PostStore,
			storeURI       : ""
		};

		_.extend(this.settings, options);

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

		// ### Private helper functions
		// These handle most of the heavy lifting of building Entity classes.

		// A few default types.
		var _default = function(type){
			switch(type)
			{
				case "boolean": return false;
				case "int":
				case "float": return 0;
				case "string": return "";
				default: return "";
			}
		};

		// Takes a "raw" context object and orders it into the internal _context
		// storage.  Also builds new prototypes for the context.
		//
		// Context  Javascript object with the context
		var _set_context = function(context, protos) {
			// Save the attributes
			ec._context.attributes = context.attributes;

			// Prepare each entity
			_.each(context.entities, function(definition) {
				ec._context.entities[definition.name] = definition;
				ec._instances[definition.name] = {};
				var key = definition.key;

				//Store the properties
				var props = {};
				_.each(definition.properties, function(property) {
					props[property.name] = property;
				});
				definition.properties = props;

				// Store the relationships
				var rels = {};
				_.each(definition.relationships, function(relationship){
					//`this` is the relationship
					rels[relationship.name] = relationship;
				});
				definition.relationships = rels;

				// Build an entity's constructor.
				definition.Constructor = function(proto) {
					var self = this;
					this.__new = true;
					this.__modified = {};
					this.__fields = {};
					proto = proto || {};

					// Set a bunch of default values, so they're all available.
					_.each(props, function(property, key){
						var field = '_' + key;
						var def = proto[key] || _default(property.type);
						self[key](def);
					});

					// Set the key, if it wasn't set by the proto.
					if ( ! proto[key] ) { this[key](UUID.v4()); }

					//Add/extend our methods
					_.extend(this.prototype, proto.prototype);

					//Set a few event handlers
					_.on(this, 'persisted', _.bind(function(){
						this.__new = false;
						this.__modified = {
							_count: 0
						};
						ec._new = _.remove(ec._new, _.bind(JEFRi.EntityComparator, null, a));
						ec._modified.remove(this, JEFRi.EntityComparator);
					}, this));
				};

				//Set up the prototype for any of this entity.
				_build_prototype(definition, (protos && protos[definition.name]));
			});
		};

		// Set up all the required methods - id(), _type(), and the mutaccs.
		var _build_prototype = function(definition, proto) {
			var ec = self;

			// Get this entity's type.
			definition.Constructor.prototype._type = function() {
				return definition.name;
			};

			// Get this entity's ID.
			definition.Constructor.prototype.id = function() {
				return this[definition.key]();
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
			_.each(definition.properties, function(property) {
				_build_mutacc(definition, property);
			});

			// Prep all the navigation mutaccs.
			_.each(definition.relationships, function(relationship){
				_build_relationship(definition, relationship);
			});

			// encode passes this entity to the writer.
			//
			// Not so sure about this one any more...
			definition.Constructor.prototype.encode = function(writer) {
				var self = this;

				//Add all the properties to the writer.
				_.each(definition.properties, function(property){
					writer.add_property(self, property.name, self[property.name]);
				});

				_.each(definition.relationships, function(rel){
					//Add navigated entities to the writer.
					var others = self['get_' + rel]();
					if("has_many" == this.type) {
						_.each(others, function(){
							writer.add_entity(this);
						});
					} else {
						writer.add_entity(others);
					}
				});
			};

			if(proto) {_.extend(definition.Constructor.prototype, proto.prototype);}
		};

		// Prepare a mutacc for a specific property.
		// The property mutacc must handle entity accounting details.
		var _build_mutacc = function(definition, property) {
			var field = '_' + property.name;
			definition.Constructor.prototype[property.name] = function(value) {
				var ret = this;
				if(undefined !== value) {
				// Value is defined, so this is a setter
					if(value !== this.__fields[field]) {
					// Only actually update it if it is a new value.
						if(!this.__modified[field]) {
						// Update it if not set...
							this.__modified[field] = this.__fields[field];
							this.__modified._count += 1;
							ec._modified.set(this);
						} else {
							if(this.__modified[field] === value) {
								// Setting it back to the old value...
								delete this.__modified[field];
								this.__modified._count -= 1;
							}
							if(this.__modified._count === 0) {
								// If it was the last property, remove from the context's modified list.
								ec._modified.remove(this);
							}
						}
						this.__fields[field] = value;
						_.trigger(this, "modify", [property.name, value]);
					}
				} else {
					// Just a getter.
					ret = this.__fields[field];
				}
				return ret;
			};
		};

		// Attach the mutators and accessors (mutaccs) to the prototype.
		/* TODO Thoroughly debug these functions... */
		var _build_relationship = function(definition, relationship) {
			var ec = self;
			var field = '_' + relationship.name;

			//Build the getter
			var get = ("has_many" === relationship.type) ?
				'get_empty' : 'get_first';
			definition.Constructor.prototype['get' + field] = function(longGet) {
				if(longGet) {
					// Lazy load
/*                  var spec = {
						_type: relationship.to.type,
					};
					spec[relationship.to.property] = this[relationship.property]();
					this[field] = ec[get](spec);*/
				}
				if(undefined === this[field]) {
					// The field hasn't been set, so we haven't ever gotten this relationship before.
					// We'll need to go through and fix that.
					if ("has_many" === relationship.type) {
						// We'll need to grab everything who points to us...
						var self = this;
						this[field] = [];
						_.each(ec._instances[relationship.to.type], function(type){
							if(type[relationship.to.property]() === self[relationship.property]()) {
								// Add it
								self[field].push(this);
							}
						});
					} else {
						// Just need the one...
						this[field] = ec._instances[relationship.to.type][this[relationship.property]()];
					}
				}
				return this[field];
			};

			if("has_many" === relationship.type) {
				//Need an adder
				definition.Constructor.prototype['add' + field] =
				function(entity) {
					if(_.isArray(entity)){
						_.each(entity, _.bind(function(entity){
							this['add' + field](entity);
						}, this));
						return this;
					}

					if(undefined === this[field]) {
						//Lazy load
						var load = "get" + field;
						this[load]();
					}

					if(_.indexBy(this[field], _.bind(JEFRi.EntityComparator, null, entity)) < 0) {
						//The entity is _NOT_ in this' array.
						this[field].push(entity);

						//Call the reverse setter
						//Need to find the back relationship...
						var back_rel = ec.back_rel(this._type(), relationship);
						//Make sure it exists
						if(back_rel) {
							var back = "set_" + back_rel.name;
							entity[back](this);
						}
					}

					return this;
				};
			} else {
				//Need a setter
				definition.Constructor.prototype['set' + field] =
				function(entity) {
					var id = entity[relationship.to.property]();
					if( id !== this[relationship.property]()) {
						//Changing
						this[field] = entity;
						this[relationship.property](id);
						if( "is_a" !== relationship.type ) {
							//Add or set this to the remote entity
							//Need to find the back relationship...
							var back_rel = ec.back_rel(this._type(), relationship);
							var back = ("has_many" === back_rel.type) ?
								'add_' :
								'set_';
							back += back_rel.name;
							entity[back](this);
						}
					}

					return this;
				};
			}
		};

		// Prepare a promise for completing context loading.
		var ready = _.Deferred();
		this.ready = ready.promise();

		if(options && options.debug) {
			_set_context(options.debug.context, protos);
		} else if(!this.settings.contextUri) {

		} else {
			$.ajax({
				type    : "GET",
				url     : this.settings.contextUri,
				dataType: "text"
			}).done(
				function(data) {
					if(!data) throw {
						message: "Context loaded, but invalid."
					};
					data = JSON.parse(data);
					_set_context(data, protos);
					ready.resolve();
				}
			);
		}
	};


	// ### Runtime Prototype

	// Reset the runtime's data, maintains context definitions.
	JEFRi.Runtime.prototype.clear = function(){
		this._modified = {};
		this._new = [];
		this._instances = {};
		return this;
	};

	// Get the definition of an entity type.
	JEFRi.Runtime.prototype.definition = function(name) {
		name = (typeof name == "string") ? name : name._type();

		return this._context.entities[name];
	};

	// Find the relationship back to this entity, if it exists
	JEFRi.Runtime.prototype.back_rel = function(type, relationship) {
		var ec = this;
		var def = ec.definition(relationship.to.type);
		var back = null;
		_.each(def.relationships, function(rel){
			if(rel.to.type === type && rel.name !== relationship.name) {
				//Found it
				back = rel;
			}
		});
		return back;
	};

	// Return the canonical memory reference of the entity.
	JEFRi.Runtime.prototype.intern = function(entity, updateOnIntern) {
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
			ret = _.extend(this._instances[entity._type()][entity.id()] || {}, entity);
		} else {
			//Take the stored one if possible, otherwise use the given entity.
			ret = this._instances[entity._type()][entity.id()] || entity;
		}
		//Update the saved entity
		this._instances[entity._type()][entity.id()] = ret;
		return ret;
	};

	// Add the methods in the extend prototype to the prototype of type specified
	// affecting _ALL_ instances, both current and future, of type.
	JEFRi.Runtime.prototype.extend = function(type, extend) {
		if(this._context.entities[type]) {
			_.extend(
				this._context.entities[type].Constructor.prototype,
				extend.prototype
			);
		}
	};

	// Return a new instance of an object described in the context.
	JEFRi.Runtime.prototype.build = function(type, obj) {
		var def = this.definition(type);
		obj = obj || {};
		// We are going to build the new entity first, then, if there is a local
		// instance, we will extend the local instance with the new instance.
		var r = new this._context.entities[type].Constructor(obj);
		if(undefined !== obj[def.key]) {
			// If the entity key is specified in obj, check the local storage.
			var demi = {_type : type};
			demi[def.key] = obj[def.key];
			var instance = this.find(demi);
			if(false !== instance) {
				// Local instance, extend it with the new obj and return local.
				_.extend(instance, r);
				return instance;
			}
		}
		this._instances[type][r.id()] = r;
		this._new.push(r);
		return r;
	};

	// Expand and intern a transaction.
	JEFRi.Runtime.prototype.expand = function (transaction) {
		var self = this;
		var entities = transaction.entities;

		var ret = [];
		_.each(entities, function(entity) {
			var e = self.build(entity._type(), entity);
			e = self.intern(e, true);
			//Make the entity not new...
			_.trigger(e, 'persisted');
			ret.push(e);
		});

		transaction.entities = ret;
		return ret;
	};

	// Prepare a new transaction
	JEFRi.Runtime.prototype.transaction = function(spec) {
		spec = spec || [];

		return new JEFRi.Transaction(spec, this._store);
	};

	// Return an interned entity from the local instance matching spec.
	//
	// Spec requires an _type property and the entity key, or specify the property UUID.
	JEFRi.Runtime.prototype.find = function(spec) {
		if(typeof spec == "string") {
			spec = {_type : spec};
		}
		var to_return = [];
		var r = this.definition(spec._type);
		var results = this._instances[spec._type];
		var ret = false;

		if(spec.hasOwnProperty(r.key)) {
			// If a key is set, return only that result.
			ret = results[spec[r.key]] || false;
		} else if(spec.hasOwnProperty("UUID")) {
			// If UUID is set, return only that result
			ret = results[spec.UUID] || false;
		}

		// Add results to an array to clean up the return for the user.
		_.each(results, function(result){
			to_return.push(result);
		});

		return to_return || ret || false;
	};

	// Return a non-array of interned entities matching spec.
	//
	// If spec is an array with multiple elements, and ANY ONE matches, the
	// result array will have only the matching entities. If NONE matches, the
	// result array will have one entity per spec.
	JEFRi.Runtime.prototype.get = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		return this.get_empty(spec).then(callback);
	};

	// Pass the spec to get, and just pop the first entity.
	JEFRi.Runtime.prototype.get_first = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		var d = _.Deferred().then(callback);

		this.get(spec).then(function(data, meta){
			var _type = spec._type instanceof Function ?
				spec._type() :
				spec._type;
			d.resolve(data[_type].pop(), meta);
		});

		return d.promise();
	};

	var pushResult = function(entity){
		var type = entity._type();
		if(!this[type]) {
			this[type] = [];
		}
		this[type].push(entity);
	};

	// Return a possibly empty array of entities matching the spec.
	JEFRi.Runtime.prototype.get_empty = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		var self = this;
		var results = {};
		var transaction = this.transaction();
		var deferred = _.Deferred().done(callback);

		results.push = pushResult;

		var q = spec.length, i;
		for(i=0 ; i < q ; i++)
		{
			//Add the queries
			var _spec = spec[i],
				_type = (_spec._type instanceof Function) ?
					_spec._type() :
					_spec._type;
			var def = this.definition(_type);
			var id = _spec[def.key];

			//Check if the ID is set and exists locally
			if( (undefined !== id) && this._instances[_type][id])
			{
				//It is local, so use that one
				results.push(this._instances[_type][id]);
			}
			else
			{
				//Otherwise, add to transaction
				transaction.add(_spec);

				if(this.hasOwnProperty("_page"))
				{
					//Add the page to the meta
				//TODO: If there are multiple specs, this will not work!
				//TODO: Need to figure out what a page means for multiple specs.
				//Page format: {on : 1, lines : 10, sort:[{'Type.field':order},{'Type.field':order}]}
					transaction.addmeta({page : this._page});
					delete this._page;
				}
			}
		}

		//If transaction is not empty
		if(transaction.entities.length > 0)
		{
			//Run the transaction
			transaction.get(function(transaction){
				//Merge the result sets, adding `gotten` things to `had` things.
				_.each(transaction.entities, function(entity){
					results.push(entity);
				});
				deferred.resolve(results, transaction.meta);
			});
		}
		else
		{
			//just resolve...
			deferred.resolve(results, {});
		}
		return deferred.promise();
	};

	// Save all the new entities.
	JEFRi.Runtime.prototype.save_new = function(store) {
		var transaction = this.transaction();
		_.trigger(this, 'saving');

		//Add all new entities to the transaction
		transaction.add(this._new);

		return this._save(store, transaction);
	};

	// Save all entities with changes, including new entities.
	JEFRi.Runtime.prototype.save_all = function(callback) {
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
	};

	JEFRi.Runtime.prototype._save = function(store, transaction){
		return store.execute('persist', transaction).then(
			_.bind(this.expand, this)
		);
	};

	// Returns transaction of all entities in local cache.
	JEFRi.Runtime.prototype.get_transaction_dump = function() {
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
	};


	// ## Transactions

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
				var self = entity;
				var ent = {};
				ent._type = this._type instanceof Function ?
					entity._type() :
					entity._type;
				if(entity.__new)
				{
					//Only set if actually new.
					ent.__new = entity.__new;
				}
				var def = store.ec.definition(ent._type);
//TODO make this smarter
				_.each(def.properties, function(property){
					var value =
						self[property.name] instanceof Function ?
							self[property.name]() :
							self[property.name];
					if(value instanceof String)
					{
						value = value
							.replace(/\\n/g, "\\n")
							.replace(/\\'/g, "\\'")
							.replace(/\\"/g, '\"')
							.replace(/\\&/g, "\\&")
							.replace(/\\r/g, "\\r")
							.replace(/\\t/g, "\\t")
							.replace(/\\b/g, "\\b")
							.replace(/\\f/g, "\\f");
					}
					ent[property.name] = value;
				});
				_.each(def.relationships, function(relationship){
					if(self[relationship.name])
					{
						//Add the relationships to the get
						ent[relationship.name] = self[relationship.name];
					}
				});
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		};
	};

	// Execute the transaction as a GET request
	JEFRi.Transaction.prototype.get = function(store) {
		_.trigger(this, 'getting');
		_.one(this, 'gotten', function(e, data){d.resolve(data);});
		// return
		if( this.store ) { this.store.get(this); }

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

	// Ass several entities to the transaction
	JEFRi.Transaction.prototype.add = function(spec) {
		//Force spec to be an array
		spec = (spec instanceof Array)?spec:[spec];
		var ents = this.entities;
		_.each(spec, function(s) {
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

	// ## Persistence Stores
	// TODO move this out

	// PostStore
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
			return $.ajax({
				type    : "POST",
				url     : url,
				data    : transaction.toString(),
				dataType: "json"
			}).then(
				//Success
				function(data) {
//                  console.log("Logging success", data);
					ec.expand(data, true);//Always updateOnIntern
					_.trigger(self, 'sent', data);
					_.trigger(self, post, data);
					_.trigger(transaction, post, data);
				},
				// error
				function(data){
					console.log("Logging error", data);
				}
			);
		};

		if(this.target)
		{
			//Configured correctly, so we can safely transact.
			this.get = function(transaction) {
				var url = (this.target + "get");
				return _send(url, transaction, 'getting', 'gotten');
			};

			this.persist = function(transaction) {
				var url = (this.target + "persist");
				return _send(url, transaction, 'persisting', 'persisted');
			};
		}
		else
		{
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
}(jQuery));
