describe "Directive", !->
	beforeEach module "modeler"

	describe "Controls", !(a)->
		it "Has a New Entity button", !->
			inject  !($rootScope, $compile)->
				element = $compile("<controls></controls>")($rootScope)
				debugger