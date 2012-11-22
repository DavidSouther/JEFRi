JefriProperty = ($)->
	restrict: \A
	link: !(scope, element, attrs)->
		[entity, property] = attrs.jefriProperty.split \.
		entity = scope[entity]

		switch element[0].nodeName
		| <[ SELECT ]> =>
			update = !(val)->
				element.find "option" .filter (-> $ this .attr(\value) is val) .attr \selected, true
			element.change !-> entity[property] element.val!
			entity.modified :> !(changed, value)->
				if changed is property then update entity[property]!
			# HACK! since Angular probably won't have the <option>s expanded, update at the end of the stack.
			setTimeout (-> update entity[property]!), 0
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
