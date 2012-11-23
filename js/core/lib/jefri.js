// JEFRi: Entity Framework Runtime - v1.0.0 - 2012-11-22
// http://www.jefri.org
// Copyright (c) 2012 David Souther; Licensed MIT

var _ = require("superscore");

var JEFRi, pushResult, ref$, prepareHandler$ = function (o){
      o.__event_handler = o.__event_handler || [];
      o.__event_advisor = o.__event_advisor || [];
    }, observe$ = function (callback){
      prepareHandler$(this);
      this.__event_handler.push(callback);
    }, trigger$ = function (e, p){
      var i$, ref$, len$, advice, _e, ex, callback;
      prepareHandler$(this);
      this.last = {
        event: e,
        exception: null
      };
      for (i$ = 0, len$ = (ref$ = this.__event_advisor).length; i$ < len$; ++i$) {
        advice = ref$[i$];
        try {
          _e = advice.call(p, e);
          if (_e) {
            this.last.event = e = _e;
          }
        } catch (e$) {
          ex = e$;
          this.last.exception = ex;
          return false;
        }
      }
      for (i$ = 0, len$ = (ref$ = this.__event_handler).length; i$ < len$; ++i$) {
        callback = ref$[i$];
        callback.call(p, e);
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
  ec = this;
  if (!_.isString(contextUri)) {
    protos = options;
    options = contextUri;
    contextUri = '';
  }
  ready = _.Deferred();
  settings = {
    contextUri: contextUri,
    updateOnIntern: true,
    store: JEFRi.LocalStore
  };
  importAll$(settings, options);
  importAll$(this, {
    settings: settings,
    ready: ready.promise(),
    _context: {
      meta: {},
      contexts: {},
      entities: {},
      attributes: {}
    },
    _instances: {},
    _new: [],
    _modified: {
      set: function(entity){
        if (!this$._modified[entity._type()]) {
          this$._modified[entity._type()] = {};
        }
        this$._modified[entity._type()][entity.id()] = entity;
      },
      remove: function(entity){
        var id, type;
        id = entity.id();
        type = this$._modified[entity._type()];
        type[id] = null;
        delete type[id];
      }
    }
  });
  this._store = new this.settings.store({
    runtime: this
  });
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
        this._new = false;
        this._modified = {
          _count: 0
        };
        return ec._modified.remove(this);
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
      return (full ? this._type() + "/" : "") + this[definition.key]();
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
      var rel_name, ref$, relationship;
      for (rel_name in ref$ = definition.relationships) {
        relationship = ref$[rel_name];
        if (relationship.type === 'has_many') {
          this[rel_name].remove;
        }
        this[rel_name](null);
      }
      ec.destroy(this);
      this[definition.key](0);
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
          ec._modified.set(this);
        } else {
          if (this._modified[field] === value) {
            delete this._modified[field];
            this._modified._count -= 1;
          }
          if (this._modified._count === 0) {
            ec._modified.remove(this);
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
            related[relationship.back](this);
          }
        }
        trigger$.call(this.modified = this.modified || {}, [field, related], this);
        return this;
      });
      ref$.remove = _.lock(function(){
        if ('is_a' !== relationship.type) {
          if (relationship.back) {
            if ('has_a' === relationship.type) {
              this._relationships[field][relationship.back].remove.call(this._relationships[field], this);
            } else {
              this._relationships[field][relationship.back](null);
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
      if (definition.key === relationship.property) {
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
  this.load = function(contextUri){
    return _.request(contextUri).then(function(data){
      data = data || "{}";
      data = _.isString(data) ? JSON.parse(data) : data;
      _set_context(data, protos);
    });
  };
  if (options && options.debug) {
    _set_context(options.debug.context, protos);
  } else if (this.settings.contextUri != null) {
    this.load(this.settings.contextUri);
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
  this._modified = {};
  this._new = [];
  this._instances = {};
  return this;
};
ref$.definition = function(name){
  name = (typeof name._type === 'function' ? name._type() : void 8) || name;
  return this._context.entities[name];
};
ref$.extend = function(type, extend){
  if (this._context.entities[type]) {
    return import$(this._context.entities[type].Constructor.prototype, extend.prototype);
  }
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
  this._new.push(r);
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
  var t, ref$;
  this._modified.remove(entity);
  delete this._instances[entity._type()][entity.id()];
  t = _(this._new).indexBy(JEFRi.EntityComparator(entity));
  if (t > -1) {
    (splice$.apply(this._new, [t, t + 1 - t].concat(ref$ = [])), ref$);
  }
  return this;
};
ref$.transaction = function(spec){
  spec = spec || [];
  return new JEFRi.Transaction(spec, this._store);
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
  if (spec.hasOwnProperty(r.key)) {
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
ref$.get = function(spec){
  var results, transaction, deferred, i$, len$, _spec, _type, def, id;
  spec = _.isArray(spec)
    ? spec
    : [spec];
  results = {};
  transaction = this.transaction();
  deferred = _.Deferred();
  results.push = pushResult;
  for (i$ = 0, len$ = spec.length; i$ < len$; ++i$) {
    _spec = spec[i$];
    _type = _spec._type instanceof Function
      ? _spec._type()
      : _spec._type;
    def = this.definition(_type);
    id = _spec[def.key];
    if (id != null && this._instances[_type][id]) {
      results.push(this._instances[_type][id]);
    } else {
      transaction.add(_spec);
    }
  }
  if (transaction.entities.length > 0) {
    transaction.get().done(function(transaction){
      var i$, ref$, len$, entity;
      for (i$ = 0, len$ = (ref$ = transaction.entities).length; i$ < len$; ++i$) {
        entity = ref$[i$];
        results.push(entity);
      }
      return deferred.resolve(results, transaction.attributes);
    });
  } else {
    deferred.resolve(results, {});
  }
  return deferred.promise();
};
ref$.get_first = function(spec){
  var d;
  spec = spec instanceof Array ? spec[0] : spec;
  d = _.Deferred();
  this.get(spec).then(function(data, meta){
    var _type;
    _type = spec._type instanceof Function
      ? spec._type()
      : spec._type;
    return d.resolve(data[_type].pop(), meta);
  });
  return d.promise();
};
ref$.save_new = function(store){
  var transaction;
  transaction = this.transaction();
  trigger$.call(this.saving = this.saving || {}, {}, this);
  transaction.add(this._new);
  return this._save(transaction, store);
};
ref$.save_all = function(store){
  var transaction, t, ref$, modified, k, entity, i$, len$, neu;
  transaction = this.transaction();
  trigger$.call(this.saving = this.saving || {}, {}, this);
  for (t in ref$ = this._modified) {
    modified = ref$[t];
    for (k in modified) {
      entity = modified[k];
      entity._persist(transaction);
    }
  }
  for (i$ = 0, len$ = (ref$ = this._new).length; i$ < len$; ++i$) {
    neu = ref$[i$];
    this.persist(neu);
  }
  return this._save(transaction, store);
};
ref$._save = function(transaction, store){
  store = store || this._store;
  return store.execute('persist', transaction).then(_.bind(this.expand, this));
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
      var i$, ref$, len$, advice, _e, ex, callback;
      prepareHandler$(this);
      this.last = {
        event: e,
        exception: null
      };
      for (i$ = 0, len$ = (ref$ = this.__event_advisor).length; i$ < len$; ++i$) {
        advice = ref$[i$];
        try {
          _e = advice.call(p, e);
          if (_e) {
            this.last.event = e = _e;
          }
        } catch (e$) {
          ex = e$;
          this.last.exception = ex;
          return false;
        }
      }
      for (i$ = 0, len$ = (ref$ = this.__event_handler).length; i$ < len$; ++i$) {
        callback = ref$[i$];
        callback.call(p, e);
      }
      return true;
    };
JEFRi.Transaction = function(spec, store){
  return this.attributes = {}, this.store = store, this.entities = spec instanceof Array
    ? spec
    : [spec], this;
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
var ObjectStore, prepareHandler$ = function (o){
      o.__event_handler = o.__event_handler || [];
      o.__event_advisor = o.__event_advisor || [];
    }, trigger$ = function (e, p){
      var i$, ref$, len$, advice, _e, ex, callback;
      prepareHandler$(this);
      this.last = {
        event: e,
        exception: null
      };
      for (i$ = 0, len$ = (ref$ = this.__event_advisor).length; i$ < len$; ++i$) {
        advice = ref$[i$];
        try {
          _e = advice.call(p, e);
          if (_e) {
            this.last.event = e = _e;
          }
        } catch (e$) {
          ex = e$;
          this.last.exception = ex;
          return false;
        }
      }
      for (i$ = 0, len$ = (ref$ = this.__event_handler).length; i$ < len$; ++i$) {
        callback = ref$[i$];
        callback.call(p, e);
      }
      return true;
    }, slice$ = [].slice;
ObjectStore = (function(){
  ObjectStore.displayName = 'ObjectStore';
  var _sieve, prototype = ObjectStore.prototype, constructor = ObjectStore;
  function ObjectStore(options){
    this.settings = {
      version: "1.0",
      size: Math.pow(2, 16)
    };
    _.extend(this.settings, options);
    if (!this.settings.runtime) {
      throw {
        message: "LocalStore instantiated without runtime to reference."
      };
    }
  }
  prototype.execute = function(type, transaction){
    var transactionData;
    transactionData = transaction.encode();
    trigger$.call(this.sending = this.sending || {}, transactionData, this);
    if (type === "persist") {
      this.persist(transactionData);
    } else if (type === "get") {
      this.get(transactionData);
    }
    return _.Deferred().resolve(transactionData);
  };
  prototype.persist = function(transaction){
    var entity;
    return transaction.entities = (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = transaction.entities).length; i$ < len$; ++i$) {
        entity = ref$[i$];
        results$.push(this._save(entity));
      }
      return results$;
    }.call(this));
  };
  prototype._save = function(entity){
    entity = importAll$(this._find(entity), entity);
    this._set(this._key(entity), JSON.stringify(entity));
    this._type(entity._type, entity._id);
    return entity;
  };
  prototype._set = function(key, value){
    (this._store || (this._store = {}))[key] = value;
  };
  prototype._get = function(key){
    var ref$;
    return ((ref$ = this._store) != null ? ref$[key] : void 8) || '{}';
  };
  prototype.get = function(transaction){
    var ents, res$, i$, ref$, len$, entity, this$ = this;
    res$ = [];
    for (i$ = 0, len$ = (ref$ = transaction.entities).length; i$ < len$; ++i$) {
      entity = ref$[i$];
      res$.push(this._lookup(entity));
    }
    ents = res$;
    ents = _.flatten(ents);
    transaction.entities = _.uniq(_.filter(ents, function(it){
      return it;
    }), false, function(it){
      return it._type + '.' + it[this$.settings.runtime.definition(it._type).key];
    });
    this.settings.runtime.expand(transaction, "gotten");
    return transaction;
  };
  prototype._find = function(entity){
    return JSON.parse(this._get(this._key(entity)));
  };
  prototype._lookup = function(spec){
    var def, results, res$, i$, ref$, len$, id, name, property, relationship, give, take, i, entity, related, j, end, this$ = this;
    def = this.settings.runtime.definition(spec._type);
    res$ = [];
    for (i$ = 0, len$ = (ref$ = _.keys(this._type(spec._type))).length; i$ < len$; ++i$) {
      id = ref$[i$];
      res$.push(JSON.parse(this._get(this._key(spec, id))));
    }
    results = res$;
    if (results.length === 0) {
      return;
    }
    if (def.key in spec) {
      results = [results[spec[def.key]]];
    }
    for (name in ref$ = def.properties) {
      property = ref$[name];
      if (name in spec && name !== def.key) {
        results = _(results).filter(_sieve(name, property, spec[name]));
      }
    }
    for (name in ref$ = def.relationships) {
      relationship = ref$[name];
      if (name in spec) {
        give = [];
        take = [];
        for (i$ = 0, len$ = results.length; i$ < len$; ++i$) {
          i = i$;
          entity = results[i$];
          related = fn$();
          if (related.length) {
            give.push(related);
          } else {
            take.push(i);
          }
        }
        take.reverse();
        for (i$ = 0, len$ = take.length; i$ < len$; ++i$) {
          i = take[i$];
          j = i + 1;
          end = slice$.call(results, j, results.length);
          results = slice$.call(results, 0, i);
          [].push.apply(results, end);
        }
        [].push.apply(results, give);
      }
    }
    return results;
    function fn$(){
      var relspec;
      relspec = _.extend({}, spec[name], {
        _type: relationship.to.type
      });
      relspec[relationship.to.property] = entity[relationship.property];
      return this$._lookup(relspec);
    }
  };
  prototype._type = function(type, id){
    var list;
    id == null && (id = null);
    list = JSON.parse(this._get(type) || "{}");
    if (id) {
      list[id] = "";
      this._set(type, JSON.stringify(list));
    }
    return list;
  };
  prototype._key = function(entity, id){
    var _type, _id;
    _type = entity._type;
    _id = id || entity._id;
    return _type + "/" + _id;
  };
  _sieve = function(name, property, spec){
    var res$, i$, len$, i, s;
    if (_.isNumber(spec)) {
      if (spec % 1 === 0) {
        spec = ['=', spec];
      } else {
        spec = [spec, 8];
      }
    }
    if (_.isString(spec)) {
      spec = ['REGEX', '.*' + spec + '.*'];
    }
    if (!spec) {
      spec = ['=', void 8];
    }
    if (!_.isArray(spec)) {
      throw {
        message: "Lookup specification is invalid (in LocalStore::_sieve).",
        name: name,
        property: property,
        spec: spec
      };
    }
    if (_.isNumber(spec[0])) {
      return function(entity){
        return Math.abs(entity[name] - spec[0]) < Math.pow(2, -spec[1]);
      };
    }
    if (_.isArray(spec[0])) {
      res$ = [];
      for (i$ = 0, len$ = spec.length; i$ < len$; ++i$) {
        i = i$;
        s = spec[i$];
        res$.push(_sieve(name, property, spec[i]));
      }
      spec[i] = res$;
      return function(entity){
        var i$, ref$, len$, filter;
        for (i$ = 0, len$ = (ref$ = spec).length; i$ < len$; ++i$) {
          filter = ref$[i$];
          if (!filter(entity)) {
            return false;
          }
        }
        return true;
      };
    }
    switch (spec[0]) {
    case "=":
      return function(entity){
        return entity[name] === spec[1];
      };
    case "<=":
      return function(entity){
        return entity[name] <= spec[1];
      };
    case ">=":
      return function(entity){
        return entity[name] >= spec[1];
      };
    case "<":
      return function(entity){
        return entity[name] < spec[1];
      };
    case ">":
      return function(entity){
        return entity[name] > spec[1];
      };
    case "REGEX":
      return function(entity){
        return ("" + entity[name]).match(spec[1]);
      };
    default:
      return function(entity){
        var field;
        while (field = spec.shift) {
          if (entity[name] === field) {
            return true;
          }
        }
        return false;
      };
    }
  };
  return ObjectStore;
}());
JEFRi.ObjectStore = ObjectStore;
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}
var LocalStore;
LocalStore = (function(superclass){
  var prototype = extend$((import$(LocalStore, superclass).displayName = 'LocalStore', LocalStore), superclass).prototype, constructor = LocalStore;
  function LocalStore(options){
    LocalStore.superclass.call(this, options);
  }
  prototype._set = function(key, value){
    localStorage[key] = value;
  };
  prototype._get = function(key){
    return localStorage[key] || '{}';
  };
  prototype._key = function(entity, id){
    return superclass.prototype._key.call(this, entity, id).replace('/', '.');
  };
  return LocalStore;
}(JEFRi.ObjectStore));
JEFRi.LocalStore = LocalStore;
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
var PostStore;
PostStore = (function(){
  PostStore.displayName = 'PostStore';
  var prototype = PostStore.prototype, constructor = PostStore;
  function PostStore(options){
    var _send, this$ = this;
    this.settings = {
      version: "1.0",
      size: Math.pow(2, 16)
    };
    _.extend(this.settings, options);
    if (!this.settings.runtime) {
      throw {
        message: "LocalStore instantiated without runtime to reference."
      };
    }
    _send = function(url, transaction, pre, post){
      _.request.post(url, {
        data: transaction.toString(),
        dataType: "application/json"
      }).done(function(data){
        this.settings.runtime.expand(data, true);
      });
    };
    if (this.settings.remote) {
      this.get = function(transaction){
        var url;
        url = this.settings.remote + "get";
        return _send(url, transaction, 'getting', 'gotten');
      };
      this.persist = function(transaction){
        var url;
        url = this.settings.remote + "persist";
        return _send(url, transaction, 'persisting', 'persisted');
      };
    } else {
      this.get = this.persist = function(transaction){
        transaction.entities = [];
        return _.Deferred().resolve().promise();
      };
    }
  }
  return PostStore;
}());
PostStore.prototype.execute = function(type, transaction){
  return this[type](transaction);
};
JEFRi.PostStore = PostStore;
module.exports = JEFRi;