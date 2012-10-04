(function(){
  angular.module('jquery', []).factory('jQuery', function(){
    jQuery.noConflict();
    return jQuery;
  });
}).call(this);
