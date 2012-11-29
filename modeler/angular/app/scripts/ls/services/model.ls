
# The model service will wrap a singleton Model class which manages a reference to a root
# Context entity. This separates users of the model service one level from JEFRi- they
# still get all the entities, but can't do runtime things directly.

model = (JEFRi) ->
	class Model
		->
			@runtime = JEFRi
			JEFRi.ready.then !~>
				@context = @runtime.build \Context
				@ready <: {}

		load: !->
			router = JEFRi.build \Entity,
				"name": "Router",
				"key": "router_id"

			host = JEFRi.build \Entity,
				"name": "Host"
				"key": "host_id"
			@context.entities [host, router]

			router.properties [
				JEFRi.build \Property,
					name: \router_id
					type: \string
				JEFRi.build \Property,
					name: \name
					type: \string
			]

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

			router-many-hosts = JEFRi.build \Relationship,
				name: \hosts
				type: \has_many
				to_property: \router_id
				from_property: \router_id
				back: \router
			router-many-hosts .from router

			host-a-router = JEFRi.build \Relationship,
				name: \router
				type: \has_a
				to_property: \router_id
				from_property: \router_id
				back: \hosts
			host-a-router .from host .to router
			router-many-hosts .to host

			@ready <: {}

		newEntityId: 1
		addEntity: !->
			@context.entities JEFRi.build \Entity,
				name: "entity_#{@newEntityId++}"

		listContexts: (storeType, storeOptions)->
			t = new window.JEFRi.Transaction!
			t.add _type: \Context
			storeOptions <<<
				runtime: JEFRi
			s = new window.JEFRi[storeType](storeOptions)
			s.execute 'get', t

		Save: (store, name, storeOptions)->
			@context.name name
			t = new window.JEFRi.Transaction!
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

		Load: (store, name, storeOptions)->
			@context.name name
			t = new window.JEFRi.Transaction!
			t.add id: name, _type: \Context, entities: { properties: {}, relationships: {} }
			storeOptions <<<
				runtime: JEFRi
			s = new window.JEFRi[store](storeOptions)
			s.execute 'get', t  .then !(results)~>
				@context = results.entities[0]
				@context.entities!
				@ready <: {}

		export: ->
			@context?.export!

	new Model!

angular.module \modeler
	.factory \Model, [\JEFRi, model]
