/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
_jQuery(document).ready(function(){
  var runtime, users;
  runtime = null;
  module("Object Storage", {
    setup: function(){
      runtime = new JEFRi.Runtime("/test/qunit/min/context/user.json");
    }
  });
  asyncTest("ObjectStore minimal save", function(){
    expect(3);
    runtime.ready.done(function(){
      var store, transaction, user, authinfo;
      store = new JEFRi.Stores.ObjectStore({
        runtime: runtime
      });
      transaction = new JEFRi.Transaction();
      user = runtime.build("User", {
        name: "southerd",
        address: "davidsouther@gmail.com"
      });
      user.authinfo(runtime.build('Authinfo', {}));
      authinfo = user.authinfo();
      transaction.add(user, authinfo);
      store.persist(transaction).then(function(transaction){
        var nkeys;
        ok(transaction.entities && transaction.attributes, "Transaction entities and attributes.");
        equal(transaction.entities.length, 2, "Transaction should only have 2 entities.");
        nkeys = _.keys(transaction.entities[0]);
        deepEqual(nkeys.sort(), ['_id', '_fields', '_relationships', '_modified', '_new', '_runtime', 'modified', 'persisted'].sort(), "Entity has expected keys.");
        start();
      });
    });
  });
  users = [
    [
      "David Souther", "davidsouther@gmail.com", {
        username: "southerd",
        activated: "true",
        created: new Date(2011, 1, 15, 15, 34, 5).toJSON(),
        last_ip: "192.168.2.79"
      }
    ], [
      "JPorta", "jporta@example.com", {
        username: "portaj",
        activated: "true",
        created: new Date(2012, 1, 15, 15, 34, 5).toJSON(),
        last_ip: "192.168.2.80"
      }
    ], [
      "Niemants", "andrew@example.com", {
        username: "andrew",
        activated: "false",
        created: new Date(2012, 1, 17, 15, 34, 5).toJSON(),
        last_ip: "80.234.2.79"
      }
    ]
  ];
  asyncTest("ObjectStore", function(){
    expect(3);
    runtime.ready.done(function(){
      var store, transaction, i$, ref$, len$, u, user, authinfo;
      store = new JEFRi.Stores.ObjectStore({
        runtime: runtime
      });
      transaction = new JEFRi.Transaction();
      for (i$ = 0, len$ = (ref$ = users).length; i$ < len$; ++i$) {
        u = ref$[i$];
        user = runtime.build("User", {
          name: u[0],
          address: u[1]
        });
        authinfo = runtime.build("Authinfo", _.extend({
          authinfo_id: user.id()
        }, u[2]));
        user.authinfo(authinfo);
        transaction.add(user);
        transaction.add(authinfo);
      }
      store.persist(transaction).then(function(){
        _.when(store.get({
          _type: "User"
        }).then(function(results){
          equal(results.entities.length, 3, "Find users.");
        }), store.get({
          _type: "Authinfo",
          username: "southerd"
        }).then(function(results){
          equal(results.entities.length, 1, "Find southerd.");
        }), store.get({
          _type: "User",
          authinfo: {}
        }).then(function(results){
          equal(results.entities.length, 6, "Included authinfo relations.");
        })).done(function(){
          start();
        });
      });
    });
  });
});