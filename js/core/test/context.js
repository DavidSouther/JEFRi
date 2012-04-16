$(document).ready(function(){

module("Entity Context");

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

test("Basic requirements", function() {
	expect(1);
	ok( JEFRi.EntityContext, "EntityContext is missing." );
});

test("Load context and Data", function() {
	var context = new JEFRi.EntityContext("testContext.json", {storeURI: "/test/"});
	ok(context, "Could not load context.");
	ok(!!context.definition('Authinfo') && !!context.definition('User'), "Context has the correct entities.");

	var user = context.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
	equal(user._status(), "NEW", "Built user should be New");
	ok(user.id().match(/[a-f0-9\-]{36}/i), "User should have a valid id.");
	equal(user.id(), user.user_id(), "User id() and user_id properties must match.");

	var authinfo = user.set_authinfo(context.build('Authinfo', {})).get_authinfo();
	equal(authinfo._status(), "NEW", "Built authinfo should be New");
	ok(authinfo.id().match(/[a-f0-9\-]{36}/i), "Authinfo should have a valid id.");
	equal(authinfo.user_id(), user.id(), "Authinfo refers to correct user.");
	context.save_new();

	var transaction = context.transaction([]);
	transaction.get();
});

});
