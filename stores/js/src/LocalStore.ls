#     JEFRi LocalStore.coffee 0.1.0
#     (c) 2011-2012 David Souther
#     JEFRi is freely distributable under the MIT license.
#     For full details and documentation:
#     http://jefri.org


	class LocalStore extends JEFRi.Stores.ObjectStore
		(options) ->
			super options

		_set: !(key, value)->
			localStorage[key] = value

		_get: (key)->
			localStorage[key] || '{}'

		_key: (entity, id)->
			super entity, id .replace '/', '.'

	JEFRi.store \LocalStore, -> LocalStore
