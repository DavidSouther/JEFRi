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

asyncTest("Render page", function (){
	var runtime = new JEFRi.Runtime("pageContext.json", {storeURI: "/test/"});
	var init = JEFRi.Template.init({
		templates: ["../src/template.html"]
	});
	_.when(runtime.ready, init).done(function(){
		var context = runtime.build("Context");
		var hostsEntity = runtime.build("Entity", {"name": "Host", "key": "host_id"});
		context.entities(hostsEntity);

		var properties = [];
		properties.push(runtime.build("Property", {"name": "host_id", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "hostname", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "ip", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "mac", "type": "string"}));
		hostsEntity.properties(properties);
		
		var view = JEFRi.Template.render(context);
		$("#templates-target").append(view);

		ok(1);
		start();
	});
});

}(jQuery));
