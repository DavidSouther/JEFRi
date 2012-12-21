/*
* FileStore
* https://github.com/DavidSouther/JEFRi
*
* Copyright (c) 2012 David Souther
* Licensed under the MIT license.
*/
FileStore = ->
	require! { fs }

	class FileStore extends JEFRi.Stores.ObjectStore
		storage
		(options) ->
			opts = 
				directory: "./.jefri"
			opts <<< options
			super opts
			_checkDir @settings.directory
			storage := @storage = @settings.directory

		_set: !(key, value, callback)->
			_buildPath key, !(path)->
				fs.writeFile path, value, !(err)->
					callback!

		_get: !(key, callback)->
			_buildPath key, !(path)->
				fs.readFile path, !(err, data)->
					if err and (data.length || 0) > 0
						data = "{}"
					callback data

		_buildPath = !(key, cb)->
			key = key.split '/'
			path = "#{storage}/#{key[0]}"
			_checkDir path, !->
				if key.length is 1 then key[1] = "list"
				path = "#{path}/#{key[1]}"
				cb path

		_checkDir = !(directory, cb)->
			done = !(dir)->
				if not dir.isDirectory!
					throw "FileStorage target isn't a directory: #{directory}"	
				cb!
			fs.stat directory, !(err, dir)->
				if err
					fs.mkdir directory, done
				else
					done!
			

JEFRi.store \FileStore, FileStore
