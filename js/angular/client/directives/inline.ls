Inline = ($, JEFRi) ->
	restrict: \E
	template: '<span>
				<span ng:hide="editing" ng:click="edit()">
					{{value}}
				</span>

				<span ng:show="editing && property">
					<input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" />
				</span>
				<span ng:show="editing && relationship">
					<select class="relationship" ng:model="to_id" ui-event="{blur:\'save()\'}">
						<option disabled>{{prompt}}:</option>
						<option ng:repeat="entity in options" value="{{ entity.id }}">{{ entity.name }}</option>
					</select>
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
		entity = scope[attrs.entity || 'entity']
		def = entity._definition!
		if def.properties[attrs.property]
			scope.property = true
			scope.value = entity[attrs.property]! || attrs.default
			scope.$watch 'value', !->
				entity[attrs.property](scope.value)
		else if def.relationships[attrs.property]
			scope.relationship = true
			scope.prompt = attrs.prompt
			scope.to_id = entity[attrs.property]!id!
			scope.value = entity[attrs.property]![attrs.display]!
			scope.options = _(JEFRi.find def.relationships[attrs.property].to.type).map ->
				{id: it.id!, name: it[attrs.display]!}
			scope.$watch 'to_id', !->
				could = _(JEFRi.find _type: def.relationships[attrs.property].to.type).filter ->
					it.id! is scope.to_id
				entity[attrs.property] could[0]
				scope.value = entity[attrs.property]![attrs.display]!

angular.module \JEFRi
	.directive \inline, [\jQuery, \JEFRi, Inline]