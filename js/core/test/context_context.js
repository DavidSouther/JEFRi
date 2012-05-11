$(document).ready(function(){

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

asyncTest("Context", function() {
	var runtime = new JEFRi.Runtime("/context.json");
	runtime.ready.done(function(){
		ok(runtime._context.entities, "Has entities.");

		var context = runtime.build("Context", {});
		var hostsEntity = runtime.build("Entity", {"name": "Host", "key": "host_id"});
		context.add_entities(hostsEntity);

		var ct = runtime.find("Context")[0];
		ok(ct.get_entities()[0].get_context().id() === ct.id(), "Navigating relationships succeeded.");

		var properties = [];
		properties.push(runtime.build("Property", {"name": "host_id", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "hostname", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "ip", "type": "string"}));
		properties.push(runtime.build("Property", {"name": "mac", "type": "string"}));

		hostsEntity.add_properties(properties);

		ok(hostsEntity.get_properties().length === 4, "4 properties added.");

		start();
	});
});

});
