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
	var runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
	var init = JEFRi.Template.init({
		templates: ["../src/template.html"]
	});
	_.when(runtime.ready, init).done(function(){
		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		var view = JEFRi.Template.render(user);
		view.appendTo("#templates-target");
		view.find(".User._property.name").click();
		var input = view.find(".User._property.name input");
		ok(input.length, 'Click replaced with input');
		input = input.first();
		equal(input.val(), "southerd", "Edit field has default value.");
		// This is really hard to test.
		//ok(view.find(".User._property.name input:focus").length, "Name field has focus");
		start();
	});
});

}(jQuery));
