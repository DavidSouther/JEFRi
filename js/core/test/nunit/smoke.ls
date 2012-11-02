exports['Smoke'] = 
	'loads': !(test)->
		test.expect 2
		jefri = require '../../lib/jefri'
		test.ok jefri, 'JEFRi gets returned.'
		runtime = new jefri.Runtime "http://souther.co/EntityContext.json"
		runtime.ready.then !->
			user = runtime.build "User"
			test.ok user.id!, "Instantiated and built."
			test.done!
