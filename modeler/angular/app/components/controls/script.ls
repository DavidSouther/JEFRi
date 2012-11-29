directive = ($, model) ->
	restrict: \E
	template: $.template "\#controls"
	replace: true
	scope: true
	controller: !($scope)->
		$scope <<<
			action: 'Load'
			storage: 'LocalStore'
			endpoint: 'http://localhost:3000/'
			contexts: []
			contextName: ""
			add: !->
				model.addEntity!
				setTimeout !-> $scope.$apply!

			isRemoteStore: -> $scope.storage is 'PostStore'
			isSaving: -> $scope.action is 'Save'
			loadContexts: !->
				model.listContexts($scope.storage, {remote: $scope.endpoint}).then !(results)->
					$scope.contexts = results.entities
					setTimeout !-> $scope.$apply!
			finish: !->
				name = if $scope.isSaving! then $scope.contextName || model.context.name! || "DEFAULT_CONTEXT" else $scope.contextId
				model[$scope.action]($scope.storage, name, {remote: $scope.endpoint}).then !->
					setTimeout !-> $scope.$apply!
				$scope.showContext = false
			loadSample: !-> model.load!
			loadContext: !->
				_.request.post "#{$scope.endpoint}load/", {data: '{"context": "http://localhost:3000/entityContext.json"}', dataType: "application/json"}
				setTimeout !-> $scope.$apply!
			export: model.export
			exported: model.export!

angular.module \modeler
	.directive \controls, [\jQuery, \Model, \JEFRi, directive]