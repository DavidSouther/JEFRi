directive = ($, Model) ->
	restrict: \E
	template: $.template "\#controls"
	replace: true,
	controller: !($scope)->
		$scope <<<
			action: 'Load'
			storage: 'LocalStore'
			endpoint: 'http://localhost:8000/'
			add: !-> Model.addEntity!
			isRemoteStore: -> $scope.storage is 'PostStore'

angular.module \modeler
	.directive \controls, [\jQuery, \Model, directive]