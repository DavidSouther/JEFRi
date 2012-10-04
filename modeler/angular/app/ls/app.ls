angular.module \modeler, <[ jefri jquery ]>

jefri = ! (JEFRi) ->
	JEFRi.load \entityContext.json

angular.module \modeler
	.run [\JEFRi, jefri]
