angular.module \jefri, []
	.factory \JEFRi, ->
		new JEFRi.Runtime "entityContext.json"
