require! { jefri: "../../../../lib/jefri.js" }

describe "jefri", !(a)->

	it "can be instantiated with no context", !->
		done = false
		runs !->
			runtime = new jefri.Runtime!
			done := true

		waitsFor -> done

	it "can unset a relationship", !->
		done = false
		runtime = new jefri.Runtime "",
			debug:
				context:
					entities:
						Foo:
							key: "foo_id",
							properties:
								foo_id: {type: "string"}
								bar_id: {type: "string"}
							relationships:
								bar:
									type: "has_a",
									property: "bar_id",
									to:
										type: "Bar",
										property: "foo_id"
									back: "foo"
						Bar:
							key: "bar_id",
							properties:
								bar_id: {type: "string"}
								foo_id: {type: "string"}
							relationships:
								foo:
									type: "has_a",
									property: "foo_id",
									to:
										type: "Foo",
										property: "bar_id"
									back: 'bar'

		runtime.ready.done !->
			expect runtime._instances.Foo .toBeDefined "Runtime instantiated."

			foo = runtime.build "Foo"
			fid = foo.id true
			bar = runtime.build "Bar"
			bid = bar.id true

			foo.bar bar
			foo.bar undefined

			expect foo._relationships.bar .toBeUndefined "Setting to undefined works."
			done := true

		waitsFor -> done

	it "triggers entity destruction events", !->
		done = false
		runtime = new jefri.Runtime "",
			debug:
				context:
					entities:
						Foo:
							key: "foo_id",
							properties:
								foo_id: {type: "string"}

		runtime.ready.done !->
			expect runtime._instances.Foo .toBeDefined "Runtime instantiated."

			foo = runtime.build "Foo"

			destroying = jasmine.createSpy!
			destroyed = jasmine.createSpy!

			foo.destroying :> destroying
			foo.destroyed :> destroyed

			foo._destroy!

			expect destroying .toHaveBeenCalled!
			expect destroyed .toHaveBeenCalled!

			done := true

		waitsFor -> done