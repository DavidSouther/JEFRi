Short = ->
	(id)->
		"(#{id.substring 0, 8})"

angular.module \modeler
	.filter \shortId, Short
