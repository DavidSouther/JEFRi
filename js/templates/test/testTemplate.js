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

asyncTest("Template", function (){
	ok(JEFRi.Template, "JEFRi Template definition.");
	ok(JEFRi.Template.init, "Initialize JEFRi Template.");
	JEFRi.Template.init({
		templates: ["../src/template.html", "./testTemplates.html"]
	}).done(function(){
		ok(JEFRi.Template.templates, "Templates ready.");
		ok(JEFRi.Template.templates().find("#_default_theme").length, "Template load.");
		ok(JEFRi.Template.find, "Template template finder.");
		ok(JEFRi.Template.find("JEFRi").length, "Find system root.");
		ok(JEFRi.Template.find(".").length, "Find default theme.");
		ok(JEFRi.Template.find(".MISSING_THEME").length, "Find default theme for missing theme.");
		ok(JEFRi.Template.find("..User").length, "Find default entity.");
		ok(JEFRi.Template.find("..User.?").length, "Find entity view.");
		ok(JEFRi.Template.find("..User..list").length, "Find property view.");
		ok(JEFRi.Template.find("..User.MISSINGPROPERTY.list").length, "Find missing property view.");
		start();
	});
});

asyncTest("Templating", function (){
	var runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
	var init = JEFRi.Template.init({
		templates: ["../src/template.html", "./testTemplates.html"]
	});
	_.when(runtime.ready, init).done(function(){
		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		var view = JEFRi.Template.render(user);
		view.appendTo("#templates-target");
		ok(view.length, "Render basic view.");
		ok(view.find("._property.name b").length === 1, "B for name in _defualt_property.");
		equal(view.find("._property.name b").text(), "name", "Name in _defualt_property has right value.");
		ok(view.find("._property.user_id em").length === 1, "EM override in user_id property.");
		ok(view.find(".relationships ._entity").length === 1, "User has one relationship.");
		start();
	});
});

}(jQuery));
