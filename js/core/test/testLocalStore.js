/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/

_jQuery(document).ready(function(){

	module("Local Storage", {
		setup: function(){
			// Global in testing environment.
			runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
		}
	});

	test("Unit Testing Environment", function(){
		expect(1);
		ok (!isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!");
	});

	asyncTest("LocalStore minimal save", function(){
		runtime.ready.done( function(){
			user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
			authinfo = user.authinfo(runtime.build('Authinfo', {})).authinfo();

			store = new JEFRi.LocalStore();
			runtime.save_new(store).then(function(transaction){
				ok(_.symmetricDifference(_.keys(transaction), ["entities", "attributes"]).length === 0, "Transaction has unknown keys.");
				ok(transaction.entities.length == 2, "Transaction should only have 2 entities.");
				ok(_.keys(transaction.entities[0]).length == 6, "Entity has unexpected keys.");
				// This is a really bad assertion...
				ok(_.symmetricDifference(_.keys(transaction.entities[0]._fields), ["user_id", "name", "address"]).length === 0, "Entity has unexpected fields.");
				start();
			});
		});
	});

	asyncTest("LocalStore", function(){
		runtime.ready.done(function(){
			start();
		});
	});

});