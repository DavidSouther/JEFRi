require! { jefri: "../../../../lib/jefri.js" }

describe "jefri transactions", !(a)->

	it "Transactions expand bare entities", !->
		done = false
		runs !->
			runtime = new jefri.Runtime "http://localhost:3000/EntityContext.json"
			runtime.ready.then !->
				transaction = runtime.transaction!
				transaction.add [{"_type":"User","user_id":"73e39d31-23f6-4ffc-a14c-cfa1d82fadd4","name":"southerd","address":"davidsouther@gmail.com"},{"_type":"Authinfo","authinfo_id":"2b4123b7-ae7b-4e5d-bc4b-75327947467c","user_id":"73e39d31-23f6-4ffc-a14c-cfa1d82fadd4","username":"","password":"","activated":"","banned":"","ban_reason":"","new_password_key":"","new_password_requested":"","new_email":"","new_email_key":"","last_ip":"","last_login":"","created":"","modified":""}], true
				expect true .toBe true
				done := true

		waitsFor -> done

