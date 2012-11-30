#     JEFRi PostStore.js 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For all details and documentation:
#     http:#jefri.org

	# ### PostStore
	#
	# Handles POSTing a transaction to a remote JEFRi instance.

	class PostStore
		(options) ->
			@settings = { version: "1.0", size: Math.pow(2, 16) }
			_.extend @settings, options
			if not @settings.runtime
				throw {message: "LocalStore instantiated without runtime to reference."}

			if @settings.remote
				#Configured correctly, so we can safely transact.
				@ <<<
					get: (transaction)->
						url = "#{@settings.remote}get"
						@_send url, transaction, 'getting', 'gotten'

					persist: (transaction)->
						url = "#{@settings.remote}persist"
						@_send url, transaction, 'persisting', 'persisted'
			else
				#No backing data store, so do nothing.
				@get = @persist = (transaction)->
					transaction.entities = []
					# _.trigger transaction, "gotten"
					_.Deferred!resolve transaction .promise!

		_send: (url, transaction, pre, post)~>
			# _.trigger(transaction, pre);
			# _.trigger(self, pre, transaction);
			# _.trigger(self, 'sending', transaction);
			_.request.post url,
				data    : transaction.toString!
				dataType: "application/json"
			.done (data)~>
				if _(data).isString!
					data = JSON.parse data
				# Always updateOnIntern
				@settings.runtime.expand data, true
				# _.trigger(self, 'sent', data);
				# _.trigger(self, post, data);
				# _.trigger(transaction, post, data);
				data

	PostStore:: <<<
		execute: (type, transaction)->
			@[type] transaction

	JEFRi.PostStore = PostStore