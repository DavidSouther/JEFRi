Entity = ($) ->
	restrict: \E
	templateUrl: 'partials/entity.html'
	controller: \Entity
	replace: true
	link: !(scope, element) ->
		$el = $ element
		$el .click !->
			$el.find \ul .toggle \slow


angular.module \modeler
	.directive \entity, [\jQuery, Entity]
