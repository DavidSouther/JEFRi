/*
 * jefri-server
 * https://github.com/DavidSouther/JEFRi
 *
 * Copyright (c) 2012 David Souther
 * Licensed under the MIT license.
 */

require! { express, jefri, filestore }

runtime = new jefri.Runtime "", store: jefri.FileStore

app = express!

app.use express.bodyParser!

app.use !(req, res, next)->
	console.log "#{req.method} #{req.url}"
	next!

app.get '/', !(req, res)->
	res.send "Hello\n"

app.post '/load', !(req, res)->
	runtime.load req.body.context
	runtime.ready.then !->
		res.send "Loaded #{req.body.context}\n"

app.post '/get', !(req, res)->
	transaction = runtime.transaction!
	transaction.add req.body.entities
	transaction.get!then !(gotten)->
		res.send gotten.toString! + \\n

app.post '/persist', !(req, res)->
	transaction = runtime.transaction!
	transaction.add req.body.entities
	transaction.persist!then !(gotten)->
		res.send gotten.toString! + \\n

jefri_server = 
	serve: !->
		console.log \Listening
		app.listen 3000


if require.main is module
	jefri_server.serve!
