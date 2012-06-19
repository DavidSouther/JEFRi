 /*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/

_jQuery(document).ready(function(){

	module("Local Storage", {
		setup: function(){
			// Clear localStorage
			for(o in localStorage){delete localStorage[o]};

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
				ok(transaction.entities && transaction.attributes, "Transaction entities and attributes.");
				ok(transaction.entities.length == 2, "Transaction should only have 2 entities.");
				ok(_.keys(transaction.entities[0]).length == 6, "Entity has unexpected keys.");
				// This is a really bad assertion...
				ok(_.symmetricDifference(_.keys(transaction.entities[0]._fields), ["user_id", "name", "address"]).length === 0, "Entity has unexpected fields.");
				start();
			});
		});
	});

	var users = [
		["David Souther", "davidsouther@gmail.com", {username: "southerd", activated: "true", created: new Date(2011, 01, 15, 15, 34, 5).toJSON(), last_ip: "192.168.2.79"}],
		["JPorta", "jporta@example.com", {username: "portaj", activated: "true", created: new Date(2012, 01, 15, 15, 34, 5).toJSON(), last_ip: "192.168.2.80"}],
		["Niemants", "andrew@example.com", {username: "andrew", activated: "false", created: new Date(2012, 01, 17, 15, 34, 5).toJSON(), last_ip: "80.234.2.79"}]
	];

	asyncTest("LocalStore", function(){
		runtime.ready.done(function(){
			var _i;
			for(_i=0; _i<users.length; _i++){
				var user = runtime.build("User", {name: users[_i][0], address: users[_i][1]});
				var authinfo = runtime.build("Authinfo", _.extend({authinfo_id: user.id()}, users[_i][2]));
				user.authinfo(authinfo);
			}
			runtime.save_new().then(function(){
				runtime.get({_type: "User"}).then(function(results){
					equal(results.User.length, 3, "Find users.");
					start();
				});
			});
		});
	});

});