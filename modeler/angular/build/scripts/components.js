(function(){
  var directive;
  directive = function($, model){
    return {
      restrict: 'E',
      template: $.template("#controls"),
      replace: true,
      scope: true,
      controller: function($scope){
        $scope.action = 'Load';
        $scope.storage = 'LocalStore';
        $scope.endpoint = 'http://localhost:3000/';
        $scope.contexts = [];
        $scope.contextName = "";
        $scope.add = function(){
          model.addEntity();
          setTimeout(function(){
            $scope.$apply();
          });
        };
        $scope.isRemoteStore = function(){
          return $scope.storage === 'PostStore';
        };
        $scope.isSaving = function(){
          return $scope.action === 'Save';
        };
        $scope.loadContexts = function(){
          model.listContexts($scope.storage, {
            remote: $scope.endpoint
          }).then(function(results){
            $scope.contexts = results.entities;
            setTimeout(function(){
              $scope.$apply();
            });
          });
        };
        $scope.finish = function(){
          var name;
          name = $scope.isSaving()
            ? $scope.contextName || model.context.name() || "DEFAULT_CONTEXT"
            : $scope.contextId;
          model[$scope.action]($scope.storage, name, {
            remote: $scope.endpoint
          }).then(function(){
            setTimeout(function(){
              $scope.$apply();
            });
          });
          $scope.showContext = false;
        };
        $scope.loadSample = function(){
          model.load();
        };
        $scope.loadContext = function(){
          _.request.post($scope.endpoint + "load/", {
            data: '{"context": "http://localhost:3000/entityContext.json"}',
            dataType: "application/json"
          });
          setTimeout(function(){
            $scope.$apply();
          });
        };
        $scope['export'] = model['export'];
        $scope.exported = model['export']();
      }
    };
  };
  angular.module('modeler').directive('controls', ['jQuery', 'Model', 'JEFRi', directive]);
}).call(this);

(function(){
  var controller, directive, prepareHandler$ = function (o){
        o.__event_handler = o.__event_handler || [];
        o.__event_advisor = o.__event_advisor || [];
      }, observe$ = function (callback){
        prepareHandler$(this);
        this.__event_handler.push(callback);
      };
  controller = function($scope, model){
    observe$.call(model.ready = model.ready || {}, function(){
      $scope.context = model.context;
      try {
        $scope.$digest();
      } catch (e$) {}
    }, model);
  };
  controller.$inject = ['$scope', 'Model'];
  directive = function($){
    return {
      restrict: 'E',
      template: $.template('#context'),
      replace: true,
      controller: controller
    };
  };
  angular.module('modeler').directive('context', ['jQuery', directive]);
}).call(this);

(function(){
  var controller, directive;
  controller = function($scope, Model){
    var newRelationshipId, newPropertyId;
    newRelationshipId = newPropertyId = 1;
    $scope.addProperty = function(){
      $scope.entity.properties(Model.runtime.build('Property', {
        name: "property_" + newPropertyId++,
        type: 'string'
      }));
    };
    $scope.addRelationship = function(){
      var relationship;
      relationship = Model.runtime.build('Relationship', {
        name: "relationship_" + newRelationshipId++,
        type: 'has_a',
        from_property: $scope.entity._definition().key
      });
      relationship.from($scope.entity);
      $scope.entity.relationships(relationship);
    };
  };
  angular.module('modeler').controller('Entity', ['$scope', 'Model', controller]);
  directive = function($, jsp){
    return {
      restrict: 'E',
      template: $.template('.entity'),
      replace: true,
      controller: 'Entity',
      link: function(scope, element){
        element.draggable({
          start: jsp.drag.start,
          drag: jsp.drag.drag,
          stop: jsp.drag.stop,
          stack: ".context .entity"
        }).resizable({
          handles: 'e'
        });
      }
    };
  };
  angular.module('modeler').directive('entity', ['jQuery', 'JSPlumb', directive]);
}).call(this);

(function(){
  var directive, prepareHandler$ = function (o){
        o.__event_handler = o.__event_handler || [];
        o.__event_advisor = o.__event_advisor || [];
      }, observe$ = function (callback){
        prepareHandler$(this);
        this.__event_handler.push(callback);
      }, splice$ = [].splice, off$ = function (e){
        var t, ref$;
        prepareHandler$(this);
        if ((t = this.__event_handler.indexOf(e)) > -1) {
          (splice$.apply(this.__event_handler, [t, t + 1 - t].concat(ref$ = [])), ref$);
        }
      };
  directive = function($, jsp, jefri){
    var plumb;
    plumb = function(scope){
      var from, to, label;
      if (!scope.relationship) {
        return;
      }
      from = ".entity." + scope.relationship.from().name();
      to = ".entity." + scope.relationship.to().name();
      if (scope.relationship.from_property()) {
        from = from + " ." + scope.relationship.from_property();
      }
      if (scope.relationship.to_property()) {
        to = to + " ." + scope.relationship.to_property();
      }
      if (scope.connector) {
        jsp.detach(scope.connector);
      }
      label = scope.relationship.from().name() + "::" + scope.relationship.name();
      scope.connector = jsp.connect($(from), $(to));
    };
    return {
      restrict: 'E',
      template: $.template('.relationship'),
      replace: true,
      link: function(scope){
        setTimeout(function(){
          plumb(scope);
        });
      },
      controller: function($scope){
        var modified;
        modified = _.lock(function(field, value){
          var _find, ref$, to_rel, from_property, to_property, back;
          _find = function(type){
            var found, i$, len$, ent;
            found = jefri.find({
              _type: type,
              _id: value
            });
            for (i$ = 0, len$ = found.length; i$ < len$; ++i$) {
              ent = found[i$];
              if (ent.id() === value) {
                return ent;
              }
            }
          };
          if (_(field).isArray()) {
            ref$ = field, field = ref$[0], value = ref$[1];
          }
          if (value === void 8) {
            return;
          }
          switch (field) {
          case 'to_id':
            to_rel = _find('Entity');
            $scope.relationship.to(to_rel);
            break;
          case 'from_property':
            from_property = _find('Property');
            $scope.relationship.from_property(from_property.name());
            break;
          case 'to_property':
            to_property = _find('Property');
            $scope.relationship.to_property(to_property.name());
            break;
          case 'back':
            if (value === "") {
              $scope.relationship.back("");
            } else {
              back = _find('Relationship');
              $scope.relationship.back(back.name());
            }
          }
          try {
            $scope.$apply();
          } catch (e$) {}
          plumb($scope);
        });
        observe$.call($scope.relationship.modified = $scope.relationship.modified || {}, modified, $scope.relationship);
        observe$.call($scope.relationship.destroying = $scope.relationship.destroying || {}, function(){
          off$.call($scope.relationship.modified = $scope.relationship.modified || {}, modified, $scope.relationship);
          jsp.detach($scope.connector);
          $scope.connector = null;
        }, $scope.relationship);
        observe$.call($scope.relationship.destroyed = $scope.relationship.destroyed || {}, function(){
          $scope.relationship = null;
        }, $scope.relationship);
        observe$.call($scope.entity.destroyed = $scope.entity.destroyed || {}, function(){
          var ref$;
          if ((ref$ = $scope.relationship) != null) {
            ref$._destroy();
          }
        }, $scope.entity);
        observe$.call($scope.relationship.to().destroyed = $scope.relationship.to().destroyed || {}, function(){
          var ref$;
          if ((ref$ = $scope.relationship) != null) {
            ref$._destroy();
          }
        }, $scope.relationship.to());
      }
    };
  };
  angular.module('modeler').directive('relationship', ['jQuery', 'JSPlumb', 'JEFRi', directive]);
}).call(this);

(function(){
  var directive;
  directive = function($, Model){
    return {
      restrict: 'E',
      template: $.template('.property'),
      replace: true
    };
  };
  angular.module('modeler').directive('property', ['jQuery', 'Model', directive]);
}).call(this);
