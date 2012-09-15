let $=jQuery
	JEFRi.Template.rendered.entity :> ([entity, $render]) ->
		definition = entity._definition!
		for field, property of definition.properties
			behaviors.editField entity, field, property, $render

	behaviors =
		editField: !(entity, field, property, $parent) ->
			$view = $parent.find ".#{entity._type!}._property.#{field}:first"
			$edit = null

			blur = !(e) ->
				newValue = $edit.find('input').val!;
				entity[field](newValue)
				$view = JEFRi.Template.render.property(entity._type!, field, newValue, 'view')
				$edit.replaceWith $view
				$view.click click

			$view.click click = !(e) ->
				$edit := JEFRi.Template.render.property(entity._type!, field, entity[field]!, 'edit')
				$view.replaceWith $edit
				$input = $edit.find('input')
				$input.blur blur
				$input.focus!
