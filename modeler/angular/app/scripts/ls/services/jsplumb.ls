JSPlumb = ($)->
	color = \gray
	arrowCommon = 
		foldback:0.7
		fillStyle:color, width:14
	arrows = [[ \Arrow, { location:0.7 }, arrowCommon ]]

	plumb = jsPlumb.getInstance(
		Connector : [ \FlowChart ]
		DragOptions : { cursor: \pointer, zIndex:2000 }
		ConnectorZIndex: 5
		PaintStyle : { strokeStyle:color, lineWidth:2 }
		EndpointStyle : { radius:9, fillStyle:color }
		HoverPaintStyle : {strokeStyle:\#ec9f2e }
		EndpointHoverStyle : {fillStyle:\#ec9f2e }
		Anchors :  [ \RightMiddle, \LeftMiddle ]
		Container: $ \.context:first
		RenderMode: \svg
	)

	connect = !(a, b)->
		plumb.connect {source: a, target: b, overlays: arrows}
		draggable a, b
	draggable = !(...)->
		for node in &
			plumb.draggable node

	connect: connect
	draggable: draggable

angular.module \jsPlumb, [\jquery]
	.factory \JSPlumb, [\jQuery, JSPlumb]