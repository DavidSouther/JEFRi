let $ = jQuery
	
	module "JEFRi Relationships"

	test "Unit Testing Environment", ->
		expect 1
		ok !isLocal "Unit tests shouldn't be run from file://, especially in Chrome"

	test "has_a/has_a set", ->
		runtime = new JEFRi.Runtime "",
			options:
				debug:
					entities:
						Foo:
							key: \foo_id
							properties:
								foo_id: type: \string
								bar_id: type: \string
							relationships:
								bar:
									type: \has_a
									property: \bar_id
									to:
										type: \Bar
										property: \foo_id
						Bar:
							key: \bar_id
							properties:
								bar_id: type: \string
								foo_id: type: \string
							relationships:
								foo:
									type: \has_a
									property: \foo_id
									to:
										type: \Foo
										property: \bar_id
		runtime.ready.done ->
			ok runtime._entities.Foo, "Runtime instantiated."
