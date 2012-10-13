Inline = ($) ->
	restrict: \E
	template: '<span>
				<span ng:hide="editing" ng:click="edit()">
					{{value}}
				</span>

				<span ng:show="editing">
					<input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" />
				</span>
			</span>'
	replace: true
	scope: true
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