/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global isLocal:false*/

(function($){

module("Templating");

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

asyncTest("Binding", function (){
	ok(JEFRi.Binding, "JEFRi Binding never defined.");
	ok(JEFRi.Binding.init, "Can't initialize JEFRi Binding.");
	JEFRi.Binding.init({
		templates: ["../src/binding.html", "./testBindings.html"]
	}).done(function(){
		ok(JEFRi.Binding.templates, "Templates not ready.");
		ok(JEFRi.Binding.templates().find("#_default_theme").length, "Templates didn't load.");
		ok(JEFRi.Binding.find, "Can't use binding template finder.");
		ok(JEFRi.Binding.find("JEFRi").length, "Can't find system root.");
		ok(JEFRi.Binding.find(".").length, "Can't find default theme.");
		ok(JEFRi.Binding.find(".MISSING_THEME").length, "Can't find default theme for missing theme.");
		ok(JEFRi.Binding.find("..User").length, "Can't find default entity.");
		ok(JEFRi.Binding.find("..User.?").length, "Can't find entity view.");
		ok(JEFRi.Binding.find("..User..list").length, "Can't find property view.");
		ok(JEFRi.Binding.find("..User.MISSINGPROPERTY.list").length, "Can't find missing property view.");
		start();
	});
});

asyncTest("Templating", function (){
	var runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
	var init = JEFRi.Binding.init({
		templates: ["../src/binding.html", "./testBindings.html"]
	});
	_.when(runtime.ready, init).done(function(){
		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		var view = JEFRi.Binding.render(user);
		ok(view.length, "Render basic view.");
		ok(view.find("._property.name b").length === 1, "B for name in _defualt_property.");
		ok(view.find("._property.user_id em").length === 1, "EM override in user_id property.");
		ok(view.find(".relationships ._entity").length === 1, "User has one relationship.");
		view.appendTo("#bindings-target");
		start();
	});
});

}(jQuery));
