Relationship = ($, jsp) ->
	restrict: \E
	templateUrl: 'views/relationship.html'
	replace: true,
	controller: !($scope)->
		console.log $scope.relationship

angular.module \modeler
	.directive \relationship, [\jQuery, \JSPlumb, Relationship]