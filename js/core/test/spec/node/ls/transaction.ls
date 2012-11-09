require! { jefri: "../../../../lib/jefri.js" }

describe "jefri transactions", !(a)->

	it "Transactions expand bare entities", !->
		done = false
		runs !->
			runtime = new jefri.Runtime "http://localhost:3000/EntityContext.json"
			runtime.ready.then !->
				tranasction = runtime.transaction!
				transaction.add {"_type":"User","user_id":"73e39d31-23f6-4ffc-a14c-cfa1d82fadd4","name":"southerd","address":"davidsouther@gmail.com"}
				expect true .toBe true
				done := true

		waitsFor -> done

