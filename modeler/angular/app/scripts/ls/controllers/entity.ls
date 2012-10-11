Enty = !($scope, Model) ->
	$scope.addField = !->
		$scope.entity.properties Model.runtime.build \Property, { name: "New Property", type: \string }
	$scope.addRelationship = !->
		$scope.entity.from_relationships Model.runtime.build \Relationship, { name: "New Relationship", type: \string }
	$scope.delete = !->
		$scope.entity._destroy!

angular.module \modeler
	.controller \Entity, [\$scope, \Model, Enty]
