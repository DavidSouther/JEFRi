angular.module \modeler, <[ jefri jquery jsPlumb ui ]>

modeler = !(JEFRi, model) ->
	JEFRi.load "entityContext.json" .then !->
		model.load!

angular.module \modeler
	.run [\JEFRi, \Model, modeler]
