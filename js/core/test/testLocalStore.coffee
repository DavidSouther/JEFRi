#global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
#global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false
#global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false

$(document).ready( ->

	_.symmetricDifference = ->
		_.reduce(arguments, (first, second) ->
			_.union(
				_.difference(first, second),
				_.difference(second, first)
			);
		);

	test("Unit Testing Environment", ->
		expect 1
		ok !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!"
	)

	asyncTest("LocalStore", ->
		runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
		runtime.ready.done( ->
			user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
			authinfo = user.authinfo(runtime.build('Authinfo', {})).authinfo();

			store = new JEFRi.LocalStore
			runtime.save_new(store).then((transaction)->
				ok(_.symmetricDifference(_.keys(transaction), ["entities", "attributes"]).length == 0, "Transaction has unknown keys.");
				ok(transaction.entities.length == 2, "Transaction should only have 2 entities.");
				ok(_.keys(transaction.entities[0]).length == 5, "Entity has unexpected keys.")
				ok(_.symmetricDifference(_.keys(transaction.entities[0].__fields), ["_user_id", "_name", "_address"]).length == 0, "Entity has unexpected fields.");
				start();
			)
		)
	)
)