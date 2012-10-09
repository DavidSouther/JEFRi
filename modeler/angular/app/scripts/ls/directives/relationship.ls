Relationship = ($) ->
	restrict: \E
	templateUrl: 'views/relationship.html'
	replace: true

angular.module \modeler
	.directive \relationship, [\jQuery, Relationship]