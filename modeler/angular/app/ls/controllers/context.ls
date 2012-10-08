Context = !($scope, model) ->
	$scope.context = model.context
	model.context.modify :> !->
		$scope.$digest!

angular.module \modeler
	.controller \Context, [\$scope, \Model, Context]
