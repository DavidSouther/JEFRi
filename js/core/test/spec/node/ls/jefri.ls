require! { jefri: "../../../../lib/jefri.js" }

describe "jefri", !(a)->

	it "can be instantiated with no context", !->
		done = false
		runs !->
			runtime = new jefri.Runtime!
			runtime.ready.then !->
				done := true

		waitsFor -> done
