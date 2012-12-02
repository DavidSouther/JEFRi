// JEFRi: Entity Framework Runtime - v1.0.0 - 2012-11-30
// http://www.jefri.org
// Copyright (c) 2012 David Souther; Licensed MIT

;(function(_){


var JEFRi, pushResult, ref$, prepareHandler$ = function (o){
      o.__event_handler = o.__event_handler || [];
      o.__event_advisor = o.__event_advisor || [];
    }, observe$ = function (callback){
      prepareHandler$(this);
      this.__event_handler.push(callback);
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
    }, splice$ = [].splice;
JEFRi = {
  EntityComparator: curry$(function(a, b){
    var cmp;
    cmp = a && b && a._type() === b._type() && a.id() === b.id();
    return cmp;
  }),
  isEntity: function(obj){
    return obj._type && obj.id && _.isFunction(obj._type) && _.isFunction(obj.id);
  }
};
_.mixin({
  isEntity: JEFRi.isEntity
});
JEFRi.Runtime = function(contextUri, options, protos){
  var ec, ready, settings, _default, _set_context, _build_constructor, _build_prototype, _build_mutacc, _build_relationship, _build_method, this$ = this;
  if (!this instanceof JEFRi.Runtime) {
    return new JEFRi.Rutime(contextUri, options, protos);
  }
  ec = this;
  if (!_.isString(contextUri)) {
    protos = options;
    options = contextUri;
    contextUri = '';
  }
  ready = _.Deferred();
  settings = {
    updateOnIntern: true
  };
  importAll$(settings, options);
  this.settings = settings;
  this.ready = ready.promise();
  this._context = {
    meta: {},
    contexts: {},
    entities: {},
    attributes: {}
  };
  this._instances = {};
  _default = function(type){
    switch (type) {
    case 'boolean':
      return false;
    case 'int' || 'float':
      return 0;
    case 'string':
      return "";
    default:
      return "";
    }
  };
  _set_context = function(context, protos){
    var type, ref$, definition;
    import$(this$._context.attributes, context.attributes || {});
    for (type in ref$ = context.entities) {
      definition = ref$[type];
      _build_constructor(definition, type);
    }
    return ready.resolve();
  };
  _build_constructor = function(definition, type){
    this$._context.entities[type] = definition;
    this$._instances[type] = {};
    definition.Constructor = function(proto){
      var name, ref$, property, def;
      this._new = true;
      this._modified = {
        _count: 0
      };
      this._fields = {};
      this._relationships = {};
      this._runtime = ec;
      proto = proto || {};
      proto[definition.key] = proto[definition.key] || _.UUID.v4();
      for (name in ref$ = definition.properties) {
        property = ref$[name];
        def = proto[name] || _default(property.type);
        this[name](def);
      }
      this._id = this.id(true);
      import$(this.prototype, proto.prototype);
      observe$.call(this.persisted = this.persisted || {}, function(){
        return this._new = false, this._modified = {
          _count: 0
        }, this;
      }, this);
      return this;
    };
    return _build_prototype(type, definition, protos && protos[type]);
  };
  _build_prototype = function(type, definition, proto){
    var ref$, field, property, rel_name, relationship, method, func;
    ref$ = definition.Constructor.prototype;
    ref$._type = function(full){
      full = full || false;
      return type;
    };
    ref$.id = function(full){
      return (full ? this._type() + "/" : "") + "" + this[definition.key]();
    };
    ref$._status = function(){
      var state;
      state = 'MODIFIED';
      if (this._new) {
        state = 'NEW';
      } else if (_.isEmpty(this._modified)) {
        state = 'PERSISTED';
      }
      return state;
    };
    ref$._definition = function(){
      return definition;
    };
    ref$._persist = function(transaction, callback){
      var deferred, top;
      deferred = _.Deferred().then(callback);
      top = !transaction;
      transaction = top ? new JEFRi.Transaction() : transaction;
      transaction.add(this);
      trigger$.call(this.persisting = this.persisting || {}, transaction, this);
      if (top) {
        transaction.persist(callback);
      }
      return deferred.promise();
    };
    ref$._encode = function(){
      var min, prop;
      min = {
        _type: this._type(),
        _id: this.id()
      };
      for (prop in definition.properties) {
        min[prop] = this[prop]();
      }
      return min;
    };
    ref$._destroy = _.lock(function(){
      var rel_name, ref$;
      trigger$.call(this.destroying = this.destroying || {}, {}, this);
      for (rel_name in definition.relationships) {
        if ((ref$ = this[rel_name]) != null) {
          ref$.remove.call(this);
        }
      }
      ec.destroy(this);
      this[definition.key](0);
      trigger$.call(this.destroyed = this.destroyed || {}, {}, this);
    });
    definition.Constructor.prototype.toJSON = definition.Constructor.prototype._encode;
    for (field in ref$ = definition.properties) {
      property = ref$[field];
      _build_mutacc(definition, field, property);
    }
    for (rel_name in ref$ = definition.relationships) {
      relationship = ref$[rel_name];
      _build_relationship(definition, rel_name, relationship);
    }
    for (method in ref$ = definition.methods) {
      func = ref$[method];
      _build_method(definition, method, func);
    }
    if (proto) {
      import$(definition.Constructor.prototype, proto.prototype);
    }
  };
  _build_mutacc = function(definition, field, property){
    var ref$;
    definition.Constructor.prototype[field] = function(value){
      if (arguments.length > 0) {
        return this[field].set.call(this, value);
      } else {
        return this[field].get.call(this);
      }
    };
    ref$ = definition.Constructor.prototype[field];
    ref$.set = function(value){
      if (value !== this._fields[field]) {
        this._fields[field] = value;
        if (!this._modified[field]) {
          this._modified[field] = this._fields[field];
          this._modified._count += 1;
        } else {
          if (this._modified[field] === value) {
            delete this._modified[field];
            this._modified._count -= 1;
          }
        }
        return trigger$.call(this.modified = this.modified || {}, [field, value], this);
      }
    };
    ref$.get = function(){
      return this._fields[field];
    };
  };
  _build_relationship = function(definition, field, relationship){
    var ref$, resolve_ids;
    definition.Constructor.prototype[field] = function(entity){
      if (arguments.length > 0) {
        if (arguments[0] === null) {
          return this[field].remove.call(this, arguments[0]);
        }
        if (relationship.type === 'has_many') {
          return this[field].add.apply(this, _.flatten(arguments));
        } else {
          return this[field].set.call(this, arguments[0]);
        }
      } else {
        return this[field].get.call(this);
      }
    };
    if ('has_many' === relationship.type) {
      ref$ = definition.Constructor.prototype[field];
      ref$.get = function(){
        var id, ref$, type;
        if (!(field in this._relationships)) {
          this._relationships[field] = [];
          for (id in ref$ = ec._instances[relationship.to.type]) {
            type = ref$[id];
            if (type[relationship.to.property]() === this[relationship.property]()) {
              this._relationships[field].push(type);
            }
          }
        }
        return this._relationships[field];
      };
      ref$.add = function(){
        var i$, len$, entity;
        if (!(field in this._relationships)) {
          this[field].get.call(this);
        }
        for (i$ = 0, len$ = arguments.length; i$ < len$; ++i$) {
          entity = arguments[i$];
          if (_(this._relationships[field]).indexBy(_.bind(JEFRi.EntityComparator, null, entity)) < 0) {
            this._relationships[field].push(entity);
            if (relationship.back) {
              entity[relationship.back](this);
            }
          }
        }
        trigger$.call(this.modified = this.modified || {}, [field, arguments], this);
        return this;
      };
      ref$.remove = function(related){
        var t, ref$;
        t = _(this._relationships[field]).indexBy(JEFRi.EntityComparator(related));
        if (t > -1) {
          (splice$.apply(this._relationships[field], [t, t + 1 - t].concat(ref$ = [])), ref$);
        }
        return this;
      };
    } else {
      ref$ = definition.Constructor.prototype[field];
      ref$.set = _.lock(function(related){
        this._relationships[field] = related;
        resolve_ids.call(this, related);
        if ('is_a' !== relationship.type) {
          if (relationship.back) {
            if (related != null) {
              related[relationship.back](this);
            }
          }
        }
        trigger$.call(this.modified = this.modified || {}, [field, related], this);
        return this;
      });
      ref$.remove = _.lock(function(){
        var ref$;
        if ('is_a' !== relationship.type) {
          if (relationship.back) {
            if ((ref$ = this._relationships[field]) != null) {
              ref$[relationship.back].remove.call(this._relationships[field], this);
            }
          }
        }
        this._relationships[field] = null;
        this[relationship.property](void 8);
        return this;
      });
      ref$.get = function(){
        var key, ref$;
        if (this._relationships[field] === void 8) {
          this._relationships[field] = ec._instances[relationship.to.type][this[relationship.property]()];
          if (this._relationships[field] === void 8) {
            key = (ref$ = {}, ref$[relationship.to.property + ""] = this[relationship.property](), ref$);
            this[field](ec.build(relationship.to.type, key));
          }
        }
        return this._relationships[field];
      };
    }
    resolve_ids = function(related){
      var id;
      if (related === void 8) {
        this[relationship.property](void 8);
      } else if (definition.key === relationship.property) {
        related[relationship.to.property](this[relationship.property]());
      } else if (related._definition().key === relationship.to.property) {
        this[relationship.property](related[relationship.to.property]());
      } else {
        if (this[relationship.property]().match(_.UUID.rvalid)) {
          related[relationship.to.property](this[relationship.property]());
        } else if (related[relationship.to.property]().match(_.UUID.rvalid)) {
          this[relationship.property](related[relationship.to.property]());
        } else {
          id = _.UUID.v4();
          this[relationship.property](id);
          related[relationship.to.property](id);
        }
      }
    };
  };
  _build_method = function(definition, method, func){
    var body, params, fn;
    body = (func.definitions || (func.definitions = {})).javascript || "";
    params = func.order || (func.order = []);
    if (body && !body.match(/window/)) {
      params.push(body);
      fn = Function.apply(null, params);
    } else {
      fn = _.noop;
    }
    definition.Constructor.prototype[method] = fn;
  };
  this.load = function(contextUri, prototypes){
    return _.request(contextUri).then(function(data){
      data = data || "{}";
      data = _.isString(data) ? JSON.parse(data) : data;
      _set_context(data, prototypes);
    });
  };
  if (options && options.debug) {
    _set_context(options.debug.context, protos);
  }
  if (contextUri) {
    this.load(contextUri, protos);
  }
  return this;
};
pushResult = function(entity){
  var type;
  type = entity._type();
  if (!this[type]) {
    this[type] = [];
  }
  return this[type].push(entity);
};
import$(JEFRi.Runtime.prototype, JEFRi.Runtime.prototype);
ref$ = JEFRi.Runtime.prototype;
ref$.clear = function(){
  this._instances = {};
  return this;
};
ref$.definition = function(name){
  name = (typeof name._type === 'function' ? name._type() : void 8) || name;
  return this._context.entities[name];
};
ref$.extend = function(type, extend){
  if (this._context.entities[type]) {
    import$(this._context.entities[type].Constructor.prototype, extend.prototype);
  }
  return this;
};
ref$.intern = function(entity, updateOnIntern){
  var entities, res$, i$, len$, ent, ret;
  updateOnIntern = !!updateOnIntern || this.settings.updateOnIntern;
  if (entity.length && !entity._type) {
    res$ = [];
    for (i$ = 0, len$ = entity.length; i$ < len$; ++i$) {
      ent = entity[i$];
      res$.push(this.intern(ent, updateOnIntern));
    }
    entities = res$;
    return entities;
  }
  if (updateOnIntern) {
    ret = this._instances[entity._type()][entity.id()] || entity;
    import$(ret._fields, entity._fields);
  } else {
    ret = this._instances[entity._type()][entity.id()] || entity;
  }
  this._instances[entity._type()][entity.id()] = ret;
  return ret;
};
ref$.build = function(type, obj){
  var def, r, demi, instance;
  def = this.definition(type);
  if (!def) {
    throw "JEFRi::Runtime::build '" + type + "' is not a defined type in this context.";
  }
  obj = obj || {};
  r = new def.Constructor(obj);
  if (def.key in obj) {
    demi = {
      _type: type
    };
    demi[def.key] = obj[def.key];
    instance = this.find(demi);
    if (instance.length > 0) {
      instance = instance[0];
      import$(instance._fields, r._fields);
      return instance;
    }
  }
  this._instances[type][r.id()] = r;
  return r;
};
ref$.expand = function(transaction, action){
  var built, i$, ref$, len$, entity, e;
  action = action || "persisted";
  built = [];
  for (i$ = 0, len$ = (ref$ = transaction.entities || []).length; i$ < len$; ++i$) {
    entity = ref$[i$];
    e = this.build(entity._type, entity);
    e = this.intern(e, true);
    trigger$.call(e[action] = e[action] || {}, true, e);
    built.push(e);
  }
  return transaction.entities = built;
};
ref$.destroy = function(entity){
  delete this._instances[entity._type()][entity.id()];
  return this;
};
ref$.find = function(spec){
  var to_return, r, results, key, result;
  if (typeof spec === "string") {
    spec = {
      _type: spec
    };
  }
  to_return = [];
  r = this.definition(spec._type);
  results = this._instances[spec._type];
  if (spec.hasOwnProperty(r.key || spec.hasOwnProperty('_id'))) {
    if (results[spec[r.key]]) {
      to_return.push(results[spec[r.key]]);
    }
  } else {
    for (key in results) {
      result = results[key];
      to_return.push(result);
    }
  }
  return to_return;
};
function curry$(f, args){
  return f.length > 1 ? function(){
    var params = args ? args.concat() : [];
    return params.push.apply(params, arguments) < f.length && arguments.length ?
      curry$.call(this, f, params) : f.apply(this, params);
  } : f;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
var ref$, prepareHandler$ = function (o){
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
JEFRi.Transaction = function(spec, store){
  return this.attributes = {}, this.store = store, this.entities = spec instanceof Array
    ? spec
    : spec
      ? [spec]
      : [], this;
};
ref$ = JEFRi.Transaction.prototype;
ref$.encode = function(){
  var transaction, i$, ref$, len$, entity;
  transaction = {
    attributes: this.attributes,
    entities: []
  };
  for (i$ = 0, len$ = (ref$ = this.entities).length; i$ < len$; ++i$) {
    entity = ref$[i$];
    transaction.entities.push(_.isEntity(entity) ? entity._encode() : entity);
  }
  return transaction;
};
ref$.toString = function(){
  return JSON.stringify(this.encode());
};
ref$.get = function(store){
  var d;
  d = new _.Deferred();
  trigger$.call(this.getting = this.getting || {}, {}, this);
  store = store || this.store;
  return store.execute('get', this).then(function(){
    d.resolve(this);
  }).promise();
};
ref$.persist = function(store){
  var d;
  d = _.Deferred();
  store = store || this.store;
  trigger$.call(this.persisting = this.persisting || {}, {}, this);
  trigger$.call(this.persisted = this.persisted || {}, function(e, data){}, this);
  return store.execute('persist', this).then(function(t){
    var i$, ref$, len$, entity;
    for (i$ = 0, len$ = (ref$ = t.entities).length; i$ < len$; ++i$) {
      entity = ref$[i$];
      trigger$.call(entity.persisted = entity.persisted || {}, {}, entity);
    }
  }).promise();
};
ref$.add = function(spec, force){
  var i$, len$, s;
  force == null && (force = false);
  spec = _.isArray(spec)
    ? spec
    : [].slice.call(arguments, 0);
  for (i$ = 0, len$ = spec.length; i$ < len$; ++i$) {
    s = spec[i$];
    if (force || _(this.entities).indexBy(JEFRi.EntityComparator(s)) < 0) {
      this.entities.push(s);
    }
  }
  return this;
};
ref$.attributes = function(attributes){
  import$(this.attributes, attributes);
  return this;
};
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
this.JEFRi = JEFRi;
}).call(this, this._);
