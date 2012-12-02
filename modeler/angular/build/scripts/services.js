(function(){
  var model, prepareHandler$ = function (o){
        o.__event_handler = o.__event_handler || [];
        o.__event_advisor = o.__event_advisor || [];
      }, trigger$ = function (e, p){
        var advisors, _e, ex, handlers;
        prepareHandler$(this);
        this.last = {
          event: e,
          exception: null
        };
        advisors = this.__event_advisor.length;
        while ((advisors -= 1) >= 0) {
          try {
            _e = this.__event_advisor[advisors].call(p, e);
            if (_e) {
              this.last.event = e = _e;
            }
          } catch (e$) {
            ex = e$;
            this.last.exception = ex;
            return false;
          }
        }
        handlers = this.__event_handler.length;
        while ((handlers -= 1) >= 0) {
          this.__event_handler[handlers].call(p, e);
        }
        return true;
      };
  model = function(JEFRi){
    var Model;
    Model = (function(){
      Model.displayName = 'Model';
      var prototype = Model.prototype, constructor = Model;
      function Model(){
        var this$ = this;
        this.runtime = JEFRi;
        JEFRi.ready.then(function(){
          this$.context = this$.runtime.build('Context');
          trigger$.call(this$.ready = this$.ready || {}, {}, this$);
        });
      }
      prototype.load = function(){
        var router, host, routerManyHosts, hostARouter;
        router = JEFRi.build('Entity', {
          "name": "Router",
          "key": "router_id"
        });
        host = JEFRi.build('Entity', {
          "name": "Host",
          "key": "host_id"
        });
        this.context.entities([host, router]);
        router.properties([
          JEFRi.build('Property', {
            name: 'router_id',
            type: 'string'
          }), JEFRi.build('Property', {
            name: 'name',
            type: 'string'
          })
        ]);
        host.properties([
          JEFRi.build("Property", {
            name: "host_id",
            type: "string"
          }), JEFRi.build("Property", {
            name: "hostname",
            type: "string"
          }), JEFRi.build("Property", {
            name: "ip",
            type: "string"
          }), JEFRi.build("Property", {
            name: "mac",
            type: "string"
          }), JEFRi.build('Property', {
            name: 'router_id',
            type: 'string'
          })
        ]);
        routerManyHosts = JEFRi.build('Relationship', {
          name: 'hosts',
          type: 'has_many',
          to_property: 'router_id',
          from_property: 'router_id',
          back: 'router'
        });
        routerManyHosts.from(router);
        hostARouter = JEFRi.build('Relationship', {
          name: 'router',
          type: 'has_a',
          to_property: 'router_id',
          from_property: 'router_id',
          back: 'hosts'
        });
        hostARouter.from(host).to(router);
        routerManyHosts.to(host);
        trigger$.call(this.ready = this.ready || {}, {}, this);
      };
      prototype.newEntityId = 1;
      prototype.addEntity = function(){
        this.context.entities(JEFRi.build('Entity', {
          name: "entity_" + this.newEntityId++
        }));
      };
      prototype.listContexts = function(storeType, storeOptions){
        var t, s;
        t = new window.JEFRi.Transaction();
        t.add({
          _type: 'Context'
        });
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[storeType](storeOptions);
        return s.execute('get', t);
      };
      prototype.Save = function(store, name, storeOptions){
        var t, i$, ref$, len$, entity, j$, ref1$, len1$, property, relationship, s;
        this.context.name(name);
        t = new window.JEFRi.Transaction();
        t.add(this.context);
        for (i$ = 0, len$ = (ref$ = this.context.entities()).length; i$ < len$; ++i$) {
          entity = ref$[i$];
          t.add(entity);
          for (j$ = 0, len1$ = (ref1$ = entity.properties()).length; j$ < len1$; ++j$) {
            property = ref1$[j$];
            t.add(property);
          }
          for (j$ = 0, len1$ = (ref1$ = entity.relationships()).length; j$ < len1$; ++j$) {
            relationship = ref1$[j$];
            t.add(relationship);
          }
        }
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[store](storeOptions);
        return s.execute('persist', t);
      };
      prototype.Load = function(store, name, storeOptions){
        var t, s, this$ = this;
        this.context.name(name);
        t = new window.JEFRi.Transaction();
        t.add({
          id: name,
          _type: 'Context',
          entities: {
            properties: {},
            relationships: {}
          }
        });
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[store](storeOptions);
        return s.execute('get', t).then(function(results){
          this$.context = results.entities[0];
          this$.context.entities();
          trigger$.call(this$.ready = this$.ready || {}, {}, this$);
        });
      };
      prototype['export'] = function(){
        var ref$;
        return (ref$ = this.context) != null ? ref$['export']() : void 8;
      };
      return Model;
    }());
    return new Model();
  };
  angular.module('modeler').factory('Model', ['JEFRi', model]);
}).call(this);

(function(){
  angular.module('jquery', []).factory('jQuery', function(){
    jQuery.noConflict();
    jQuery.template = function(tplSel){
      return jQuery("#templates " + tplSel).html();
    };
    return jQuery;
  });
}).call(this);

(function(){
  angular.module('jefri', []).factory('JEFRi', function(){
    return new JEFRi.Runtime("entityContext.json");
  });
}).call(this);

(function(){
  var JSPlumb, splice$ = [].splice;
  JSPlumb = function($){
    var color, hoverColor, arrowCommon, arrows, plumbStyles, plumb, connections, connect, detach, draggable, startDrag, doDrag, stopDrag;
    color = 'gray';
    hoverColor = '#ec9f2e';
    arrowCommon = {
      foldback: 0.7,
      fillStyle: color,
      width: 14
    };
    arrows = [
      'Arrow', {
        location: 0.2
      }, arrowCommon
    ];
    plumbStyles = {
      Connector: ['Flowchart'],
      ConnectorZIndex: -5,
      PaintStyle: {
        strokeStyle: color,
        lineWidth: 2
      },
      EndpointStyle: {
        radius: 9,
        fillStyle: color
      },
      HoverPaintStyle: {
        strokeStyle: hoverColor
      },
      EndpointHoverStyle: {
        fillStyle: hoverColor
      },
      Anchors: ['RightMiddle', 'LeftMiddle'],
      Container: $('.context:first'),
      RenderMode: 'svg'
    };
    plumb = jsPlumb.getInstance(plumbStyles);
    connections = [];
    connect = function(a, b, label){
      var overlays, connection;
      overlays = [arrows];
      if (label) {
        overlays.push([
          'Label', {
            label: label,
            location: 0.1
          }
        ]);
      }
      connection = plumb.connect({
        source: a,
        target: b,
        overlays: overlays
      });
      connections.push(connection);
      return connection;
    };
    detach = function(conn){
      var t, ref$;
      plumb.detach(conn);
      if ((t = connections.indexOf(conn)) > -1) {
        (splice$.apply(connections, [t, t + 1 - t].concat(ref$ = [])), ref$);
      }
    };
    draggable = function(){
      var i$, len$, node;
      for (i$ = 0, len$ = arguments.length; i$ < len$; ++i$) {
        node = arguments[i$];
        plumb.draggable(node);
      }
    };
    startDrag = function(){
      var i$, ref$, len$, connection, j$, ref1$, len1$, endpoint;
      for (i$ = 0, len$ = (ref$ = connections).length; i$ < len$; ++i$) {
        connection = ref$[i$];
        connection.setHoverPaintStyle(plumbStyles.PaintStyle);
        for (j$ = 0, len1$ = (ref1$ = connection.endpoints).length; j$ < len1$; ++j$) {
          endpoint = ref1$[j$];
          endpoint.setHoverPaintStyle(plumbStyles.EndpointStyle);
        }
      }
    };
    doDrag = function(){
      var i$, ref$, len$, connection;
      for (i$ = 0, len$ = (ref$ = connections).length; i$ < len$; ++i$) {
        connection = ref$[i$];
        connection.setHover(true, false);
        connection.setHover(false, false);
      }
    };
    stopDrag = function(){
      var i$, ref$, len$, connection, j$, ref1$, len1$, endpoint;
      for (i$ = 0, len$ = (ref$ = connections).length; i$ < len$; ++i$) {
        connection = ref$[i$];
        connection.setHoverPaintStyle(plumbStyles.HoverPaintStyle);
        for (j$ = 0, len1$ = (ref1$ = connection.endpoints).length; j$ < len1$; ++j$) {
          endpoint = ref1$[j$];
          endpoint.setHoverPaintStyle(plumbStyles.EndpointHoverStyle);
        }
      }
    };
    return {
      connect: connect,
      detach: detach,
      draggable: draggable,
      drag: {
        start: startDrag,
        drag: doDrag,
        stop: stopDrag
      }
    };
  };
  angular.module('jsPlumb', ['jquery']).factory('JSPlumb', ['jQuery', JSPlumb]);
}).call(this);
