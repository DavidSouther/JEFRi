angular.module \jefri,
	.factory \JEFRi, ->
		rt = new JEFRi.Runtime "context.json"
		JEFRi.Runtime:: <<<
			run: (which, ents)->
				t = new window.JEFRi.Transaction!
				t.add ents
				storeOptions =
					remote: @settings.ENDPOINT
					runtime: @
				s = new window.JEFRi.Stores.PostStore storeOptions
				s.execute which, t

			save: (ents)->
				@run 'persist', ents

			get: (spec={})->
				@run 'get', spec

			config: !(endpoint="/")->
				@settings.ENDPOINT = endpoint

		rt <<<
			settings:
				ENDPOINT: "/"

		rt