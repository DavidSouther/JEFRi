(function(){
  var model;
  model = function(JEFRi){
    var Model;
    Model = (function(){
      Model.displayName = 'Model';
      var prototype = Model.prototype, constructor = Model;
      function Model(){
        this.reset();
        this.load;
      }
      prototype.reset = function(){
        this.context = JEFRi.build('Context');
      };
      prototype.load = function(){
        var hostsEntity, properties;
        hostsEntity = runtime.build("Entity", {
          "name": "Host",
          "key": "host_id"
        });
        context.entities(hostsEntity);
        properties = [
          runtime.build("Property", {
            name: "host_id",
            type: "string"
          }), runtime.build("Property", {
            name: "hostname",
            type: "string"
          }), runtime.build("Property", {
            name: "ip",
            type: "string"
          }), runtime.build("Property", {
            name: "mac",
            type: "string"
          })
        ];
        return hostsEntity.properties(properties);
      };
      return Model;
    }());
    return new Model();
  };
  angular.module('modeler').factory('Model', ['JEFRi', model]);
}).call(this);
