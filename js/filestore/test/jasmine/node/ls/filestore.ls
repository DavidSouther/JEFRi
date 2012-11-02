JEFRi = require "jefri"
FileStore = require "../../../../lib/filestore"

beforeEach !->
	@addMatchers do
		toBeAwesome: -> @actual is 'awesome'

describe "filestore", !(a)->
	runtime = new JEFRi.Runtime debug: context: {attributes: {}, entities: {}}
	filestore = new JEFRi.FileStore {runtime: runtime}
	it "is awesome", !->
		expect(filestore.awesome!).toBeAwesome!
