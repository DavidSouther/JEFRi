directive = ($, Model) ->
	restrict: \E
	template: $.template \.property
	replace: true

angular.module \modeler
	.directive \property, [\jQuery, \Model, directive]