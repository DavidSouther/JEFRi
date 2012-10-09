Enty = !($scope, Model) ->
	$scope.addField = !->
		$scope.entity.properties Model.runtime.build \Property, { name: "New Property", type: \string }

angular.module \modeler
	.controller \Entity, [\$scope, \Model, Enty]
