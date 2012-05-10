$(document).ready(function(){

// module("Entity Context", {
// 	teardown: function(){
// 		testDone();
// 	}
// });

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

asyncTest("Context", function() {
	runtime = new JEFRi.Runtime("/context.json");
	runtime.ready.done(function(){
		ok(runtime._context.entities, "Has entities.");
		context = runtime.build("Context", {});
		hostsEntity = runtime.build("Entity", {"name": "Host", "key": "host_id"});
		context.add_entities(hostsEntity);
		start();
	});
});

});
