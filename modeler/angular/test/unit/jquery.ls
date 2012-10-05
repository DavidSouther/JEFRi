describe 'jQuery service' !->
	beforeEach module \jquery

	describe \jQuery !(a)->
		it 'Should provide jQuery', inject !(jQuery)->
			expect jQuery
			expect window.jQuery

		it 'should not expose $', inject !(jQuery)->
			expect(window.$).not
