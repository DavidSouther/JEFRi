directive = ($, model) ->
	restrict: \E
	template: $.template "\#controls"
	replace: true,
	controller: !($scope, JEFRi)->
		$scope <<<
			action: 'Load'
			storage: 'LocalStore'
			endpoint: 'http://localhost:8000/'
			contexts: []
			contextName: ""
			add: !-> model.addEntity!
			isRemoteStore: -> $scope.storage is 'PostStore'
			isSaving: -> $scope.action is 'Save'
			loadContexts: !->
				model.listContexts($scope.storage, {remote: $scope.endpoint}).then !(results)->
					$scope.contexts = results.entities.Context
			finish: !->
				name = $scope.contextName || model.context.name! || "DEFAULT_CONTEXT"
				model[$scope.action]($scope.storage, name, {remote: $scope.endpoint})

angular.module \modeler
	.directive \controls, [\jQuery, \Model, \JEFRi, directive]