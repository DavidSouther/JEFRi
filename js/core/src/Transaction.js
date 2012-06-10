//     JEFRi PostStore.js 0.1.0
//     (c) 2011-2012 David Souther
//     JEFRi is freely distributable under the MIT license.
//     For all details and documentation:
//     http://jefri.org

(function(_, JEFRi){

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

}.call(this, _, this.JEFRi));