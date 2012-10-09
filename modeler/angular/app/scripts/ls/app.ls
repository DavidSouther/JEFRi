angular.module \modeler, <[ jefri jquery ui ]>

jefri = ! (JEFRi) ->
	JEFRi.load \entityContext.json

angular.module \modeler
	.run [\JEFRi, jefri]
