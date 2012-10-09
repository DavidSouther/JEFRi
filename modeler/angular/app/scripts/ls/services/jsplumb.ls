JSPlumb = ->
	jsPlumb = jsPlumb.getInstance!

	connect: !(a, b)->
		jsPlumb.connect a, b

angular.module \jsPlumb, [\jQuery]
	.factory \JSPlumb, JSPlumb