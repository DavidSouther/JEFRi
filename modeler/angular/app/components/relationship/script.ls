directive = ($, jsp, jefri)->
	restrict: \E
	template: $.template \.relationship
	replace: true
	# When rendering a relationship, also connect the plumbing.
	link: !(scope)->
		from = ".entity.#{scope.relationship.from!.name!}"
		to = ".entity.#{scope.relationship.to!.name!}"
		if scope.relationship.from_property! => from = "#from .#{scope.relationship.from_property!}"
		if scope.relationship.to_property! => to = "#to .#{scope.relationship.to_property!}"
		setTimeout -> jsp.connect $(from), $(to)
	controller: !($scope)->
		$scope.relationship.modified :> !(field, value)->
			if field is \to_id
				to_rel = jefri.find {_type: \Entity, _id: value}
				# BUG IN JEFRI (find not implemented)
				for rel in to_rel
					if rel.id! is value
						to_rel = rel
				$scope.relationship.to to_rel
				$scope.$parent.$digest!

angular.module \modeler
	.directive \relationship, [\jQuery, \JSPlumb, \JEFRi, directive]