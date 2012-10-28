(function(){
  exports['Smoke'] = {
    'loads': function(test){
      var jefri;
      test.expect(1);
      jefri = require('../../lib/jefri');
      test.ok(jefri, 'JEFRi gets returned.');
      test.done();
    }
  };
}).call(this);
