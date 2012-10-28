userContext = {"attributes":{},
"entities":{
	"User": {
		"key": "user_id",
		"properties": {
			"user_id": {
				"type": "int",
				"attributes": {
					"primary": "true"}},
			"name": {
				"type": "string",
				"attributes": {}},
			"address": {
				"type": "string",
				"attributes": {
					"unique": "true"}}},
		"relationships": {
			"authinfo": {
				"type": "has_a",
				"property": "user_id",
				"to": {
					"type": "Authinfo",
					"property": "user_id"},
				"back": "user"}},
		"attributes": {
			"vname": "users"}},

	"Authinfo": {
		"key": "authinfo_id",
		"properties": {
			"authinfo_id": {
				"type": "int",
				"attributes": {
					"primary": "true"}},
			"user_id": {
				"type": "int",
				"attributes": {}},
			"username": {
				"type": "string",
				"attributes": {
					"length": "45"}},
			"password": {
				"type": "string",
				"attributes": {
					"length": "45"}},
			"activated": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"banned": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"ban_reason": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"new_password_key": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"new_password_requested": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"new_email": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"new_email_key": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"last_ip": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"last_login": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"created": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}},
			"modified": {
				"type": "string",
				"attributes": {
					"nullable": "true",
					"length": "45"}}},
		"relationships": {
			"user": {
				"type": "has_a",
				"property": "user_id",
				"to": {
					"type": "User",
					"property": "user_id"},
				"back": "authinfo"}}}}};

jefriContext = {	"attributes": {},
	"entities": {
		"Context": {
			"key": "context_id",
			"properties": {
				"context_id": {
					"type": "string"
				}
			},
			"relationships": {
				"entities": {
					"type": "has_many",
					"property": "context_id",
					"to": {
						"type": "Entity",
						"property": "context_id"
					},
					"back": "context"
				}
			}
		},
		"Entity": {
			"key": "entity_id",
			"properties": {
				"entity_id": {
					"type": "string"
				},
				"context_id": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"key": {
					"type": "string"
				}
			},
			"relationships": {
				"context": {
					"type": "has_a",
					"property": "context_id",
					"to": {
						"type": "Context",
						"property": "context_id"
					},
					"back": "entities"
				},
				"properties": {
					"type": "has_many",
					"property": "entity_id",
					"to": {
						"type": "Property",
						"property": "entity_id"
					},
					"back": "entity"
				},
				"relationships": {
					"type": "has_many",
					"property": "entity_id",
					"to": {
						"type": "Relationship",
						"property": "to_id"
					},
					"back": "from"
				}
			}
		},
		"Property": {
			"key": "property_id",
			"properties": {
				"property_id": {
					"type": "string"
				},
				"entity_id": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"type": {
					"type": "string"
				}
			},
			"relationships": {
				"entity": {
					"type": "has_a",
					"property": "entity_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					},
					"back": "properties"
				}
			}
		},
		"Relationship": {
			"key": "relationship_id",
			"properties": {
				"relationship_id": {
					"type": "string"
				},
				"to_id": {
					"type": "string"
				},
				"to_property": {
					"type": "string"
				},
				"from_id": {
					"type": "string"
				},
				"from_property": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"type": {
					"type": "string"
				}
			},
			"relationships": {
				"to": {
					"type": "has_a",
					"property": "to_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					}
				},
				"from": {
					"type": "has_a",
					"property": "from_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					},
					"back": "relationships"
				}
			},
			"methods": {
				"normalize": {
					"definitions": {
						"javascript": "var this$=this;\nthis._runtime.get_first({'_type': 'Entity', 'entity_id': this.to_id()}).then(\n\tfunction(found){\n\t\tthis$.to(found);\n\t}\n);"
					}
				}
			}
		}
	}
};

/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global jQuery:false, JEFRi:false, isLocal:false*/

var testDone = function(){
	var tests = 3;
	return function(){
		test--;
		if(test <= 0){

		}
	};
};

module("JEFRi Runtime", {
	teardown: function(){
		testDone();
	}
});

test("Underscore utils", function(){
	ok(_.on && _.once && _.off && _.trigger, "Underscore has additional pubsub?");
});

test("Runtime Prototype", function() {
	ok(JEFRi.Runtime, "JEFRi Runtime is available.");
	var runtime = new JEFRi.Runtime({debug: {context: {}}});
	ok(runtime.definition, "JEFRi.Runtime::definition");
	ok(runtime.build, "JEFRi.Runtime::build");
	ok(runtime.intern, "JEFRi.Runtime::intern");
	ok(runtime.expand, "JEFRi.Runtime::expand");
	ok(runtime.save_new, "JEFRi.Runtime::save_new");
	ok(runtime.save_all, "JEFRi.Runtime::save_all");
});

asyncTest("Instantiate Runtime", function() {
	var runtime = new JEFRi.Runtime({debug:{context: userContext}, storeURI: "/test/"});
	runtime.ready.done(function(){
		ok(runtime, "Could not load runtime.");
		ok(!!runtime.definition('Authinfo') && !!runtime.definition('User'), "Runtime has the correct entities.");

		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		var id = user.id();
		equal(user._status(), "NEW", "Built user should be New");
		ok(user.id().match(/[a-f0-9\-]{36}/i), "User should have a valid id.");
		equal(user.id(), user.user_id(), "User id() and user_id properties must match.");

		user.authinfo(runtime.build('Authinfo', {}));
		var authinfo = user.authinfo();
		equal(authinfo._status(), "NEW", "Built authinfo should be New");
		ok(authinfo.id().match(/[a-f0-9\-]{36}/i), "Authinfo should have a valid id.");
		ok(authinfo.id(true).match(/[a-zA-Z_\-]+\/[a-f0-9\-]{36}/i), "id(true) returns full path.");
		equal(authinfo.user_id(), user.id(), "Authinfo refers to correct user.");
		equal(id, user.id(), "ID not overwritten on entity set.");

		ok(authinfo._destroy, "Entity can be destroyed.");
		var aid = authinfo.id();
		authinfo._destroy();
		equal(authinfo.id(), 0, "ID zeroed.");
		equal(authinfo._relationships.user, null, "Relationship cleared.");
		equal(user._relationships.authinfo, null, "Remote relationship cleared.");
		equal(runtime._instances.Authinfo[aid], undefined, "Removed from runtime instances.");
		equal(runtime._new.length, 1, "Seemingly removed from runtime._new");


		var user2 = runtime.build("User", {name: "portaj", address: "rurd4me@example.com"});
		var authinfo2 = user2.authinfo();
		ok(authinfo2, "Default relationship created.");
		ok(authinfo2.id().match(/[a-f0-9\-]{36}/i), "Authinfo2 should have a valid id.");
		equal(authinfo2.user_id(), user2.id(), "Authinfo2 refers to correct user.");
		equal(authinfo2.user().id(), user2.id(), "Authinfo2 returns correct user.");
		user2.authinfo(null);
		equal(user2._relationships.authinfo, null, "User2 removed authinfo.");
		equal(authinfo2._relationships.user, null, "Authinfo2 removed user.");

		start();
	});
});

asyncTest("Runtime Features", function() {
	var runtime = new JEFRi.Runtime({debug:{context: userContext}, storeURI: "/test/"});
	runtime.ready.done(function(){
		var user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
		ok(user._runtime, "Entity has reference to creating runtime.");

		d1 = _.Deferred();
		runtime.get_first({_type: 'User', user_id: user.id()}).then(function(first){
			equal(first.id(), user.id(), "Got user by id using get_first.");
			d1.resolve();
		});

		_.when(d1).then(function(){
			start();
		});
	});
});

test("Transaction Prototype", function(){
	ok(JEFRi.Transaction, "JEFRi Transaction is available.");
	var t = new JEFRi.Transaction();
	ok(t, "Created Transaction");
	ok(t.add, "JEFRi.Transaction::add");
	ok(t.attributes, "JEFRi.Transaction::attributes");
	ok(t.get, "JEFRi.Transaction::get");
	ok(t.persist, "JEFRi.Transaction::persist");
});


asyncTest("Exceptional cases", function(){
	var runtime = new JEFRi.Runtime({debug:{context: userContext}, storeURI: "/test/"});
	runtime.ready.done(function(){
		ok(runtime, "Could not load runtime.");

		function badType(){
			var foo = runtime.build("foo");
		}
		checkBadTypeException = function(ex){
			if (ex.match && ex.match(/JEFRi::Runtime::build 'foo' is not a defined type in this context./)) {
				return true;
			}
			return false;
		}
		// checkBadTypeException = "JEFRi::runtime::build 'foo' is not a defined type in the context.";
		raises(badType, checkBadTypeException, "Create bad type generates exception.");

		start();
	});
});


/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global jQuery:false, JEFRi:false, isLocal:false*/

(function($){

module("Contexts");

asyncTest("Context", function() {
	var runtime = new JEFRi.Runtime({debug: {context: jefriContext}});
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

		equal(hostsEntity.properties().length, 4, "4 properties added.");

		var note = runtime.build("Property", {"name": "notes", "type": "string"});
		hostsEntity.properties(note);
		equal(hostsEntity.properties().length, 5, "5th property added.");
		note.entity(null);
		equal(hostsEntity.properties().length, 4, "5th property removed.");
		equal(note._relationships.entity, null, "Relationship removed.");
		equal(note.entity_id(), undefined, "Relationship key zeroed.");

		start();
	});
});

}(jQuery));

(function($){
	
	module("JEFRi Relationships");

	asyncTest("has_a/has_a set", function(){
		runtime = new JEFRi.Runtime("",
			{debug: {
				context: {
					entities: {
						Foo: {
							key: "foo_id",
							properties: {
								foo_id: {type: "string"},
								bar_id: {type: "string"}
							},
							relationships: {
								bar: {
									type: "has_a",
									property: "bar_id",
									to: {
										type: "Bar",
										property: "foo_id"
									},
									back: "foo"
								}
							}
						},
						Bar: {
							key: "bar_id",
							properties: {
								bar_id: {type: "string"},
								foo_id: {type: "string"}
							},
							relationships: {
								foo: {
									type: "has_a",
									property: "foo_id",
									to: {
										type: "Foo",
										property: "bar_id"
									},
									back: 'bar'
								}
							}
						}
					}
				}
			}}
		);

		runtime.ready.done(function(){
			ok(runtime._instances.Foo, "Runtime instantiated.");

			foo = runtime.build("Foo");
			fid = foo.id(true);
			bar = runtime.build("Bar");
			bid = bar.id(true);

			foo.bar(bar);

			equal(fid, foo.id(true), "Anchor kept id.");
			equal(bid, bar.id(true), "Related kept id.");

			equal(foo.bar_id(), bar.foo_id(), "Anchor rel prop is Related rel prop.");

			ok(foo._relationships.bar === bar, "Anchor points to correct related.");
			ok(bar._relationships.foo === foo, "Related points to correct anchor.");

			start();
		});
	});

	asyncTest("has_a/has_a (key relationship) set", function(){
		runtime = new JEFRi.Runtime("",
			{debug: {
				context: {
					entities: {
						Foo: {
							key: "foo_id",
							properties: {
								foo_id: {type: "string"}
							},
							relationships: {
								bar: {
									type: "has_a",
									property: "foo_id",
									to: {
										type: "Bar",
										property: "foo_id"
									},
									back: 'foo'
								}
							}
						},
						Bar: {
							key: "foo_id",
							properties: {
								foo_id: {type: "string"}
							},
							relationships: {
								foo: {
									type: "has_a",
									property: "foo_id",
									to: {
										type: "Foo",
										property: "foo_id"
									},
									back: 'bar'
								}
							}
						}
					}
				}
			}}
		);

		runtime.ready.done(function(){
			ok(runtime._instances.Foo, "Runtime instantiated.");

			var foo = runtime.build("Foo");
			fid = foo.id(true);
			var bar = runtime.build("Bar", {foo_id: foo.id()});
			bid = bar.id(true);

			foo.bar(bar);

			equal(fid, foo.id(true), "Anchor kept id.");
			equal(bid, bar.id(true), "Related kept id.");

			equal(foo.foo_id(), bar.foo_id(), "Anchor rel prop is Related rel prop.");

			ok(foo._relationships.bar === bar, "Anchor points to correct related.");
			ok(bar._relationships.foo === foo, "Related points to correct anchor.");

			start();
		});
	});
}(jQuery));

(function($){
	
	module("JEFRi Methods");

	asyncTest("Basic methods", function(){
		runtime = new JEFRi.Runtime("",
			{debug: {
				context: {
					entities: {
						Foo: {
							key: "foo_id",
							properties: {
								foo_id: {type: "string"},
								a: {type: "number"},
								b: {type: "number"}
							},
							methods: {
								hello: {
									return: "string",
									definitions: {
										"javascript": "return \"Hello World\";"
									}
								},
								sum: {
									return: "number",
									definitions: {
										"javascript": "return this.a() + this.b();"
									}
								},
								scale: {
									return: "number",
									params: {
										s: {
											type: "number"
										}
									},
									order: ["s"],
									definitions: {
										"javascript": "var a = this.a(); var r = a * s; return r;"
									}
								}
							}
						}
					}
				}
			}}
		);

		runtime.ready.done(function(){
			ok(runtime._instances.Foo, "Runtime instantiated.");

			foo = runtime.build("Foo", {a: 1, b: 2});
			equal("Hello World", foo.hello(), "hello returns string.");
			equal(3, foo.sum(), "Methods operate on local numbers.");
			equal(2, foo.scale(2), "Methods take parameters.");

			start();
		});
	});
}(jQuery));

module('Contexts');
asyncTest('Relationships', function(){
  var runtime;
  runtime = new JEFRi.Runtime({
    debug: {
      context: jefriContext
    }
  });
  runtime.ready.done(function(){
    var context, router, host, routerHosts, hostRouter;
    context = runtime.build('Context');
    router = runtime.build('Entity', {
      "name": "Router",
      "key": "router_id"
    });
    host = runtime.build('Entity', {
      "name": "Host",
      "key": "host_id"
    });
    router.properties([runtime.build('Property', {
      name: 'router_id',
      type: 'string'
    })]);
    routerHosts = runtime.build('Relationship', {
      name: 'hosts',
      type: 'has_many',
      to_property: 'router_id',
      from_property: 'router_id'
    });
    routerHosts.to(host);
    routerHosts.from(router);
    host.properties([
      runtime.build("Property", {
        name: "host_id",
        type: "string"
      }), runtime.build('Property', {
        name: 'router_id',
        type: 'string'
      })
    ]);
    hostRouter = runtime.build('Relationship', {
      name: 'router',
      type: 'has_a',
      to_property: 'router_id',
      from_property: 'router_id'
    });
    debugger;
    hostRouter.to(router);
    hostRouter.from(host);
    context.entities([host, router]);
    equal(host.relationships().length, 1, 'Host has correct relationships.');
    equal(router.relationships().length, 1, 'Router has correct relationships.');
    equal(hostRouter.to().name(), router.name(), "hostRouter is to router.");
    equal(hostRouter.to()._id, router._id, "hostRouter is to router.");
    equal(routerHosts.to().name(), host.name(), "routerHosts is to host.");
    equal(routerHosts.to()._id, host._id, "routerHosts is to host.");
    start();
  });
});