(function(){
  var jefri;
  jefri = require('../../../../lib/jefri.js');
  describe("jefri", function(a){
    it("can be instantiated with no context", function(){
      var done;
      done = false;
      runs(function(){
        var runtime;
        runtime = new jefri.Runtime();
        runtime.ready.then(function(){
          done = true;
        });
      });
      waitsFor(function(){
        return done;
      });
    });
  });
}).call(this);
