(function(){
  var Context;
  Context = function($scope, model){
    $scope.context = model.context;
  };
  angular.module('modeler').controller('Context', ['$scope', 'Model', Context]);
}).call(this);
