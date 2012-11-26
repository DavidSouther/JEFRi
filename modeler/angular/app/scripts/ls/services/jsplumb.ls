JSPlumb = ($)->
	color = \gray
	hoverColor = \#ec9f2e
	arrowCommon = 
		foldback: 0.7
		fillStyle: color
		width: 14
	arrows = [ \Arrow, { location: 0.2 }, arrowCommon ]

	plumbStyles =
		Connector : [ \Flowchart ]
		ConnectorZIndex: -5
		PaintStyle : { strokeStyle: color, lineWidth:2 }
		EndpointStyle : { radius:9, fillStyle: color }
		HoverPaintStyle : { strokeStyle: hoverColor }
		EndpointHoverStyle : { fillStyle: hoverColor }
		Anchors :  [ \RightMiddle, \LeftMiddle ]
		Container: $ \.context:first
		RenderMode: \svg

	plumb = jsPlumb.getInstance plumbStyles

	connections = []

	connect = (a, b, label)->
		overlays = [arrows]
		if label
			overlays .push [ \Label, {label: label, location: 0.1}]
		connection = plumb.connect do
			source: a
			target: b
			overlays: overlays
		connections.push connection
		connection

	detach = !(conn)->
		plumb.detach conn
		if (t = connections.indexOf conn) > -1
			connections[t to t] = []

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
	detach: detach
	draggable: draggable
	drag:
		start: startDrag
		drag: doDrag
		stop: stopDrag

angular.module \jsPlumb, [\jquery]
	.factory \JSPlumb, [\jQuery, JSPlumb]