
# The model service will wrap a singleton Model class which manages a reference to a root
# Context entity. This separates users of the model service one level from JEFRi- they
# still get all the entities, but can't do runtime things directly.

model = (JEFRi) ->
	class Model
		->
			@reset!
			@load

		reset: !->
			<~! JEFRi.ready.then
			@context = JEFRi.build \Context
			@ready <: {}

		load: !->
			load = !~>
				@ready -:> load
				hostsEntity = JEFRi.build \Entity,
					"name": "Host"
					"key": "host_id"
				@context.entities hostsEntity

				properties = [
					JEFRi.build "Property",
						name: "host_id",
						type: "string"
					JEFRi.build "Property",
						name: "hostname",
						type: "string"
					JEFRi.build "Property",
						name: "ip",
						type: "string"
					JEFRi.build "Property",
						name: "mac",
						type: "string"
				]
				hostsEntity.properties properties

			@ready :> load

		addEntity: !->
			@context.entities JEFRi.build \Entity


	new Model!

angular.module \modeler
	.factory \Model, [\JEFRi, model]
	.run [\Model, -> it.load!]
