angular.module \modeler, <[ jefri jquery jsPlumb ui ]>

jefri = ! (JEFRi) ->
	JEFRi.load "entityContext.json"

angular.module \modeler
	.run [\JEFRi, jefri]
