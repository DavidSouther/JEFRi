JefriProperty = ->
	restrict: \A
	link: !(scope, element, attrs)->
		[entity, property] = attrs.jefriProperty.split \.
		entity = scope[entity]

		switch element[0].nodeName
		| <[ SPAN DIV P ]> =>
			element.text entity[property]!
			entity.modified :> !-> element.text entity[property]!
		| <[ INPUT SELECT TEXTAREA ]> =>
			element.val entity[property]!
			element.change !-> entity[property] element.val!
			entity.modified :> !-> element.val entity[property]!

angular.module \jefri
	.directive \jefriProperty, [JefriProperty]
