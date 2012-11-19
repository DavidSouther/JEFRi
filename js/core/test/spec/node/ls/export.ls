describe "JEFRi", !(a)->
	require! {jefri: "../../../../lib/jefri"}

	context = runtime = null
	loaded = done = false

	beforeEach !->
		runtime := new jefri.Runtime "http://localhost:8000/context.json"
		runtime.ready.then !(a)->
			context := runtime.build \Context
			loaded := true
		waitsFor -> loaded

	afterEach !->
		waitsFor -> done
		runs !-> loaded := done := false

	it "exports", !->
		runs !->
			expect context.export .toBeDefined!
			#stringContext = context.export!
			#expect stringContext.length .toBeGreaterThan 0
			done := true
