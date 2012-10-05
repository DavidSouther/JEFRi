describe 'JEFRi Service', !->
	beforeEach module \jefri

	describe \JEFRi !(a)->
		it 'should make JEFRi accessible', inject !(JEFRi)->
			expect JEFRi.build