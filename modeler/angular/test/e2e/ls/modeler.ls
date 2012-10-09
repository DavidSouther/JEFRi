/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */
describe 'Modeler', !(a)->

	beforeEach !->
		browser!.navigateTo '/'

	describe "Smoke", !(a)->
		it "renders", !->
			expect (element \#controls .count!) .toBe 1
			expect (element \#context .count!) .toBe 1

	describe "Controls", !(a)->
		it "creates new entities", !->
			debugger
			element "\#controls \#new_entity" .click!
			expect (repeater '\#context .entity' .count!) .toBe 2

	describe "Context" !(a)->
		it "has an entity name 'Host'", !->
			expect (element '\#context .entity:first .name' .text!) .toBe \Host
