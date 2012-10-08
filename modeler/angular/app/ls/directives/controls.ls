Controls = ($, Model) ->
	restrict: \E
	templateUrl: 'partials/controls.html'
	replace: true,
	link: !(scope, element, attrs)->
		$el = $(element)
		$el .find \#new_entity .click !->
			Model.addEntity!

angular.module \modeler
	.directive \controls, [\jQuery, \Model, Controls]