directive = ($, Model) ->
	restrict: \E
	template: $.template "\#controls"
	replace: true,
	controller: !($scope)->
		$scope.add = !->
			Model.addEntity!

angular.module \modeler
	.directive \controls, [\jQuery, \Model, directive]