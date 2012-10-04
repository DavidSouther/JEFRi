
# The model service will wrap a singleton Model class which manages a reference to a root
# Context entity. This separates users of the model service one level from JEFRi- they
# still get all the entities, but can't do runtime things directly.

model = (JEFRi) ->
	class Model
		->
			@reset!
			@load

		reset: !->
			@context = JEFRi.build \Context
	
		load: ->
			hostsEntity = runtime.build "Entity", 
				"name": "Host"
				"key": "host_id"
			context.entities hostsEntity

			properties = [
				runtime.build "Property",
					name: "host_id",
					type: "string"
				runtime.build "Property",
					name: "hostname",
					type: "string"
				runtime.build "Property",
					name: "ip",
					type: "string"
				runtime.build "Property",
					name: "mac",
					type: "string"
			]

			hostsEntity.properties properties

	new Model!

angular.module \modeler
	.factory \Model, [\JEFRi, model]
