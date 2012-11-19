JSPlumb = ($)->
	color = \gray
	arrowCommon = 
		foldback:0.7
		fillStyle:color, width:14
	arrows = [[ \Arrow, { location:0.7 }, arrowCommon ]]

	plumbStyles =
		Connector : [ \Flowchart ]
		DragOptions : { cursor: \pointer, zIndex:2000 }
		ConnectorZIndex: 5
		PaintStyle : { strokeStyle:color, lineWidth:2 }
		EndpointStyle : { radius:9, fillStyle:color }
		HoverPaintStyle : {strokeStyle:\#ec9f2e }
		EndpointHoverStyle : {fillStyle:\#ec9f2e }
		Anchors :  [ \RightMiddle, \LeftMiddle ]
		Container: $ \.context:first
		RenderMode: \svg

	plumb = jsPlumb.getInstance plumbStyles

	connections = []

	connect = !(a, b)->
		connections.push plumb.connect {source: a, target: b, overlays: arrows}

	draggable = !(...)->
		for node in &
			plumb.draggable node

	startDrag = !->
		for connection in connections
			connection.setHoverPaintStyle plumbStyles.PaintStyle
			for endpoint in connection.endpoints
				endpoint.setHoverPaintStyle plumbStyles.EndpointStyle

	doDrag = !->
		for connection in connections
			connection.setHover true, false
			connection.setHover false, false

	stopDrag = !->
		for connection in connections
			connection.setHoverPaintStyle plumbStyles.HoverPaintStyle
			for endpoint in connection.endpoints
				endpoint.setHoverPaintStyle plumbStyles.EndpointHoverStyle

	connect: connect
	draggable: draggable
	drag:
		start: startDrag
		drag: doDrag
		stop: stopDrag

angular.module \jsPlumb, [\jquery]
	.factory \JSPlumb, [\jQuery, JSPlumb]