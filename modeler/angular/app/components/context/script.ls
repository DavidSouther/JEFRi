controller = !($scope, model) ->
	model.loaded :> !->
		$scope.context = model.context
		$scope.$digest!

angular.module \modeler
	.controller \Context, [\$scope, \Model, controller]

directive = ($, Model) ->
	restrict: \E
	template: $.template \.context
	replace: true
	controller: \Context

angular.module \modeler
	.directive \context, [\jQuery, \Model, directive]
