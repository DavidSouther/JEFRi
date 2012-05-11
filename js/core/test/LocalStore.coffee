$(document).ready( ->
	test("Unit Testing Environment", ->
		expect 1
		ok !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!"
	)

	asyncTest("LocalStore", ->
		runtime = new JEFRi.Runtime("testContext.json", {storeURI: "/test/"});
		runtime.ready.done( ->
			user = runtime.build("User", {name: "southerd", address: "davidsouther@gmail.com"});
			authinfo = user.set_authinfo(runtime.build('Authinfo', {})).get_authinfo();

			store = new JEFRi.LocalStore
			runtime.save_new store .then(->)

			start();
		)
	)
)