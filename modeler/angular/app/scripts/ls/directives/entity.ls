Entity = ($) ->
	restrict: \E
	templateUrl: 'views/entity.html'
	replace: true
	controller: \Entity
	link: !(scope, element) ->
		$ element .draggable! .resizable handles: 'e'


angular.module \modeler
	.directive \entity, [\jQuery, Entity]
