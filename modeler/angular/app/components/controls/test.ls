describe "Directive", !->
	beforeEach module "modeler"

	describe "Controls", !(a)->
		it "Has a New Entity button", !->
			inject  !($rootScope, $compile)->
				debugger
				element = "<controls></controls>"
				element = angular.element element
				element = $compile element
				element = element $rootScope