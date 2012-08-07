(function($){

var runtime = new JEFRi.Runtime("./context.json", {storeURI: "/test/"});
var init = JEFRi.Template.init({
	templates: ["../../src/template.html"]
});

_.when(runtime.ready, init).done(function(){
	var rollodex = runtime.build("Rollodex");
	var users = [
		["David Souther", "davidsouther@gmail.com", {username: "southerd", activated: "true", created: new Date(2011, 1, 15, 15, 34, 5).toJSON(), last_ip: "192.168.2.79"}],
		["JPorta", "jporta@example.com", {username: "portaj", activated: "true", created: new Date(2012, 1, 15, 15, 34, 5).toJSON(), last_ip: "192.168.2.80"}],
		["Niemants", "andrew@example.com", {username: "andrew", activated: "false", created: new Date(2012, 1, 17, 15, 34, 5).toJSON(), last_ip: "80.234.2.79"}]
	];

	var _i;
	for(_i=0; _i<users.length; _i++) {
		var user = runtime.build("User", {name: users[_i][0], address: users[_i][1]});
		var authinfo = runtime.build("Authinfo", _.extend({authinfo_id: user.id()}, users[_i][2]));
		user.authinfo(authinfo);
		rollodex.contacts(user);
	}
	var view = JEFRi.Template.render(rollodex);
	$("#site").append(view);
});

}(jQuery));
