directive = ($, Model) ->
	restrict: \E
	templateUrl: 'components/controls/view.html'
	replace: true,
	controller: !($scope)->
		$scope.add = !->
			Model.addEntity!

angular.module \modeler
	.directive \controls, [\jQuery, \Model, directive]