$(document).ready(function(){
	var ruuid = /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}/;

	module("JEFRi");

	test("UUID", function() {
		expect(2);
		ok(UUID, "UUID Function global");
		ok(UUID().match(ruuid), "Valid v4 UUID");
	});

	test("Array extensions", function(){
		expect(2);
		ok([].contains, "Array has contains method");
		ok([].remove, "Array has remove method");
	});

	test("Basic definitions", function(){
		expect(5);
		ok(JEFRi, "JEFRi");
		ok(JEFRi.EntityComparator, "Entitycomparator");
		ok(JEFRi.EntityContext, "EntityContext");
		ok(JEFRi.Transaction, "Transaction");
		ok(JEFRi.PostStore, "PostStore");
	});

	test("EntityContext API", function(){
		//Need a good testing contextUri...
		var context = ROOT + "static/assets/context.json";
		var ec = new JEFRi.EntityContext(context);
	});
});
