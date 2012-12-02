(function(){
  var pretty;
  pretty = function(){
    return function(json){
      if (_(json).isString()) {
        json = JSON.parse(json);
      }
      return JSON.stringify(json, null, 4);
    };
  };
  angular.module('modeler').filter('prettyjson', pretty);
}).call(this);

(function(){
  var Default;
  Default = function(){
    return function(input, def){
      return input || def;
    };
  };
  angular.module('modeler').filter('default', Default);
}).call(this);

(function(){
  var Short;
  Short = function(){
    return function(id){
      return "(" + id.substring(0, 8) + ")";
    };
  };
  angular.module('modeler').filter('shortId', Short);
}).call(this);
