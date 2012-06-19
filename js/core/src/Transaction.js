//     JEFRi PostStore.js 0.1.0
//     (c) 2011-2012 David Souther
//     JEFRi is freely distributable under the MIT license.
//     For all details and documentation:
//     http://jefri.org

// ## Transactions
(function(_, JEFRi){

	// ### Transaction
	// Object to handle transactions.
	JEFRi.Transaction = function(spec, store) {
		this.attributes = {};
		this.store = store;
		this.entities = (spec instanceof Array)?spec:[spec];
	};

	// ### Prototype
	_.extend(JEFRi.Transaction.prototype, {
		// ### toString
		toString: function() {
			var store = this.store;
			var transaction = {};
			transaction.attributes = this.attributes;
			transaction.entities = [];
			_.each(this.entities, function(entity) {
				var ent = _.isEntity(entity) ? entity._encode() : entity;
				transaction.entities.push(ent);
			});
			return JSON.stringify(transaction);
		},

		// ### get*([store])*
		// Execute the transaction as a GET request
		get: function(store) {
			var d = new _.Deferred();
			_.trigger(this, 'getting');
			_.once(this, 'gotten', function(){
				d.resolve(this);
			});
			store = store || this.store;
			store.execute('get', this);
			return d.promise();
		},

		// ### persist*([store])*
		// Execute the transaction as a POST request
		persist: function(store) {
			var d = _.Deferred();
			store = store || this.store;
			_.trigger(this, 'persisting');
			_.trigger(this, 'persisted', function(e, data){
				_.each(e.entities, function(ent){
					_.trigger(ent, 'persisted');
				});
				d.resolve(data);
			});
			if( this.store ) { this.store.persist(this); }
			return d.promise();
		},

		// ### add*(spec...)*
		// Add several entities to the transaction
		add: function(spec) {
			//Force spec to be an array
			spec = _.isArray(spec)?spec:[].slice.call(arguments, 0);
			var ents = this.entities;
			_.each(spec, function(s) {
				// TODO switch to direct lookup.
				if(_.indexBy(ents, _.bind(JEFRi.EntityComparator, s)) < 0) {
					//Hasn't been added yet...
					ents.push(s);
				}
			});
			return this;
		},

		// ### attributes*(attributes)*
		// Set several attributes on the transaction
		attributes: function(attributes) {
			_.extend(this.attributes, attributes);
			return this;
		}
	});

}.call(this, _, this.JEFRi));