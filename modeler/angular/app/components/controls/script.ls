directive = ($, model) ->
	restrict: \E
	template: $.template "\#controls"
	replace: true,
	controller: !($scope)->
		$scope <<<
			action: 'Load'
			storage: 'LocalStore'
			endpoint: 'http://localhost:3000/'
			contexts: []
			contextName: ""
			add: !-> model.addEntity!
			isRemoteStore: -> $scope.storage is 'PostStore'
			isSaving: -> $scope.action is 'Save'
			loadContexts: !->
				model.listContexts($scope.storage, {remote: $scope.endpoint}).then !(results)->
					$scope.contexts = results.entities
			finish: !->
				name = if $scope.isSaving! then $scope.contextName || model.context.name! || "DEFAULT_CONTEXT" else $scope.contextId
				model[$scope.action]($scope.storage, name, {remote: $scope.endpoint})
				$scope.showLoadSave = false
			loadSample: !-> model.load!
			export: model.export

angular.module \modeler
	.directive \controls, [\jQuery, \Model, \JEFRi, directive]