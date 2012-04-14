Array.prototype.contains = function(value, comparator) {
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

Array.prototype.remove = function(value, comparator) {
	var index = this.contains(value, comparator);
	if(index < 0) {return;} //Don't accidentally remove from the end.
	this.splice(index, 1);
};

var JEFRi = {};

JEFRi.EntityComparator = function(a, b){
	var cmp =
		a && b &&
		a._type() === b._type() &&
		a.id() === b.id();
	return cmp;
};

var noop = function(){};

(function($){
	JEFRi.EntityContext = function(contextUri, options, protos)
	/*
	 * EntityContext Constructor.
	 */
	{
	/**
	 * Private variables we'll be using throughout the class.
	 */
		var self = this;
		var ec = this;
		this.settings = {
			contextUri     : contextUri,
			updateOnIntern : true,
			store          : JEFRi.PostStore
		};

		$.extend(this.settings, options);

		this._context = {
			meta: {},
			contexts: {},
			entities: {}
		};
		this._instances = {};
		this._new = [];
		this._modified = {};
		this._store = new this.settings.store(ec, {target: ROOT + 'jefri/'});

	/**
	 * Some helper methods to manage modified entities.
	 */
		this._modified.set = function(entity)
		/** Mark an entity as modified. */
		{
			if(!self._modified[entity._type()])
			{	//Add the type...
				self._modified[entity._type()] = {};
			}
			self._modified[entity._type()][entity.id()] = entity;
		};

		this._modified.remove = function(entity)
		/** Mark an entity as unmodified. */
		{
			delete self._modified[entity._type()][entity.id()];
		};

	/**
	 * Private helper functions.
	 * These handle most of the heavy lifting of building Entity classes.
	 */
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

		var _set_context = function(context, protos)
		/**
		 * Takes a "raw" context object and orders it into the internal _context
		 * storage.  Also builds new prototypes for the context.
		 *
		 * Context  Javascript object with the context
		 */
		{
			ec._context.meta = context.meta;

			$(context.entities).each( function()
			/*  Prep each of the entities in this context. */
			{
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
				//Overwrite the JSON index with the named indicies
				this.relationships = rels;

				this.Constructor = function(proto)
				/**
				 * Build an entity's constructor.
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
						var def = proto[key] || _default(this._type);
						self[key](def);
					});

					/**
					 * Set the key, if it wasn't set by the proto.
					 */
					if ( ! proto[key] ) { this[key](UUID.v4()); }

					//Add/extend our methods
					$.extend(this.prototype, proto.prototype);

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

				_build_prototype(this, (protos && protos[this.name]));
			});
		};

		var _build_prototype = function(definition, proto)
		/**
		 * Set up all the required methods - id(), _type(), and the mutaccs.
		 */
		{
			var ec = self;
			definition.Constructor.prototype._type = function()
			/**
			 * Get this entity's type.
			 */
			{
				return definition.name;
			};

			definition.Constructor.prototype.id = function()
			/**
			 * Get this entity's ID.
			 */
			{
				return this[definition.key]();
			};

			definition.Constructor.prototype.persist = function(transaction, callback)
			/**
			 * Persist this transaction to the upstream data store.
			 */
			{
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

			definition.Constructor.prototype.bind = function(event, callback)
			/**
			 * Bind a callback to happen on some event this entity generates.
			 */
			{
				var self = this;
				self.__event_handlers = self.__event_handlers || {};
				if(!self.__event_handlers.hasOwnProperty(event))
				{
					self.__event_handlers[event] = [];
				}
				self.__event_handlers[event].push(callback);
			};

			definition.Constructor.prototype.trigger = function(event, args)
			/**
			 * Trigger a named event on this entity.
			 */
			{
				var self = this;
				args = args || [];
				self.__event_handlers = self.__event_handlers || {};
				if(self.__event_handlers.hasOwnProperty(event))
				{
					$.each(self.__event_handlers[event], function(){
						this.apply(self, args);
					});
				}
			};

			definition.Constructor.prototype._status = function()
			/**
			 * Find the status of an entity.
			 */
			{
				var state = "PERSISTED";
				if(this.__new)
				{
					state = "NEW";
				}
				else if(!($.isEmptyObject(this.__modified)))
				{
					state = "MODIFIED";
				}
				return state;
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

			/**
			 * encode passes this entity to the writer.
			 *
			 * Not so sure about this one any more...
			 */
			definition.Constructor.prototype.encode = function(writer) {
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

			if(proto) {$.extend(definition.Constructor.prototype,proto.prototype);}
		};

		var _build_mutacc = function(definition, property) {
			var field = '_' + property.name;
			definition.Constructor.prototype[property.name] = function(value) {
				var ret = this;
				if(undefined !== value)
				{	//Value is defined, so this is a setter
					if(value !== this[field])
					{	//Only actually update it if it is a new value.
						if(!this.__modified[field])
						{	//Update it if not set...
							this.__modified[field] = this[field];
							this.__modified._count += 1;
							ec._modified.set(this);
						}
						else
						{
							if(this.__modified[field] === value)
							{	//Setting it back to the old value...
								delete this.__modified[field];
								this.__modified._count -= 1;
							}
							if(this.__modified._count === 0)
							{	//If it was the last property, remove from
								//the context's modified list.
								ec._modified.remove(this);
							}
						}
						this[field] = value;
						this.trigger("modify", [property.name, value]);
					}
				}
				else
				{
					ret = this[field];
				}
				return ret;
			};
		};

		/**
		 * Attach the mutators and accessors (mutaccs) to the prototype.
		 */
		 //TODO Thuroughly debug these functions...
		var _build_relationship = function(definition, relationship) {
			var ec = self;
			var field = '_' + relationship.name;

			//Build the getter
			var get = ("has_many" === relationship.type) ?
				'get_empty'	:
				'get_first';
			definition.Constructor.prototype['get' + field] = function(longGet) {
				if(longGet)
				{	//Lazy load
//					var spec = {
//						_type: relationship.to.type,
//					};
//					spec[relationship.to.property] = this[relationship.from.property]();
//					this[field] = ec[get](spec);
				}
				if(undefined === this[field])
				{	//Need to go ahead and get it from memory, since if the key changes it will be updated elsewhere. ??
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
				definition.Constructor.prototype['add' + field] =
				function(entity) {
					if(undefined === this[field])
					{	//Lazy load
						var load = "get" + field;
						this[load]();
					}

					if(this[field].contains(entity, JEFRi.EntityComparator) < 0)
					{	//The entity is _NOT_ in this' array.
						this[field].push(entity);
						//Call the reverse setter

						//Need to find the back relationship...
						var back_rel = ec.back_rel(this._type(), relationship);
						var back = "set_" + back_rel.name;
						entity[back](this);
					}

					return this;
				};
			}
			else
			{	//Need a setter
				var callback = function(){};
				definition.Constructor.prototype['set' + field] =
				function(entity) {
					var id = entity[relationship.to.property]();
					if( id !== this[relationship.from.property]())
					{	//Changing
						this[field] = entity;
						this[relationship.from.property](id);
						if( "is_a" !== relationship.type )
						{	//Add or set this to the remote entity
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

	JEFRi.EntityContext.prototype.clear = function(){
		this._modified = {};
		this._new = [];
		this._instances = {};
		return this;
	};

	/**
	 * Get the definition of an entity.
	 *
	 */
	JEFRi.EntityContext.prototype.definition = function(name) {
		name = (typeof name == "string") ? name : name.type;

		return this._context.entities[name];
	};

	/**
	 * Find the relationship back to this guy...
	 */
	JEFRi.EntityContext.prototype.back_rel = function(type, relationship) {
		var ec = this;
		var def = ec.definition(relationship.to.type);
		var back = null;
		$.each(def.relationships, function(){
			if(this.to.type === type && this.name !== relationship.name)
			{	//Found it
				back = this;
			}
		});
		return back;
	};

	/**
	 * Return the canonical memory reference of the entity.
	 */
	JEFRi.EntityContext.prototype.intern = function(entity, updateOnIntern) {
		updateOnIntern = !!updateOnIntern || this.settings.updateOnIntern;

		if(entity.length && ! entity._type)
		{	//Array-like
			var q = entity.length, i;
			for(i = 0 ; i < q ; i++){
				entity[i] = this.intern(entity[i], updateOnIntern);
			}
			return entity;
		}

		var ret;
		if(updateOnIntern)
		{	//Merge the given entity into the stored entity.
			ret = this._instances[entity._type()][entity.id()] || {};
			$.extend(true, ret, entity);
		}
		else
		{	//Take the stored one if possible, otherwise use the given entity.
			ret = this._instances[entity._type()][entity.id()] || entity;
		}
		//Update the saved entity
		this._instances[entity._type()][entity.id()] = ret;
		return ret;
	};

	/**
	 * Add the methods in the extend prototype to the prototype of type specifed
	 * affecting _ALL_ instances, both current and future, of type.
	 */
	JEFRi.EntityContext.prototype.extend = function(type, extend) {
		if(this._context.entities[type]) {
			$.extend(
				this._context.entities[type].Constructor.prototype,
				extend.prototype
			);
		}
	};

	/**
	 * Return a new instance of an object described in the context.
	 */
	JEFRi.EntityContext.prototype.build = function(type, obj) {
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
				$.extend(true, instance, r);
				return instance;
			}
		}
		this._instances[type][r.id()] = r;
		this._new.push(r);
		return r;
	};

	/**
	 * Expand and intern a transaction.
	 */
	JEFRi.EntityContext.prototype.expand = function (transaction) {
		var self = this;
		var entities = transaction.entities;

		var ret = [];
		$(entities).each(function() {
			var e = self.build(this._type, this);
			e = self.intern(e, true);
			//Make the entity not new...
//			$(e).trigger('persisted');
//TODO:  Fix this!
e.__new = false;
e.__modified = {};
BIG.ec._new.remove(e, JEFRi.EntityComparator);
BIG.ec._modified.remove(e, JEFRi.EntityComparator);
e.trigger("expand");

			ret.push(e);
		});

		transaction.entities = ret;
		return ret;
	};

	var _store = null;

	JEFRi.EntityContext.prototype.transaction = function(spec) {
		spec = spec || [];

		//Choose a data store
		//TODO OMGOMGOMG need to fix this to not be application dependent.
		//Jonathan's answer, 2011 06 13: "Look in the Yellow Pages"
//		_store = _store || new JEFRi.PostStore(this, );

		return new JEFRi.Transaction(spec, this._store);
	};

	/**
	 * Return an interned entity from the local instance matching spec.
	 *
	 * Spec requires an _type property and the entity key, or specify the property UUID.
	 */
	JEFRi.EntityContext.prototype.find = function(spec) {
		if(typeof spec == "string")
		{
			spec = {_type : spec};
		}
		var to_return = [];
		var r = this.definition(spec._type);
		var results = this._instances[spec._type];
		var ret = false;

		if(spec.hasOwnProperty(r.key))
		{	//if a key is set, return only that result.
			ret = results[spec[r.key]] || false;
		}
		else if(spec.hasOwnProperty("UUID"))
		{	//If UUID is set, return only that result
			ret = results[spec.UUID] || false;
		}
		//add results to an array to clean up the return for the user.
		$.each(results, function(){
			to_return.push(this);
		});

		return to_return || ret || false;
	};

	/**
	 * Return a non-array of interned entities matching spec.
	 *
	 * If spec is an array with multiple elments, and ANY ONE matches, the
	 * result array will have only the matching entities. If NONE matches, the
	 * result array will have one entity per spec.
	 */
	JEFRi.EntityContext.prototype.get = function(spec, callback) {
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

	/**
	 * Pass the spec to get, and just pop the first entity.
	 */
	JEFRi.EntityContext.prototype.get_first = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		var result = this.get(spec, function(data, meta){
			var _type = spec._type instanceof Function ?
				spec._type() :
				spec._type;
			callback(data[_type].pop(), meta);
		});
	};

	var pushResult = function(entity){
		var type = entity._type();
		if(!this[type])
		{
			this[type] = [];
		}
		this[type].push(entity);
	};

	JEFRi.EntityContext.prototype.get_empty = function(spec, callback) {
		spec = (spec instanceof Array) ? spec : [spec];
		var self = this;
		var results = {};
		var transaction = this.transaction();
		var deferred = $.Deferred().done(callback);

		results.prototype.push = pushResult;

		var q = spec.length, i;
		for(i=0 ; i < q ; i++)
		{	//Add the queries
			var _spec = spec[i],
				_type = (_spec._type instanceof Function) ?
					_spec._type() :
					_spec._type;
			var def = this.definition(_type);
			var id = _spec[def.key];

			//Check if the ID is set and exists locally
			if( (undefined !== id) && this._instances[_type][id])
			{	//It is local, so use that one
				results.push(this._instances[_type][id]);
			}
			else
			{	//Otherwise, add to transaction
				transaction.add(_spec);

				if(this.hasOwnProperty("_page"))
				{	//Add the page to the meta
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
		{	//Run the transaction
			transaction.get(function(transaction){
				//Merge the result sets, adding `gotten` things to `had` things.
				$.each(transaction.entities, function(){
					results.push(this);
				});
				deferred.resolve(results, transaction.meta);
			});
		}
		else
		{	//just resolve...
			deferred.resolve(results, {});
		}
		return deferred;
	};

	/**
	 * Save all the new entities.
	 */
	JEFRi.EntityContext.prototype.save_new = function(callback) {
		var transaction = this.transaction();
		$(this).trigger('saving');

		//Add all new entities to the transaction
		$.each(this._new, function(){
			this.persist(transaction);
		});

		return transaction.persist(callback);
	};

	/**
	 * Save all entities with changes, including new entities.
	 */
	JEFRi.EntityContext.prototype.save_all = function(callback) {
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

		return transaction.persist(callback);
	};

	/**
	 * Returns transaction of all entities in local cache.
	 */
	JEFRi.EntityContext.prototype.get_transaction_dump = function() {
		var transaction = this.transaction();

		//Add all entities to the transaction
		$.each(this._instances, function(){	//The _type {}s
			$.each(this, function() {	//the entity {}s
				transaction.add(this);
			});
		});

		return transaction;
	};

	/**
	 * Object to handle transactions.
	 */
	JEFRi.Transaction = function(spec, store) {
		this.meta = {};
		this.store = store;
		this.entities = (spec instanceof Array)?spec:[spec];

		this.toString = function() {
			var store = this.store;
			var transaction = {};
			transaction.meta = this.meta;
			transaction.entities = [];
			$.each(this.entities, function() {
				var self = this;
				var ent = {};
				ent._type = this._type instanceof Function ?
					this._type() :
					this._type;
				if(this.__new)
				{ //Only set if actually new.
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
					{	//Add the relationships to the get
						ent[this.name] = self[this.name];
					}
				});
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		};
	};

	JEFRi.Transaction.prototype.get = function(callback) {
		$(this).trigger('getting');
		$(this).one('gotten', function(e, data){callback(data);});
		if( this.store ) { this.store.get(this); }
	};

	JEFRi.Transaction.prototype.persist = function(callback) {
		$(this).trigger('persisting');
		$(this).one('persisted', function(e, data){
			$.each(this.entities, function(){
				$(this).trigger('persisted');
			});
			callback(data);
		});
		this.store && this.store.persist(this);
	};

	JEFRi.Transaction.prototype.add = function(spec) {
		//Force spec to be an array
		spec = (spec instanceof Array)?spec:[spec];
		var ents = this.entities;
		$(spec).each(function(){
			if(ents.contains(this, JEFRi.EntityComparator) < 0)
			{	//Hasn't been added yet...
				ents.push(this);
			}
		});
		return this;
	};

	JEFRi.Transaction.prototype.addmeta = function(attributes) {
		//$.extend?
		for(var attr in attributes)
		{
			this.meta[attr] = attributes[attr];
		}
		return this;
	};

	/**
	 * Persistance Stores
	 */

	/**
	 * PostStore
	 *
	 * Handles POSTing a transaction to a remote JEFRi instance.
	 */
	JEFRi.PostStore = function(ec, options) {
		this.ec = ec;
		this.target = options && options.target;
		var self = this;

		var _send = function(url, transaction, pre, post) {
			$(transaction).trigger(pre);
			$(self).trigger(pre, transaction);
			$(self).trigger('sending', transaction);
			$.ajax({
				type    : "POST",
				url     : url,
				data    : transaction.toString(),
				dataType: "json",
				success : function(data) {
//					console.log("Logging success", data);
					ec.expand(data, true);//Always updateOnIntern
					$(self).trigger('sent', data);
					$(self).trigger(post, data);
					$(transaction).trigger(post, data);
				},
				error : function(data){
					console.log("Logging error", data);
				}
			});
		};

		this.get = function(transaction) {
			var url = (this.target + "get");
			_send(url, transaction, 'getting', 'gotten');
		};

		this.persist = function(transaction) {
			var url = (this.target + "persist");
			_send(url, transaction, 'persisting', 'persisted');
		};

		/**
		 * Always asynchronous.
		 */
		this.is_async = function(){
			return true;
		};
	};
}(jQuery));
