JSPlumb = ->
	jsPlumb = jsPlumb.getInstance!

	connect: !(a, b)->
		jsPlumb.connect a, b

angular.module \modeler
	.factory \JSPlumb, JSPlumb