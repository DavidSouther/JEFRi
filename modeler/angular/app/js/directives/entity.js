(function(){
  var Entity;
  Entity = function($){
    return {
      restrict: 'E',
      templateUrl: 'partials/entity.html',
      controller: 'Entity',
      replace: true,
      link: function(scope, element){
        var $el;
        $el = $(element);
        $el.click(function(){
          $el.find('ul').toggle('slow');
        });
      }
    };
  };
  angular.module('modeler').directive('entity', ['jQuery', Entity]);
}).call(this);
