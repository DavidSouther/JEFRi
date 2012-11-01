# global QUnit:false, module:false, test:false, asyncTest:false, expect:false
# global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false
# global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false

_jQuery document .ready !->
	runtime = null
	module do
		"Transaction"
		setup: !->
			runtime := new JEFRi.Runtime do
				"/test/qunit/min/context/user.json"
				storeURI: "/test/"

	asyncTest "Transaction Basics", !->
		expect 1
		runtime.ready.done !->
			user = runtime.build "User", {name: "southerd", address: "davidsouther@gmail.com"}
			user.authinfo runtime.build 'Authinfo', {}
			authinfo = user.authinfo!

			transaction = runtime.transaction!
			transaction.add runtime._new

			equal transaction.entities.length, 2, "Has both entities."
			start!
