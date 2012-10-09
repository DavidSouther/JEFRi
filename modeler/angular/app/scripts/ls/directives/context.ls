Context = ($, Model) ->
	restrict: \E
	templateUrl: 'views/context.html'
	replace: true
	controller: \Context

angular.module \modeler
	.directive \context, [\jQuery, \Model, Context]