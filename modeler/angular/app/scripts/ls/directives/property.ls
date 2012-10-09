Property = ($, Model) ->
	restrict: \E
	templateUrl: 'views/property.html'
	replace: true
	link: !(scope, element, attributes)->
		set = !(prop)->
			scope.property[prop]($(element).find ".edit .#prop" .val!)
		scope.save = !->
			set \name
			set \type
		scope.delete = !->
			scope.property._destroy!

angular.module \modeler
	.directive \property, [\jQuery, \Model, Property]