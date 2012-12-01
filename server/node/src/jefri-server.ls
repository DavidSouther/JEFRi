/*
 * jefri-server
 * https://github.com/DavidSouther/JEFRi
 *
 * Copyright (c) 2012 David Souther
 * Licensed under the MIT license.
 */

require! { express, 'jefri-stores' }

runtime = new JEFRi.Runtime ""
store = new JEFRi.Stores.FileStore runtime: runtime

app = express!

app.use express.bodyParser!

app.use !(req, res, next)->
	console.log "#{req.method} #{req.url}"
	next!

app.post '/load', !(req, res)->
	runtime.load req.body.context
	runtime.ready.then !->
		res.jsonp {loaded: req.body.context}

app.post '/get', !(req, res)->
	transaction = new JEFRi.Transaction!
	transaction.add req.body.entities
	store.get transaction .then !(gotten)->
		res.jsonp gotten

app.post '/persist', !(req, res)->
	transaction = new JEFRi.Transaction!
	transaction.add req.body.entities, true
	store.persist transaction .then !(gotten)->
		res.jsonp gotten

jefri_server = 
	serve: !->
		console.log \Listening
		app.listen 3000

if require.main is module
	jefri_server.serve!
else
	module.exports = app
