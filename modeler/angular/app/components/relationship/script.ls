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
		$scope.relationship.modified :> _.lock !(field, value)->
			# BUG IN JEFRI (find not implemented quite right)
			_find = (type)->
				found = jefri.find {_type: type, _id: value}
				for ent in found
					if ent.id! is value
						return ent
			if _(field).isArray! then [field, value] = field
			if field is \to_id
				to_rel = _find \Entity
				$scope.relationship.to to_rel
			if field is \from_property
				from_property = _find \Property
				$scope.relationship.from_property from_property.name!
			if field is \to_property
				to_property = _find \Property
				$scope.relationship.to_property to_property.name! 
			$scope.$apply!

angular.module \modeler
	.directive \relationship, [\jQuery, \JSPlumb, \JEFRi, directive]