Entity = ($) ->
	restrict: \E
	templateUrl: 'partials/entity.html'
	replace: true
	controller: \Entity


angular.module \modeler
	.directive \entity, [\jQuery, Entity]
