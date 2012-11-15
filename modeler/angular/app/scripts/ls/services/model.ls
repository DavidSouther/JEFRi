
# The model service will wrap a singleton Model class which manages a reference to a root
# Context entity. This separates users of the model service one level from JEFRi- they
# still get all the entities, but can't do runtime things directly.

model = (JEFRi) ->
	class Model
		->
			@runtime = JEFRi

		load: !->
			@context = @runtime.build "Context"
			router = JEFRi.build \Entity,
				"name": "Router",
				"key": "router_id"

			host = JEFRi.build \Entity,
				"name": "Host"
				"key": "host_id"

			router.properties do
				JEFRi.build \Property,
					name: \router_id
					type: \string
				JEFRi.build \Property,
					name: \name
					type: \string

			router-hosts = JEFRi.build \Relationship,
				name: \hosts
				type: \has_many
				to_property: \router_id
				from_property: \router_id
			router-hosts.to host
			router-hosts.from router

			host.properties do
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

			hostRouter = JEFRi.build \Relationship,
				name: \router
				type: \has_a
				to_property: \router_id
				from_property: \router_id
			host-router.to router
			host-router.from host

			@context.entities [host, router]

			@loaded <: {}

		addEntity: !->
			@context.entities JEFRi.build \Entity

		listContexts: (storeType, storeOptions)->
			t = JEFRi.transaction!
			t.add _type: \Context
			storeOptions <<<
				runtime: JEFRi
			s = new window.JEFRi[storeType](storeOptions)
			s.execute 'get', t

		Save: !(store, name, storeOptions)->
			@context.name name
			t = JEFRi.transaction!
			t.add @context
			for entity in @context.entities!
				t.add entity
				for property in entity.properties!
					t.add property
				for relationship in entity.relationships!
					t.add relationship
			storeOptions <<<
				runtime: JEFRi
			s = new window.JEFRi[store](storeOptions)
			s.execute 'persist', t

	new Model!

angular.module \modeler
	.factory \Model, [\JEFRi, model]
