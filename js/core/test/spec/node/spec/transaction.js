(function(){
  var jefri;
  jefri = require('../../../../lib/jefri.js');
  describe("jefri transactions", function(a){
    it("Transactions expand bare entities", function(){
      var done;
      done = false;
      runs(function(){
        var runtime;
        runtime = new jefri.Runtime("http://localhost:3000/EntityContext.json");
        runtime.ready.then(function(){
          var tranasction;
          tranasction = runtime.transaction();
          transaction.add({
            "_type": "User",
            "user_id": "73e39d31-23f6-4ffc-a14c-cfa1d82fadd4",
            "name": "southerd",
            "address": "davidsouther@gmail.com"
          });
          expect(true).toBe(true);
          done = true;
        });
      });
      waitsFor(function(){
        return done;
      });
    });
  });
}).call(this);
