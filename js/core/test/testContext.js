/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global jQuery:false, JEFRi:false, isLocal:false*/

(function($){

module("Contexts");

asyncTest("Context", function() {
	var runtime = new JEFRi.Runtime("../context.json");
	runtime.ready.done(function(){
		ok(runtime._context.entities, "Has entities.");

		var context = runtime.build("Context", {});
		var id = context.id();
		var hostsEntity = runtime.build("Entity", {"name": "Host", "key": "host_id"});
		context.entities(hostsEntity);
		equal(context.id(), id, "ID not overwritten on entity set.");

		var ct = runtime.find("Context")[0];
		equal(ct.entities()[0].context().id(), ct.id(), "Navigating relationships succeeded.");

		var properties = [];
		properties.push(runtime.build("Property", {"name": "host_id", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "hostname", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "ip", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "mac", "type": "string"}));

		hostsEntity.properties(properties);

		ok(hostsEntity.properties().length === 4, "4 properties added.");

		start();
	});
});

}(jQuery));
