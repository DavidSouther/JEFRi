Controls = ($, Model) ->
	restrict: \E
	templateUrl: 'views/controls.html'
	replace: true,
	controller: !($scope)->
		$scope.add = !->
			Model.addEntity!

angular.module \modeler
	.directive \controls, [\jQuery, \Model, Controls]