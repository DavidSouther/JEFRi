exports['Smoke'] = 
	'loads': !(test)->
		test.expect 1
		jefri = require '../../lib/jefri'
		test.ok jefri, 'JEFRi gets returned.'
		test.done!
