Entity = (jsp) ->
	restrict: \E
	templateUrl: 'views/entity.html'
	replace: true
	controller: \Entity
	link: !(scope, element) ->
		element .draggable! .resizable handles: \e
		#jsp.draggable element

angular.module \modeler
	.directive \entity, [\JSPlumb, Entity]
