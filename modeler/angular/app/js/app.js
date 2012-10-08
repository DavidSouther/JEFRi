(function(){
  var jefri;
  angular.module('modeler', ['jefri', 'jquery']);
  jefri = function(JEFRi){
    JEFRi.load('entityContext.json');
  };
  angular.module('modeler').run(['JEFRi', jefri]);
}).call(this);
