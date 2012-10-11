JefriProperty = ->
	restrict: \A
	link: !(scope, element, attrs)->
		[entity, property] = attrs.jefriProperty.split \.
		entity = scope[entity]
		stat = !->
			element.text entity[property]!
			entity[property].modified :> !-> element.text entity[property]!
		
		input = !->
			element.val entity[property]!
			element.change !-> entity[property] element.val!
			entity[property].modified :> !-> element.val entity[property]!

		switch element[0].nodeName
		| <[ SPAN DIV P ]> => stat!
		| <[ INPUT SELECT TEXTAREA ]> => input!

angular.module \jefri
	.directive \jefriProperty, [JefriProperty]
