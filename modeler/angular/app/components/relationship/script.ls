directive = ($, jsp, jefri)->
	plumb = !(scope)->
		if !scope.relationship => return
		from = ".entity.#{scope.relationship.from!.name!}"
		to = ".entity.#{scope.relationship.to!.name!}"
		if scope.relationship.from_property! => from = "#from .#{scope.relationship.from_property!}"
		if scope.relationship.to_property! => to = "#to .#{scope.relationship.to_property!}"
		if scope.connector => jsp.detach scope.connector
		label = "#{scope.relationship.from!name!}::#{scope.relationship.name!}"
		scope.connector := jsp.connect $(from), $(to)#, label

	restrict: \E
	template: $.template \.relationship
	replace: true
	link: !(scope)->
		# When rendering a relationship, also connect the plumbing.
		setTimeout !-> plumb scope
	controller: !($scope)->
		modified = _.lock !(field, value)->
			# BUG IN JEFRI (find not implemented quite right)
			_find = (type)->
				found = jefri.find {_type: type, _id: value}
				for ent in found
					if ent.id! is value
						return ent
			if _(field).isArray! then [field, value] = field
			if value is undefined then return
			switch field
			| \to_id =>
				to_rel = _find \Entity
				$scope.relationship.to to_rel
			| \from_property =>
				from_property = _find \Property
				$scope.relationship.from_property from_property.name!
			| \to_property =>
				to_property = _find \Property
				$scope.relationship.to_property to_property.name! 
			| \back =>
				if value is ""
					$scope.relationship.back ""
				else
					back = _find \Relationship
					$scope.relationship.back back.name!
			try $scope.$apply!
			plumb $scope
		$scope.relationship.modified :> modified

		$scope.relationship.destroying :> !->
			$scope.relationship.modified -:> modified
			jsp.detach $scope.connector
			$scope.connector = null

		$scope.relationship.destroyed :> !->
			$scope.relationship = null

		$scope.entity.destroyed :> !->
			$scope.relationship?_destroy!
		$scope.relationship.to!destroyed :> !->
			$scope.relationship?_destroy!
			# Do destroy this relationship

angular.module \modeler
	.directive \relationship, [\jQuery, \JSPlumb, \JEFRi, directive]