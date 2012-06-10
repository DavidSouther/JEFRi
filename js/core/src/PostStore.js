//     JEFRi PostStore.js 0.1.0
//     (c) 2011-2012 David Souther
//     JEFRi is freely distributable under the MIT license.
//     For all details and documentation:
//     http://jefri.org

(function(_){
	var root = this;

	// ### Persistence Stores
	// TODO move this out

	// #### PostStore
	//
	// Handles POSTing a transaction to a remote JEFRi instance.
	root.JEFRi.PostStore = function(ec, options) {
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
}.call(this, _, JEFRi));