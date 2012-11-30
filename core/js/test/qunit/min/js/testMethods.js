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
