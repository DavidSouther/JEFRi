$(document).ready(function(){

var sample1 = '{"meta":{}, "entities":[{	"name": "User", "key": "user_id", "properties": [{	"name": "user_id", "type": "int", "attributes": {"primary": "true"}}, {	"name": "name", "type": "string", "attributes": {}}, {	"name": "address", "type": "string", "attributes": {"unique": "true"}}], "relationships": [{	"name": "authinfo", "type": "has_a", "to": {"type": "Authinfo", "property": "user_id", "vname": "user"}, "from": {"type": "User", "property": "user_id", "vname": "user"}}], "attributes": {"vname": "users", "svname": "user"}}, {	"name": "Authinfo", "key": "authinfo_id", "properties": [{	"name": "authinfo_id", "type": "int", "attributes": {"primary": "true"}}, {	"name": "user_id", "type": "int", "attributes": {}}, {	"name": "username", "type": "string", "attributes": {"length": "45"}}, {	"name": "password", "type": "string", "attributes": {"length": "45"}}, {	"name": "activated", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "banned", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "ban_reason", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "new_password_key", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "new_password_requested", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "new_email", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "new_email_key", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "last_ip", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "last_login", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "created", "type": "string", "attributes": {"nullable": "true", "length": "45"}}, {	"name": "modified", "type": "string", "attributes": {"nullable": "true", "length": "45"}}], "relationships": [{	"name": "user", "type": "has_a", "to": {"type": "User", "property": "user_id", "vname": "user"}, "from": {"type": "Authinfo", "property": "user_id", "vname": "user"}}], "attributes": {"vname": "authinfo", "svname": "authinfo"}}]}';

var sample2 = '[{"hostname":"Plato","ip":"192.168.0.1","mac":"00:01"},{"hostname":"Kant","ip":"192.168.0.2","mac":"00:02"}]';

module("Entity Context");

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

test("Basic requirements", function() {
	expect(1);
	ok( JEFRi.Divine.JSON, "JSON Parser is missing." );
});

test("Divine flat JSON", function(){
	var context = JEFRi.Divine.JSON(sample2);
	ok(context, "Loaded context.");
	ok(context.meta, "Context has meta.");
	ok(context.entities, "Context has entities.");
	ok(context.entities.length === 1, "Found 1 entity");
	var entity = context.entities[0];
	ok(entity.name, "Entity got a name.");
	ok(entity.properties.length === 3, "Entity has 3 properties.");
	var property = entity.properties[0];
	ok(property.name, "Property got a name.");
	console.log(context, window.JSON.stringify(context));
	var runtime = new JEFRi.EntityContext(null, {debug: {context:context}});
	ok(runtime, "Successfully started with the generated context.");
	ok(runtime._context.entities.Field_1.properties.hostname, "Runtime found context.");
});

test("Divine EntityContext Context", function() {
	var context = JEFRi.Divine.JSON(sample1);
	ok(context, "Loaded context.");
	ok(context.entities, "Context has entities.");
	ok(context.meta, "Context has meta.");
	var meta = false;
	for(var i=0; i<context.entities.length; i++){
		meta = meta || context.entities[i].name === "meta";
	}
	ok(meta, "Expected meta as an entity of a context.");
});

});
