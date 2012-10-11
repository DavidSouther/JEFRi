
# The model service will wrap a singleton Model class which manages a reference to a root
# Context entity. This separates users of the model service one level from JEFRi- they
# still get all the entities, but can't do runtime things directly.

model = (JEFRi) ->
	class Model
		->
			@reset!
			@load
			@runtime = JEFRi

		reset: !->
			<~! JEFRi.ready.then
			@context = JEFRi.build \Context
			@ready <: {}

		load: !->
			load = !~>
				@ready -:> load

				router = JEFRi.build \Entity,
					"name": "Router",
					"key": "router_id"

				host = JEFRi.build \Entity,
					"name": "Host"
					"key": "host_id"

				router.properties [
					JEFRi.build \Property,
						name: \router_id
						type: \string
					JEFRi.build \Property,
						name: \name
						type: \string
				]

				router-hosts = JEFRi.build \Relationship,
					name: \hosts
					type: \has_many
					to_property: \router_id
					from_property: \router_id
				router-hosts.to host
				router-hosts.from router

				host.properties [
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
					JEFRi.build \Property,
						name: \router_id
						type: \string
				]

				hostRouter = JEFRi.build \Relationship,
					name: \router
					type: \has_a
					to_property: \router_id
					from_property: \router_id
				host-router.to router
				host-router.from host

				@context.entities [host, router]

			@ready :> load

		addEntity: !->
			@context.entities JEFRi.build \Entity


	new Model!

angular.module \modeler
	.factory \Model, [\JEFRi, model]
	.run [\Model, -> it.load!]
