Controls = ($) ->
	restrict: \E
	templateUrl: 'partials/controls.html'
	replace: true

angular.module \modeler
	.directive \controls, [\jQuery, Controls]