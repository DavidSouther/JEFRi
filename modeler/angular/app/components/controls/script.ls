directive = ($, Model) ->
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
			add: !-> Model.addEntity!
			isRemoteStore: -> $scope.storage is 'PostStore'
			isSaving: -> $scope.action is 'Save'
			loadContexts: !->
				Model.listContexts($scope.storage, {remote: $scope.endpoint}).then !(results)->
					$scope.contexts = results.entities.Context

angular.module \modeler
	.directive \controls, [\jQuery, \Model, \JEFRi, directive]