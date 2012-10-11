Property = ($, Model) ->
	restrict: \E
	templateUrl: 'views/property.html'
	replace: true

angular.module \modeler
	.directive \property, [\jQuery, \Model, Property]