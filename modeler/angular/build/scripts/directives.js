(function(){
  var JefriProperty, prepareHandler$ = function (o){
        o.__event_handler = o.__event_handler || [];
        o.__event_advisor = o.__event_advisor || [];
      }, observe$ = function (callback){
        prepareHandler$(this);
        this.__event_handler.push(callback);
      };
  JefriProperty = function($){
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        var ref$, entity, property, update;
        ref$ = attrs.jefriProperty.split('.'), entity = ref$[0], property = ref$[1];
        entity = scope[entity];
        switch (element[0].nodeName) {
        case 'SELECT':
          update = function(val){
            element.find("option").filter(function(){
              return $(this).attr('value') === val || $(this).text() === val;
            }).attr('selected', true);
          };
          element.change(function(){
            entity[property](element.val());
            try {
              scope.$apply();
            } catch (e$) {}
          });
          observe$.call(entity.modified = entity.modified || {}, function(changed, value){
            var ref$;
            if (_(changed).isArray()) {
              ref$ = changed, changed = ref$[0], value = ref$[1];
            }
            if (changed === property) {
              update(value);
            }
          }, entity);
          setTimeout(function(){
            return update(entity[property]());
          }, 0);
          break;
        case 'INPUT':
          if ('radio' === element.attr('type')) {
            update = function(val){
              if (val === element.val()) {
                element.attr('checked', 'checked');
              }
            };
            element.change(function(){
              entity[property](element.val());
              try {
                scope.$apply();
              } catch (e$) {}
            });
            observe$.call(entity.modified = entity.modified || {}, function(changed, value){
              var ref$;
              if (_(changed).isArray()) {
                ref$ = changed, changed = ref$[0], value = ref$[1];
              }
              if (changed === property) {
                update(value);
              }
            }, entity);
            setTimeout(function(){
              return update(entity[property]());
            }, 0);
            return;
          }
          // fallthrough
        case 'INPUT':
        case 'TEXTAREA':
          element.val(entity[property]());
          element.change(function(){
            entity[property](element.val());
          });
          observe$.call(entity.modified = entity.modified || {}, function(){
            element.val(entity[property]());
          }, entity);
          break;
        case 'SPAN':
        case 'DIV':
        case 'P':
          // fallthrough
        default:
          element.text(entity[property]());
          observe$.call(entity.modified = entity.modified || {}, function(){
            element.text(entity[property]());
          }, entity);
        }
      }
    };
  };
  angular.module('jefri').directive('jefriProperty', ['jQuery', JefriProperty]);
}).call(this);

(function(){
  var Inline;
  Inline = function($){
    return {
      restrict: 'E',
      template: '<span><span ng:hide="editing" ng:click="edit()">{{value}}</span><span ng:show="editing"><input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" /></span></span>',
      replace: true,
      scope: true,
      controller: function($scope){
        $scope.editing = false;
        $scope.edit = function(){
          $scope.editing = true;
        };
        $scope.save = function(){
          $scope.editing = false;
        };
      },
      link: function(scope, element, attrs){
        scope.value = scope.entity[attrs.property]() || attrs['default'];
        scope.$watch('value', function(){
          scope.entity[attrs.property](scope.value);
        });
      }
    };
  };
  angular.module('modeler').directive('inline', ['jQuery', Inline]);
}).call(this);
