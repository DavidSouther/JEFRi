controller = !($scope, model) ->
	model.ready :> !->
		$scope.context = model.context
		try $scope.$digest!

angular.module \modeler
	.controller \Context, [\$scope, \Model, controller]

directive = ($, Model) ->
	restrict: \E
	template: $.template \.context
	replace: true
	controller: \Context

angular.module \modeler
	.directive \context, [\jQuery, \Model, directive]
