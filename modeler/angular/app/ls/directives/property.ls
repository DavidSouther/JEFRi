Property = ($, Model) ->
	restrict: \E
	templateUrl: 'partials/property.html'
	replace: true,
	link: !(scope, element, attributes)->
		set = !(prop)->
			scope.property[prop]($(element).find ".edit .#prop" .val!)
		scope.save = !->
			set \name
			set \attributes

angular.module \modeler
	.directive \property, [\jQuery, Property]