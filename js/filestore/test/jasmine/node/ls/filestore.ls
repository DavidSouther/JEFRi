JEFRi = require "jefri"
FileStore = require "../../../../lib/filestore"

describe "FileStore", !(a)->
	user = au = runtime = null
	loaded = done = false

	beforeEach !->
		runtime := new JEFRi.Runtime "http://souther.co/EntityContext.json"
		runtime.ready.then !(a)->
			user := runtime.build \User
			au := user.authinfo!
			loaded := true
		waitsFor -> loaded

	afterEach !->
		waitsFor -> done

	it "smokes", !->
		runs !->
			expect (au.id!length) .toBe 36
			done := true

	it "saves", !->
		runs !->
			filestore = new JEFRi.FileStore "./.jefri", runtime: runtime
			runtime.save_new filestore .then !(transaction)->
				expect transaction .not .toBeNull!
				# expect transction.entities.length .toBe 2
        		# nkeys = _.keys(transaction.entities[0]);
       			# expect nkeys.sort! .to ['_id', '_fields', '_relationships', '_modified', '_new', '_runtime', 'modified', 'persisted'].sort(), "Entity has expected keys.");
				done := true

