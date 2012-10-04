(function(){
  var Enty;
  Enty = function($scope){
    $scope.entity = {
      name: 'Foo',
      properties: [
        {
          name: 'Bar'
        }, {
          name: 'Baz'
        }
      ]
    };
  };
  angular.module('modeler').controller('Entity', ['$scope', Enty]);
}).call(this);
