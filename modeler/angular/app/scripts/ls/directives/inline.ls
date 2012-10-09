Inline = ($) ->
	restrict: \E
	templateUrl: 'views/inline.html'
	replace: true,
	scope: true,
	controller: !($scope)->
		$scope.editing = no
		$scope.edit = !->
			$scope.editing = yes
		$scope.save = !->
			$scope.editing = no
	link: !(scope, element, attrs) ->
		scope.value = scope.entity[attrs.property]! || attrs.default
		scope.$watch 'value', !->
			scope.entity[attrs.property](scope.value)

angular.module \modeler
	.directive \inline, [\jQuery, Inline]