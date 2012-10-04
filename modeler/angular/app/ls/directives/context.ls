Context = ($) ->
	restrict: \E
	templateUrl: 'partials/context.html'
	replace: true
	controller: \Context


angular.module \modeler
	.directive \context, [\jQuery, Context]