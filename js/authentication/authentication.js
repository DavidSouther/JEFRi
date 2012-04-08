$(function(){
	//Make sure jQuery and JEFRi are loaded
	if(!$) return;
	if(!JEFRi.EntityContext) return;

	//Handle all the UI Setup
	$("#authentication-dialog").dialog({
		title: 'Login',
		autoOpen: false,
		modal: true,
		draggable: false,
		closeOnEscape: false,
		open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog).hide();}
	});

	var laststore = undefined;
	var session_id = undefined;
	var user = undefined;

	JEFRi.authentication = {};
	JEFRi.authentication.current_user = function(){
		return user;
	};
	JEFRi.authentication.logged_in = function(){
		return !!user;
	};

	var authentication_sent_callback = function(event, data){
		if(data.meta.authentication && data.meta.authentication.login)
		{	//login was a success
			session_id = data.meta.authentication.session_id;
			user = BIG.ec.build('User', data.meta.authentication.user);
			$(user).trigger('persisted');//Since we don't have the transaction to do it for us
			$(laststore).bind('sending', authentication_sending_callback);
			console.log('Login success as', user);
		}
	};

	var authentication_sending_callback = function(event, transaction){
		transaction.meta.authentication = {
			session_id: session_id
		};
	};

	JEFRi.authentication.login = function(username, password, success, failure)
	/**
	 * Log in with the given credentials. If already logged in, clears current
	 * session and starts anew.
	 */
	{
		var uuid = UUID.v5(username);
		var pass = password;
		var transaction = BIG.ec.transaction();
		transaction.addmeta({
			authentication: {
				login: 1,
				user: uuid,
				pass: pass
			}
		});
		laststore = transaction.store;
		$(laststore).bind('sent', authentication_sent_callback);
		transaction.get(function(){
			if(session_id)
			{	//Logged in successfully
				success(user);
			}
			else
			{
				failure();
			}
		});
	}	//JEFRi.authentication.login
});
