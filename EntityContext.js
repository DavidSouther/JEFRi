;
//TODO move this to a separate file, and make it a class that can handle itself
//as either strings or (preferably) ints.
//Document.UUID = function()
UUID = function()
/**
 * A function to return a v4 (random) UUID.
 */
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

Array.prototype.contains = function(value, comparator)
/**
 * A method to see if the array contains some value, given a certain comparator
 * function. The comparator should take two parameters and return true if they
 * are equal, false otherwise. No greater/less ints.
 * Oh, it has O(n) runtime complexity, so don't use it on big arrays.
 */
{
	var index = -1;
	if(!comparator){return index;}
	$.each(this, function(i) {
		var cmp = comparator(this, value);
		if(cmp)
		{	//Found, yay!
			index = i;
		}
	});
	return index;
};

Array.prototype.remove = function(value, comparator)
/**
 * Enhanced remove method. Along with the contains method, makes the array
 * behave more like a proper, dynamic set.
 */
{
	var index = this.contains(value, comparator);
	if(index < 0) return; //Don't accidentally remove from the end.
	this.splice(index, 1);
};

var JEFRi = {};

JEFRi.EntityComparator = function(a, b)
/**
 * Comparator for the contains method. Verifies that entites are the same type
 * and have the same ID.
 */
{
	var cmp = 
		a && b &&
		a._type() === b._type() &&
		a.id() === b.id();
	return cmp;
};

(function($){
	//Move to document? Could be useful as a global... but would need docs
	var noop = function()
	/** 
	 * Shorthand for when you need a noop callback.
	 */
	{
	};

	JEFRi.EntityContext = function(contextUri, options, protos)
	/*
	 * EntityContext Constructor.
	 */
	{
		if(!this instanceof JEFRi.EntityContext)
		{	// `new` Guard
			return new JEFRi.EntityContext(contextUri, options, protos);
		}

		var self = this;
		var ec = this;
		this.settings = {
			contextUri: contextUri,
			updateOnIntern : true
		};

		$.extend(this.settings, options);

		/**
		 * The underlying description of this Entity Context.
		 */
		this._context = {
			meta: {},	// Meta description for the context
			contexts: {},	// Dependent contexts
			entities: {}	// Entity descriptions
		};
		this._instances = {};

		/**
		 * A quick way to get to entities built by this context, but not yet
		 * persisted to some store.
		 */
		this._new = [];

		/**
		 * The context modified object is a quick way to keep track of what
		 * entities need to have their changes persisted. While each entity
		 * is responsible for tracking what properties have been changed, the
		 * context has a collection of which objects those are.
		 */
		this._modified = {};
		this._modified.set = function(entity) {
			if(!self._modified[entity._type()])
			{	//Add the type...
				self._modified[entity._type()] = {};
			}
			delete self._modified[entity._type()][entity.id()];
		}
		this._modified.remove = function(entity) {
			self._modified[entity._type()][entity.id()]
		};

		var _set_context = function(context, protos)
		/**
		 * Takes a "raw" context object and orders it into the internal _context
		 * storage.  Also builds new prototypes for the context.
		 *
		 * Visibility: Private
		 *
		 * Params:
		 * context	Javascript object with the context
		 * protos	Prototypes for the expanded objects.
		 */
		{
			ec._context.meta = context.meta;

			$(context.entities).each(function(){
				// `this` is the entity definition
				ec._context.entities[this.name] = this;
				ec._instances[this.name] = {};
				var key = this.key;

				var props = {};
				$(this.properties).each(function() {
					// `this` is the property
					props[this.name] = this;
				});
				//Overwrite the JSON index with the named indices
				this.properties = props;

				var rels = {};
				$(this.relationships).each(function(){
					//`this` is the relationship
					rels[this.name] = this;
				});
				//Overwrite the JSON index with the named indecies
				this.relationships = rels;

				this.Constructor = function(proto)
				/**
				 * Constructor for a particular entity.
				 *
				 * Params:
				 * proto	Object to extend into the instantiated entity.
				 */
				{
					var self = this;
					this.__new = true;
					this.__modified = {};
					proto = proto || {};

					/**
					 * Set a bunch of default values, so they're all available.
					 */
					$.each(props, function(key){
						var field = '_' + key;
//TODO investigate why this causes mobile browsers to die.
// This statement causes an error in Android browers...
// Specifially, this.attributes.default seems to be the cause.
// var def = proto[key] || this.attributes.default || _default(this._type);
// 2011-07-26 DS: Do we have a test case that shows this yet?
						var def = proto[key] || _default(this._type);
						self[key](def);
					})

					/**
					 * Set the key, if it wasn't set by the proto.
					 */
					proto[key] || this[key](UUID());

					// Add/extend our methods
					$.extend(this.prototype, proto.prototype);

					//Set a few event handlers
					$(this).bind('persisted', $.proxy(function(){
						this.__new = false;
						this.__modified = {};
						ec._new.remove(this, JEFRi.EntityComparator);
						ec._modified.remove(this, JEFRi.EntityComparator);
					}, this));
				};

				_build_prototype(this, (protos && protos[this.name]));
			});
		};

		var _build_prototype = function(definition, proto)
		/**
		 * Set up all the required methods - id(), _type(), and the mutaccs.
		 */
		{
			var ec = self;
			definition.Constructor.prototype._type = function() {
				return definition.name;
			}
			definition.Constructor.prototype.id = function() {
				return this[definition.key]();
			}

			definition.Constructor.prototype.persist = function(transaction,
			                                                         callback) {
				var self = this;
				var top = !transaction;
				transaction = top ? new JEFRi.Transaction() : transaction;
				transaction.add(this);

				this.on_persist && this.on_persist(transaction);

				//If we're on top, run the transaction...
				top && transaction.persist(callback);
			};

			definition.Constructor.prototype._status = function()
			/**
			 * Return a string enumeration of the entity's persistance status.
			 * Returns one of NEW, MODIFIED, or PERSISTED. NEW implies modified.
			 * Modified is only returned if the object has been persisted, and
			 * then a property was changed. PERSISTED is returned if it is not
			 * new or modified. Note that it is acceptable to return PERSISTED
			 * for an entity that will never be persisted, because it is
			 * transient for some reason. In that case, this function should be
			 * overwritten.
			 */
			{
				if(this.__new)
				{
					return "NEW";
				}
				else if($.isEmptyObject(this.__modified))
				{
					return "MODIFIED";
				}
				else
				{
					return "PERSISTED";
				}
			};

			/**
			 * Prep the property mutaccs
			 */
			$.each(definition.properties, function() {
				_build_mutacc(definition, this);
			});

			/**
			 * Prep all the navigation mutaccs.
			 */
			$.each(definition.relationships, function(){
				// `this` is the relationship
				_build_relationship(definition, this);
			});

			definition.Constructor.prototype.encode = function(writer)
			/**
			 * encode passes this entity to the writer.
			 *
			 * Not so sure about this one any more...
			 */
			{
				var self = this;
				$.each(definition.properties, function(){
					//Add all the properties to the writer.
					writer.add_property(self, this.name, self[this.name]);
				});
				$.each(definition.relationships, function(rel){
					//Add navigated entities to the writer.
					var others = self['get_' + rel]();
					if("has_many" == this.type)
					{
						$.each(others, function(){
							writer.add_entity(this);
						});
					}
					else
					{
						writer.add_entity(others);
					}
				});
			};

			proto && $.extend(definition.Constructor.prototype,proto.prototype);
		};

		var _build_mutacc = function(definition, property)
		/**
		 * Prepare all the mutators and accessors for properties.
		 */
		{
			var field = '_' + property.name;
			definition.Constructor.prototype[property.name] = function(value)
			/**
			 * Getter or setter for a property. If passed a value, presumed to
			 * be a setter. Otherwise, returns the current value.
			 */
			{
				if(!(undefined === value))
				{	//Value is defined, so this is a setter
					if(!this.__modified[field])
					{	//Update the modified arrays if this wasn't already set
						this.__modified[field] = this[field];
						ec._modified.set(this);
					}
					else
					{	// Check if we're resetting the value
						if(this.__modified[field] === value)
						{	//Setting it back to the old value...
							delete this.__modified[field];
						}
						//TODO check if that was the last property
					}

					this[field] = value;
					return this;
				}
				else
				{	// Just a getter. The ctor should have set defaults.
					return this[field];
				}
			}
		};

		 //TODO Thuroughly debug these functions...
		var _build_relationship = function(definition, relationship)
		/**
		 * Attach the relationship mutators and accessors to the prototype.
		 */
		{
			var ec = self;
			var field = '_' + relationship.name;

			//Build the getter
			var get = ("has_many" === relationship.type)
				? 'get_empty'
				: 'get_first';
			definition.Constructor.prototype['get' + field] = function(longGet)
			/**
			 * Relationship accessor for an entity. Navigates any relationships
			 * and pulls data as necessary.
			 */
			{
				if(longGet)
				{	//Lazy load
//					var spec = {
//						_type: relationship.to.type,
//					};
//					spec[relationship.to.property] = this[relationship.from.property]();
//					this[field] = ec[get](spec);
				}
				if(undefined === this[field])
				{	//Need to go ahead and get it from memory
					if ("has_many" === relationship.type)
					{	//We'll need to grab everything who points to us...
						var self = this;
						this[field] = [];
						$.each(ec._instances[relationship.to.type], function(){
							if(this[relationship.to.property]() === 
							                 self[relationship.from.property]())
							{	//Add it
								self[field].push(this);
							}
						});
					}
					else
					{	//Just need the one...
						this[field] = ec._instances[relationship.to.type]
						                   [this[relationship.from.property]()];
					}
				}
				return this[field];
			};

			if("has_many" === relationship.type)
			{	//Need an adder
				definition.Constructor.prototype['add' + field] = function(entity)
				/**
				 * Adding to the array of things we have. Loading if needed.
				 */
				{
					if(undefined == this[field])
					{	// Lazy load
						var load = "get" + field;
						this[load]();
					}

					if(this[field].contains(entity, JEFRi.EntityComparator) < 0)
					{	// The entity is _NOT_ in this' array.
						this[field].push(entity);

						// Need to find the back relationship...
						var back_rel = ec.back_rel(this._type(), relationship);
						var back = "set_" + back_rel.name;
						// ... to call the reverse setter
						entity[back](this);
					}

					return this;
				};
			}
			else
			{	//Need a setter
				var callback = function(){};
				definition.Constructor.prototype['set' + field] = function(entity)
				/**
				 * Set the private field, and set any nav properties correctly
				 */
				{
					var id = entity[relationship.to.property]();
					if( !(id === this[relationship.from.property]()))
					{	//Changing
						this[field] = entity;
						this[relationship.from.property](id);
						if( !("is_a" === relationship.type))
						{	//Add or set this to the remote entity
							//Need to find the back relationship...
							var back_rel = ec.back_rel(this._type(),
							                                      relationship);
							var back = ("has_many" === back_rel.type)
								? 'add_'
								: 'set_';
							back += back_rel.name;
							// ... to call the revers mutator.
							entity[back](this);
						}
					}

					return this;
				};
			}
		};


		var _default = function(type)
		/**
		 * A few default types.
		 */
		{
			switch(type)
			{
				case "int": 
				case "float": return 0;
				case "string": 
				default: return "";
			}
		};


		// Fire off a synchronous request for the context, and build the context
		$.ajax({
			type    : "GET",
			url     : this.settings.contextUri,
			dataType: "json",
			async   : false,
			success : function(data) {
				_set_context(data, protos);
			}
		});
	};

	JEFRi.EntityContext.prototype.definition = function(name)
	/**
	 * Get the definition of an entity.
	 */
	{
		name = (typeof name == "string") ? name : name.type;

		return this._context.entities[name];
	};

	JEFRi.EntityContext.prototype.back_rel = function(type, relationship)
	/**
	 * Find the relationship back to this type. We need this because the far end 
	 * of the relationship defines its own variables, so we MUST look them up.
	 */
	{
		var ec = this;
		var def = ec.definition(relationship.to.type);
		var back = undefined;
		//TODO must this be O(N)? It's easy, and we don't have many rels.
		$.each(def.relationships, function(){
			if(this.to.type === type)
			{	//Found it
				back = this;
			}
		});
		return back;
	}
	

	JEFRi.EntityContext.prototype.intern = function(entity, updateOnIntern)
	/**
	 * Return the canonical memory reference of the entity.
	 */
	{
		var self = this;
		updateOnIntern = !!updateOnIntern || this.settings.updateOnIntern;

		if(entity instanceof Array)
		{
			$(entity).each(function(index, ent){
				entity[index] = self.intern(ent, updateOnIntern);
			})
			return entity;
		}

		var ret;
		if(updateOnIntern)
		{	//Merge the given entity into the stored entity.
			ret = this._instances[entity._type()][entity.id()] || {};
			$.extend(ret, entity);
		}
		else
		{	//Take the one if it's stored, otherwise use the given entity.
			ret = this._instances[entity._type()][entity.id()] || entity;
		}
		//Update the saved entity
		this._instances[entity._type()][entity.id()] = ret;
		return ret;
	};

	JEFRi.EntityContext.prototype.extend = function(type, extend)
	/**
	 * Add the methods in the extend prototype to the prototype of type specifed
	 * affecting _ALL_ instances, both current and future, of type.
	 */
	{
		this._context.entities[type] &&
			$.extend(
				this._context.entities[type].Constructor.prototype,
				extend.prototype
			);
	};

	JEFRi.EntityContext.prototype.build = function(type, obj)
	/**
	 * Return a new instance of an object described in the context.
	 */
	{
		var def = this.definition(type);
		obj = obj || {};
		// We are going to build the new entity first, then, if there is a local
		// instance, we will extend the local instance with the new instance.
		var r = new this._context.entities[type].Constructor(obj);
		if(undefined !== obj[def.key])
		{	// If the entity key is specified in obj, check the local storage.
			var demi = {_type : type};
			demi[def.key] = obj[def.key];
			var instance = this.find(demi);
			if(false !== instance)
			{	// Local instance, extend it with the new obj and return local.
				// AKA lazy interning.
				$.extend(instance, r);
				return instance;
			}
		}
		this._instances[type][r.id()] = r;
		this._new.push(r);
		return r;
	};

	JEFRi.EntityContext.prototype.expand = function (transaction)
	/**
	 * Expand and intern a transaction.
	 */
	{
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
//		return ret; // Y U COMMENTED!?
	};

	JEFRi.EntityContext.prototype.transaction = function(spec)
	/**
	 * Prepare a transaction to run against a certain store.
	 */
	{
		spec = spec || [];

		var store;
		//Choose a data store
		//TODO OMGOMGOMG need to fix this to not be application dependent.
		//Jonathan's answer, 2011 06 13: "Look in the Yellow Pages"
		store = new JEFRi.PostStore(this, {target: ROOT + 'jefri/'});

		return new JEFRi.Transaction(spec, store);
	};

	JEFRi.EntityContext.prototype.find = function(spec)
	/**
	 * Return an interned entity from the local instance matching spec. Spec
	 * requires an _type property and the entity key.
	 *
	 * Returns:
	 *	FALSE, if nothing matches.
	 *	Single entity, if spec.key is set and found
	 *	Array of entities matching spec, if key is not set
	 */
	{
		if(typeof spec == "string")
		{
			spec = {_type : spec};
		}
		var to_return = [];
		var r = this.definition(spec._type);
		var results = this._instances[spec._type];
		
		if(undefined !== spec[r.key])
		{	//if a key is set, return only that result.
			return results[spec[r.key]] || false;
		}
		//add results to an array to clean up the return for the user.
		//TODO make it check properties in spec
		$.each(results, function(){
			to_return.push(this);
		});

		return to_return || false;
	};

	JEFRi.EntityContext.prototype.get = function(spec, callback)
	/**
	 * Passes an array of interned entities matching spec to callback.
	 *
	 * If spec is an array with multiple elments, and ANY ONE matches, the
	 * result array will have only the matching entities. If NONE matches, the
	 * result array will have one entity per spec.
	 */
	{
		var self = this;
		spec = (spec instanceof Array) ? spec : [spec];
		var result = this.get_empty(spec, function(result, meta){
			if(0 === result.length)
			{	//Add the spec as new objects.
				$.each(spec, function() {
					result.push(self.build(this.type, this));
				});
			}
			callback(result, meta);
		});
	};

	JEFRi.EntityContext.prototype.get_first = function(spec, callback)
	/**
	 * Pass the spec to get, and just pop the first entity.
	 */
	{
		spec = (spec instanceof Array) ? spec : [spec];
		var result = this.get(spec, function(data, meta){
			var _type = spec._type instanceof Function
				? spec._type()
				: spec._type;
			callback(data[_type].pop(), meta);
		});
	};

	JEFRi.EntityContext.prototype.get_empty = function(spec, callback)
	/**
	 *	Run a GET query using spec, passing the results to the callback.
	 */
	{
		spec = (spec instanceof Array) ? spec : [spec];
		var self = this;
		var results = {};
		var transaction = this.transaction();

		results.push = function(entity) {
			var type = entity._type();
			if(!this[type])
			{
				this[type] = [];
			}
			this[type].push(entity);
		};

		$.each(spec, function(){
			var _type = this._type instanceof Function
				? this._type()
				: this._type;
			var def = self.definition(_type);
			var id = this[def.key];
			//Check if the ID is set
			if( (undefined != id) && self._instances[_type][id])
			{	//If it is, check in our current instances.
				//If it is in the instances, use that one
				results.push(self._instances[_type][id]);
			}
			else
			{
				//Otherwise, add to transaction
				//If the ID is not set, add the spec to the transaction
				transaction.add(spec);
			}
		});

		//If transaction is not empty
		if(transaction.entities.length > 0)
		{	//Run the transaction
			var results = results;
			transaction.get(function(transaction){
				//Merge the result sets, adding `gotten` things to `had` things.
				$.each(transaction.entities, function(){
					results.push(this);
				});
				callback(results, transaction.meta);
			});
		}
		else
		{	//just the callback...
			callback(results);
		}
	};

	JEFRi.EntityContext.prototype.save_new = function(callback)
	/**
	 * Save all the new entities in this context.
	 */
	{
		var transaction = this.transaction();
		$(this).trigger('saving');

		//Add all new entities to the transaction
		$.each(this._new, function(){
			this.persist(transaction);
		});

		transaction.persist(callback);
	}

	JEFRi.EntityContext.prototype.save_all = function(callback)
	/**
	 * Save all entities with changes, including new entities.
	 */
	{
		var transaction = this.transaction();
		$(this).trigger('saving');

		//Add all new entities to the transaction
		$.each(this._modified, function(){	//The _type {}s
			$.each(this, function() {	//the entity {}s
				this.persist(transaction);
			});
		});

		$.each(this._new, function(){
			this.persist(transaction);
		});

		transaction.persist(callback);
	}

	JEFRi.Transaction = function(spec, store)
	/**
	 * Object to handle transactions.
	 */
	{
		if(!this instanceof JEFRi.Transaction)
		{	// `new` guard
			return new JEFRi.Transaction(spec, store);
		}

		this.meta = {};
		this.store = store;
		this.entities = (spec instanceof Array)?spec:[spec];

		this.toString = function()
		/**
		 * Return a JSON representation of the parts of the transaction.
		 */
		{
			var store = this.store;
			var transaction = {};
			transaction.meta = this.meta;
			transaction.entities = [];
			$.each(this.entities, function() {
				var self = this;
				var ent = {};
				ent._type = this._type instanceof Function
					? this._type()
					: this._type;
				if(this.__new)
				{ //Only set if actually new.
					ent.__new = this.__new;
				}
				var def = store.ec.definition(ent._type);
//TODO make this smarter
				$.each(def.properties, function(){
					ent[this.name] =
						self[this.name] instanceof Function
							? self[this.name]()
							: self[this.name];
				});
				$.each(def.relationships, function(){
					if(self[this.name])
					{	//Add the relationships to the get
						ent[this.name] = self[this.name];
					}
				});
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		}
	};

	JEFRi.Transaction.prototype.get = function(callback)
	/**
	 * Run the transaction as a GET request.
	 */
	{
		$(this).trigger('getting');
		$(this).one('gotten', function(e, data){callback(data);});
		this.store && this.store.get(this);
	};

	JEFRi.Transaction.prototype.persist = function(callback)
	/**
	 * Run the transaction as a persist request.
	 */
	{
		$(this).trigger('persisting');
		$(this).one('persisted', function(e, data){
			$.each(this.entities, function(){
				$(this).trigger('persisted');
			});
			callback(data);
		});
		this.store && this.store.persist(this);
	};

	JEFRi.Transaction.prototype.add = function(spec)
	/**
	 * Add the entities in spec to the transaction.
	 */
	{
		//Force spec to be an array
		spec = (spec instanceof Array)?spec:[spec]
		var ents = this.entities;
		$(spec).each(function(){
			if(ents.contains(this, JEFRi.EntityComparator) < 0)
			{	//Hasn't been added yet...
				ents.push(this);
			}
		});
		return this;
	};

	JEFRi.Transaction.prototype.meta = function(attributes)
	/**
	 * Array setter for meta attributes.
	 */
	{
		for(attr in attributes)
		{
			this.meta[attr] = attributes[attr];
		}
		return this;
	}

	/**
	 * Persistance Stores
	 */

	JEFRi.PostStore = function(ec, options)
	/**
	 * PostStore
	 *
	 * Handles POSTing a transaction to a remote JEFRi instance.
	 */
	{
		this.ec = ec;
		this.target = options && options.target;
		var self = this;

		var _send = function(url, transaction, pre, post)
		/**
		 * The actual function that gets down and dirty with the AJAX.
		 *
		 * Params:
		 *	url	The URL of the JEFRi store to POST to.
		 *	transaction	The transaction to send.
		 *	pre	Name of the pre-send event.
		 *	post	Name of the post-send event. 
		 */
		{
			$(transaction).trigger(pre);
			$(self).trigger(pre);
			$(self).trigger('sending');
			$.ajax({
				type    : "POST",
				url     : url,
				data    : transaction.toString(),
				dataType: "json",
				success : function(data) {
					console.log("Logging success", data);
					ec.expand(data, true);//Always updateOnIntern
					$(self).trigger('sent', data);
					$(self).trigger(post, data);
					$(transaction).trigger(post, data);
				},
				error : function(data){
					console.log("Logging error", data);
				},
			});
		};

		this.get = function(transaction)
		/**
		 * Run a transaction as a get request.
		 */
		{
			var url = (this.target + "get");
			_send(url, transaction, 'getting', 'gotten');
		}

		this.persist = function(transaction)
		/**
		 * Run a transaction as a persist request.
		 */
		{
			var url = (this.target + "persist");
			_send(url, transaction, 'persisting', 'persisted');
		}

		this.is_async = function()
		/**
		 * Always asynchronous.
		 */
		{
			return true;
		}
	}

})(jQuery);
