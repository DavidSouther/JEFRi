angular.module \jquery, []
	.factory \jQuery, ->
		jQuery.noConflict!
		jQuery.template = (tplSel)->
			jQuery "\#templates #tplSel" .html!
		jQuery
