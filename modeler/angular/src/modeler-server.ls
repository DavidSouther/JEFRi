require! { server: "jefri-server", express }

server.get '/', !(req, res)->
	res.sendfile "build/index.html"

server.use '/', express.static 'build/'

server.listen 3000