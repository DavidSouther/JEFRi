// JEFRi Persistence Stores - v0.1.0 - 2012-12-01
// http://www.jefri.org
// Copyright (c) 2012 David Souther; Licensed MIT

var _ = require("superscore");
var JEFRi = require("jefri");

JEFRi.store = function(name, factory){
  try {
    (JEFRi.Stores || (JEFRi.Stores = {}))[name] = factory();
  } catch (e$) {}
};
var ObjectStore, prepareHandler$ = function (o){
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
    }, slice$ = [].slice;
ObjectStore = (function(){
  ObjectStore.displayName = 'ObjectStore';
  var _sieve, _transactify, prototype = ObjectStore.prototype, constructor = ObjectStore;
  function ObjectStore(options){
    this.settings = {
      version: "1.0",
      size: Math.pow(2, 16)
    };
    _.extend(this.settings, options);
    this._store || (this._store = {});
    if (!this.settings.runtime) {
      throw {
        message: "LocalStore instantiated without runtime to reference."
      };
    }
  }
  prototype._set = function(key, value){
    this._store[key] = value;
  };
  prototype._get = function(key){
    return this._store[key] || '{}';
  };
  prototype.execute = function(type, transaction){
    transaction = _transactify(transaction);
    trigger$.call(this.sending = this.sending || {}, transaction, this);
    this["do_" + type](transaction);
    this.settings.runtime.expand(transaction);
    return _.Deferred().resolve(transaction);
  };
  prototype.get = function(transaction){
    return this.execute('get', transaction);
  };
  prototype.persist = function(transction){
    return this.execute('persist', transction);
  };
  prototype.do_persist = function(transaction){
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
  prototype.do_get = function(transaction){
    var ents, res$, i$, ref$, len$, entity, this$ = this;
    res$ = [];
    for (i$ = 0, len$ = (ref$ = transaction.entities).length; i$ < len$; ++i$) {
      entity = ref$[i$];
      res$.push(this._lookup(entity));
    }
    ents = res$;
    ents = _.flatten(ents);
    transaction.entities = _.uniq(_(ents).filter(function(it){
      return it;
    }), false, function(it){
      return it._type + '.' + it[this$.settings.runtime.definition(it._type).key];
    });
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
  _transactify = function(transaction){
    if (!_(transaction.encode).isFunction()) {
      transaction = new JEFRi.Transaction(transaction);
    }
    return transaction.encode();
  };
  return ObjectStore;
}());
JEFRi.store('ObjectStore', function(){
  return ObjectStore;
});
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
}(JEFRi.Stores.ObjectStore));
JEFRi.store('LocalStore', function(){
  return LocalStore;
});
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
    this._send = bind$(this, '_send', prototype);
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
    if (this.settings.remote) {
      this.get = function(transaction){
        var url;
        url = this.settings.remote + "get";
        return this._send(url, transaction, 'getting', 'gotten');
      };
      this.persist = function(transaction){
        var url;
        url = this.settings.remote + "persist";
        return this._send(url, transaction, 'persisting', 'persisted');
      };
    } else {
      this.get = this.persist = function(transaction){
        transaction.entities = [];
        return _.Deferred().resolve(transaction).promise();
      };
    }
  }
  prototype._send = function(url, transaction, pre, post){
    var this$ = this;
    return _.request.post(url, {
      data: transaction.toString(),
      dataType: "application/json"
    }).done(function(data){
      if (_(data).isString()) {
        data = JSON.parse(data);
      }
      this$.settings.runtime.expand(data, true);
      return data;
    });
  };
  return PostStore;
}());
PostStore.prototype.execute = function(type, transaction){
  return this[type](transaction);
};
JEFRi.PostStore = PostStore;
function bind$(obj, key, target){
  return function(){ return (target || obj)[key].apply(obj, arguments) };
}
/*
* FileStore
* https://github.com/DavidSouther/JEFRi
*
* Copyright (c) 2012 David Souther
* Licensed under the MIT license.
*/
var FileStore;
FileStore = function(){
  var fs, FileStore;
  fs = require('fs');
  return FileStore = (function(superclass){
    var _checkDir, prototype = extend$((import$(FileStore, superclass).displayName = 'FileStore', FileStore), superclass).prototype, constructor = FileStore;
    function FileStore(options){
      var opts;
      opts = {
        directory: "./.jefri"
      };
      import$(opts, options);
      FileStore.superclass.call(this, opts);
      _checkDir(this.settings.directory);
      this.storage = this.settings.directory;
    }
    prototype._set = function(key, value){
      var path;
      path = this._buildPath(key);
      return fs.writeFileSync(path, value);
    };
    prototype._get = function(key){
      var path, e;
      path = this._buildPath(key);
      try {
        return fs.readFileSync(path);
      } catch (e$) {
        e = e$;
        return "{}";
      }
    };
    prototype._buildPath = function(key){
      var path;
      key = key.split('/');
      path = this.storage + "/" + key[0];
      _checkDir(path);
      if (key.length === 1) {
        key[1] = "list";
      }
      path = path + "/" + key[1];
      return path;
    };
    _checkDir = function(directory){
      var dir, e;
      try {
        dir = fs.statSync(directory);
      } catch (e$) {
        e = e$;
        fs.mkdirSync(directory);
        dir = fs.statSync(directory);
      }
      if (!dir.isDirectory()) {
        throw "FileStorage target isn't a directory: " + directory;
      }
    };
    return FileStore;
  }(JEFRi.Stores.ObjectStore));
};
JEFRi.store('FileStore', FileStore);
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
module.exports = JEFRi;
