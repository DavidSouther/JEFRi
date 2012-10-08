Default = ->
	(input, def)->
		input || def

angular.module \modeler
	.filter \default, Default
