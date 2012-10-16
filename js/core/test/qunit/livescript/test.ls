let $ = jQuery

	module \Contexts

	asyncTest \Relationships, !->
		runtime = new JEFRi.Runtime "../../context.json"
		<-! runtime.ready.done
		context = runtime.build \Context

		router = runtime.build \Entity,
			"name": "Router",
			"key": "router_id"

		host = runtime.build \Entity,
			"name": "Host"
			"key": "host_id"

		router.properties [
			runtime.build \Property,
				name: \router_id
				type: \string
		]

		router-hosts = runtime.build \Relationship,
			name: \hosts
			type: \has_many
			to_property: \router_id
			from_property: \router_id
		router-hosts.to host
		router-hosts.from router

		host.properties [
			runtime.build "Property",
				name: "host_id",
				type: "string"
			runtime.build \Property,
				name: \router_id
				type: \string
		]

		hostRouter = runtime.build \Relationship,
			name: \router
			type: \has_a
			to_property: \router_id
			from_property: \router_id
		debugger
		host-router.to router
		host-router.from host

		context.entities [host, router]

		equal host.relationships!length, 1, 'Host has correct relationships.'
		equal router.relationships!length, 1, 'Router has correct relationships.'

		equal hostRouter.to!name!, router.name!, "hostRouter is to router."
		equal hostRouter.to!_id, router._id, "hostRouter is to router."

		equal routerHosts.to!name!, host.name!, "routerHosts is to host."
		equal routerHosts.to!_id, host._id, "routerHosts is to host."

		start!
