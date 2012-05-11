Array.prototype.contains = function(value, comparator) {
	var index = -1;
	if(!comparator){return index;}
	_.each(this, function(e, i) {
		var cmp = comparator(e, value);
		if(cmp) {
			index = i;
		}
	});
	return index;
};

Array.prototype.remove = function(value, comparator) {
	var index = this.contains(value, comparator);
	if(index < 0) {return;} //Don't accidentally remove from the end.
	this.splice(index, 1);
};

// # JEFRi Namespace
var JEFRi = {};

// Compare two entities for equality. Entities are equal if they
// are of the same type and have equivalent IDs.
JEFRi.EntityComparator = function(a, b)
{
	var cmp =
		a && b &&
		a._type() === b._type() &&
		a.id() === b.id();
	return cmp;
};

var noop = function(){};

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
					$(this).bind('persisted', $.proxy(function(){
						this.__new = false;
						this.__modified = {
							_count: 0
						};
						ec._new.remove(this, JEFRi.EntityComparator);
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
				var deferred = $.Deferred().then(callback);

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

			// Bind a callback to happen on some event this entity generates.
			definition.Constructor.prototype.bind = function(event, callback) {
				var self = this;
				self.__event_handlers = self.__event_handlers || {};
				if(!self.__event_handlers.hasOwnProperty(event)) {
					self.__event_handlers[event] = [];
				}
				self.__event_handlers[event].push(callback);
			};

			// Trigger a named event on this entity.
			definition.Constructor.prototype.trigger = function(event, args) {
				var self = this;
				args = args || [];
				self.__event_handlers = self.__event_handlers || {};
				if(self.__event_handlers.hasOwnProperty(event)) {
					_.each(self.__event_handlers[event], function(handler){
						handler.apply(self, args);
					});
				}
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
						$.each(others, function(){
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
						this.trigger("modify", [property.name, value]);
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
				'get_empty'	: 'get_first';
			definition.Constructor.prototype['get' + field] = function(longGet) {
				if(longGet) {
					// Lazy load
/*					var spec = {
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

					if(this[field].contains(entity, JEFRi.EntityComparator) < 0) {
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
		var ready = $.Deferred();
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

	JEFRi.Runtime.prototype.clear = function(){
		this._modified = {};
		this._new = [];
		this._instances = {};
		return this;
	};

	// Get the definition of an entity.
	JEFRi.Runtime.prototype.definition = function(name) {
		name = (typeof name == "string") ? name : name.type;

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
			ret = this._instances[entity._type()][entity.id()] || {};
			$.extend(true, ret, entity);
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
			$.extend(
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
				$.extend(true, instance, r);
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
		$(entities).each(function() {
			var e = self.build(this._type, this);
			e = self.intern(e, true);
			//Make the entity not new...
			$(e).trigger('persisted');
			ret.push(e);
		});

		transaction.entities = ret;
		return ret;
	};

	var _store = null;

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
		$.each(results, function(){
			to_return.push(this);
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
		var d = $.Deferred().then(callback);

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

	JEFRi.Runtime.prototype.get_empty = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		var self = this;
		var results = {};
		var transaction = this.transaction();
		var deferred = $.Deferred().done(callback);

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
				$.each(transaction.entities, function(){
					results.push(this);
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
	JEFRi.Runtime.prototype.save_new = function(callback) {
		var transaction = this.transaction();
		$(this).trigger('saving');

		//Add all new entities to the transaction
		$.each(this._new, function(){
			this.persist(transaction);
		});

		return transaction.persist(callback);
	};

	// Save all entities with changes, including new entities.
	JEFRi.Runtime.prototype.save_all = function(callback) {
		var transaction = this.transaction();
		$(this).trigger('saving');

		//Add all new entities to the transaction
		$.each(this._modified, function(){
	//The _type {}s
			$.each(this, function() {
	//the entity {}s
				this.persist(transaction);
			});
		});

		$.each(this._new, function(){
			this.persist(transaction);
		});

		return transaction.persist(callback);
	};

	// Returns transaction of all entities in local cache.
	JEFRi.Runtime.prototype.get_transaction_dump = function() {
		var transaction = this.transaction();

		//Add all entities to the transaction
		$.each(this._instances, function(){
	//The _type {}s
			$.each(this, function() {
	//the entity {}s
				transaction.add(this);
			});
		});

		return transaction;
	};

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
			$.each(this.entities, function() {
				var self = this;
				var ent = {};
				ent._type = this._type instanceof Function ?
					this._type() :
					this._type;
				if(this.__new)
				{
					//Only set if actually new.
					ent.__new = this.__new;
				}
				var def = store.ec.definition(ent._type);
//TODO make this smarter
				$.each(def.properties, function(){
					var value =
						self[this.name] instanceof Function ?
							self[this.name]() :
							self[this.name];
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
					ent[this.name] = value;
				});
				$.each(def.relationships, function(){
					if(self[this.name])
					{
						//Add the relationships to the get
						ent[this.name] = self[this.name];
					}
				});
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		};
	};

	JEFRi.Transaction.prototype.get = function(callback) {
		var d = $.Deferred().then(callback);
		$(this).trigger('getting');
		$(this).one('gotten', function(e, data){d.resolve(data);});
		if( this.store ) { this.store.get(this); }
		return d.promise();
	};

	JEFRi.Transaction.prototype.persist = function(callback) {
		var d = $.Deferred().then(callback);
		$(this).trigger('persisting');
		$(this).one('persisted', function(e, data){
			$.each(this.entities, function(){
				$(this).trigger('persisted');
			});
			d.resolve(data);
		});
		if( this.store ) { this.store.persist(this); }
		return d.promise();
	};

	JEFRi.Transaction.prototype.add = function(spec) {
		//Force spec to be an array
		spec = (spec instanceof Array)?spec:[spec];
		var ents = this.entities;
		$(spec).each(function(){
			if(ents.contains(this, JEFRi.EntityComparator) < 0)
			{
				//Hasn't been added yet...
				ents.push(this);
			}
		});
		return this;
	};

	JEFRi.Transaction.prototype.attributes = function(attributes) {
		//$.extend?
		for(var attr in attributes)
		{
			this.attributes[attr] = attributes[attr];
		}
		return this;
	};

	// Persistance Stores

	// PostStore
	//
	// Handles POSTing a transaction to a remote JEFRi instance.
	JEFRi.PostStore = function(ec, options) {
		this.ec = ec;
		this.target = options && options.target;
		var self = this;

		var _send = function(url, transaction, pre, post) {
			$(transaction).trigger(pre);
			$(self).trigger(pre, transaction);
			$(self).trigger('sending', transaction);
			return $.ajax({
				type    : "POST",
				url     : url,
				data    : transaction.toString(),
				dataType: "json"
			}).then(
				//Success
				function(data) {
//					console.log("Logging success", data);
					ec.expand(data, true);//Always updateOnIntern
					$(self).trigger('sent', data);
					$(self).trigger(post, data);
					$(transaction).trigger(post, data);
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
				return $.Deferred().resolve().promise();
			};
		}

		// Always asynchronous.
		this.is_async = function(){
			return true;
		};
	};
}(jQuery));