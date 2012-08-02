do (_=_, $ = jQuery || null, JEFRi = JEFRi) ->
	JEFRi.Template.rendered.entity :> ([entity, $render]) ->
		definition = entity._definition()
		for field, property of definition.properties
			behaviors.editField entity, field, property, $render

	behaviors =
		editField: (entity, field, property, $parent) ->
			$view = $parent.find(".#{entity._type()}._property.#{field}:first")
			$edit = JEFRi.Template.render.property(entity._type(), field, entity[field](), 'edit')

			$edit.find('input').blur blur = (e) ->
				$edit.replaceWith $view
				$view.click click
				null

			$view.click click = (e) ->
				$view.replaceWith $edit
				$input = $edit.find('input')
				$input.blur blur
				$input.focus()
				null


			null
	null