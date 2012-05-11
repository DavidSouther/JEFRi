$(document).ready(function(){

var testDone = (function(){
	var tests = 3;
	return function(){
		test--;
		if(test <= 0){

		}
	};
});

module("Entity Context", {
	teardown: function(){
		testDone();
	}
});

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

test("Runtime Prototype", function() {
	ok(JEFRi.Runtime, "JEFRi Runtime is available.");
	var runtime = new JEFRi.Runtime();
	ok(runtime.definition, "JEFRi.Runtime::definition");
	ok(runtime.build, "JEFRi.Runtime::build");
	ok(runtime.intern, "JEFRi.Runtime::intern");
	ok(runtime.expand, "JEFRi.Runtime::expand");
	ok(runtime.save_new, "JEFRi.Runtime::save_new");
	ok(runtime.save_all, "JEFRi.Runtime::save_all");
});

asyncTest("Instantiate Runtime", function() {
	var runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
	runtime.ready.done(function(){
		ok(runtime, "Could not load runtime.");
		ok(!!runtime.definition('Authinfo') && !!runtime.definition('User'), "Runtime has the correct entities.");

		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		equal(user._status(), "NEW", "Built user should be New");
		ok(user.id().match(/[a-f0-9\-]{36}/i), "User should have a valid id.");
		equal(user.id(), user.user_id(), "User id() and user_id properties must match.");

		var authinfo = user.set_authinfo(runtime.build('Authinfo', {})).get_authinfo();
		equal(authinfo._status(), "NEW", "Built authinfo should be New");
		ok(authinfo.id().match(/[a-f0-9\-]{36}/i), "Authinfo should have a valid id.");
		equal(authinfo.user_id(), user.id(), "Authinfo refers to correct user.");

		start();
	});
});

test("Transaction Prototype", function(){
	ok(JEFRi.Transaction, "JEFRi Transaction is available.");
	var t = new JEFRi.Transaction();
	ok(t, "Created Transaction");
	ok(t.add, "JEFRi.Transaction::add");
	ok(t.attributes, "JEFRi.Transaction::attributes");
	ok(t.get, "JEFRi.Transaction::get");
	ok(t.persist, "JEFRi.Transaction::persist");
});

});
