/*
* FileStore
* https://github.com/DavidSouther/JEFRi
*
* Copyright (c) 2012 David Souther
* Licensed under the MIT license.
*/

class FileStore
	(options) ->
		@settings = { version: "1.0", size: Math.pow(2, 16) }
		_.extend @settings, options
		if not @settings.runtime
			throw {message: "FileStore instantiated without runtime to reference."}

	awesome: ->
		'awesome'

JEFRi.FileStore = FileStore
