describe \Directive, !->
	beforeEach module \modeler

	describe \entity, !(a)->
		it 'Should have a name', !->
			inject !($compile, $rootScope)->
				$rootScope.entity =
					name: -> \Host,
					key: -> \host_id,
					properties: -> 
						[ {name: \host_id, type: \String },
						{ name: \mac, type: \String }]

				# element = $compile('<entity></entity>')($rootScope)