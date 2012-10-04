(function(){
  var routes, jefri;
  angular.module('modeler', ['jefri', 'jquery']);
  routes = function($rp){
    $rp.when('/Context', {
      templateUrl: 'partials/context.html',
      controller: 'Context'
    }).when('/Entity', {
      templateUrl: 'partials/entity.html',
      controller: 'Entity'
    }).otherwise({
      redirectTo: '/Entity'
    });
  };
  jefri = function(JEFRi){
    JEFRi.load('entityContext.json');
  };
  angular.module('modeler').config(['$routeProvider', routes]).run(['JEFRi', jefri]);
}).call(this);
