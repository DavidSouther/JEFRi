controller = !($scope, model) ->
	$scope.context = model.context

angular.module \modeler
	.controller \Context, [\$scope, \Model, controller]


directive = ($, Model) ->
	restrict: \E
	templateUrl: 'components/context/view.html'
	replace: true
	controller: \Context

angular.module \modeler
	.directive \context, [\jQuery, \Model, directive]
