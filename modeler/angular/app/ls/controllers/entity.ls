Enty = !($scope) ->
	$scope.entity = 
		name: \Foo
		properties:
			* name: \Bar
			* name: \Baz

angular.module \modeler
	.controller \Entity, [\$scope, Enty]
