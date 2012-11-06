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

app.get '/', !(req, res)->
	res.write runtime.toString!

app.post '/load', !(req, res)->
	runtime.load req.body.context

app.post '/get', !(req, res)->
	transaction = runtime.transcation!
	transcation.add req.body
	transaction.get!then !(gotten)->
		req.write gotten.encode!

jefri_server = 
	serve: !->
		app.listen 3000


if require.main is module
	jefri_server.serve!
