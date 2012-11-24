JefriProperty = ($)->
	restrict: \A
	link: !(scope, element, attrs)->
		[entity, property] = attrs.jefriProperty.split \.
		entity = scope[entity]

		switch element[0].nodeName
		| <[ SELECT ]> =>
			update = !(val)->
				element.find "option" .filter (-> $ this .attr(\value) is val or $ this .text! is val) .attr \selected, true
			element.change !->
				entity[property] element.val!
				try
					scope.$apply!
			entity.modified :> !(changed, value)->
				if _(changed).isArray! then [changed, value] = changed
				if changed is property then update value
			# Since Angular probably won't have the <option>s expanded, update at the end of the stack.
			setTimeout (-> update entity[property]!), 0
		| <[ INPUT ]> =>
			if 'radio' is element.attr 'type'
				update = !(val)->
					if val is element.val! then element.attr 'checked', 'checked'
				element.change !->
					entity[property] element.val!
					try
						scope.$apply!
				entity.modified :> !(changed, value)->
					if _(changed).isArray! then [changed, value] = changed
					if changed is property then update value
				# Since Angular probably won't have the {{value}}s expanded, update at the end of the stack.
				setTimeout (-> update entity[property]!), 0
				return # Seriously, get the hell out of this link function
			fallthrough
		| <[ INPUT TEXTAREA ]> =>
			element.val entity[property]!
			element.change !-> entity[property] element.val!
			entity.modified :> !-> element.val entity[property]!
		| <[ SPAN DIV P ]> => fallthrough
		| otherwise =>
			element.text entity[property]!
			entity.modified :> !-> element.text entity[property]!

angular.module \jefri
	.directive \jefriProperty, [\jQuery, JefriProperty]
