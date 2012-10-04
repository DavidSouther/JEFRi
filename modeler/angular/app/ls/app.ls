
# Declare app level module which depends on filters, and services
angular.module \modeler, <[ jefri jquery ]>

routes = ! ($rp) ->
	$rp
		.when \/Context, templateUrl: 'partials/context.html', controller: \Context
		.when \/Entity,  templateUrl: 'partials/entity.html',  controller: \Entity
		.otherwise redirectTo: '/Entity'

jefri = ! (JEFRi) ->
	JEFRi.load \entityContext.json

angular.module \modeler
	.config [\$routeProvider, routes]
	.run [\JEFRi, jefri]
