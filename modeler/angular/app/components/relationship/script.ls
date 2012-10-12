directive = ($, jsp)->
	restrict: \E
	templateUrl: 'components/relationship/view.html'
	replace: true
	link: !(scope)->
		from = ".entity.#{scope.relationship.from!.name!}"
		to = ".entity.#{scope.relationship.to!.name!}"
		if scope.relationship.from_property! => from = "#from .#{scope.relationship.from_property!}"
		if scope.relationship.to_property! => to = "#to .#{scope.relationship.to_property!}"
		jsp.connect	$(from), $(to)

angular.module \modeler
	.directive \relationship, [\jQuery, \JSPlumb, directive]