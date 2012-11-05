JEFRi = require "jefri"
FileStore = require "../../../../lib/filestore"

beforeEach !->
	@addMatchers do
		toBeAwesome: -> @actual is 'awesome'

describe "filestore smoke", !(a)->
	runtime = new JEFRi.Runtime "http://souther.co/EntityContext.json"
	filestore = new JEFRi.FileStore {runtime: runtime}
	it "is awesome", !->
		expect(filestore.awesome!).toBeAwesome!


describe "filestore save", !(a)->
	debugger
	done = false
	runtime = new JEFRi.Runtime "http://souther.co/EntityContext.json"

	runtime.ready.then !->
		ct = runtime.build "Context"
		ent = runtime.build "Entity"
		ct.entities ent
		it "did runtime stuff", ->
			expect (ct.entities!length) .toBe 1
		done = true

	waitsFor -> done
