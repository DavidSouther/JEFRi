angular.module \modeler, <[ jefri jquery jsPlumb ui ]>

modeler = !(JEFRi) ->
	JEFRi.load "entityContext.json"

angular.module \modeler
	.run [\JEFRi, modeler]
