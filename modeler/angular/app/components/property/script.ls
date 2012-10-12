directive = ($, Model) ->
	restrict: \E
	templateUrl: 'components/property/view.html'
	replace: true

angular.module \modeler
	.directive \property, [\jQuery, \Model, directive]