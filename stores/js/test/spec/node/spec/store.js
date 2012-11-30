(function(){
  var jefri;
  jefri = require('../../../../lib/jefri.js');
  describe("JEFRi ObjectStore", function(a){
    it("Returns deeply nested graphs", function(){
      var done;
      done = false;
      runs(function(){
        var runtime, s;
        runtime = new jefri.Runtime("http://localhost:8000/test/qunit/min/context/jefri.json");
        s = new jefri.ObjectStore({
          runtime: runtime
        });
        runtime.ready.then(function(){
          var transaction;
          transaction = new jefri.Transaction();
          transaction.add([
            {
              "_type": "Context",
              "_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
              "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
              "name": "DEFAULT_CONTEXT"
            }, {
              "_type": "Entity",
              "_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
              "name": "Host",
              "key": "host_id"
            }, {
              "_type": "Property",
              "_id": "b010d17a-6af2-4f6c-bf52-7a25bf53bdd5",
              "property_id": "b010d17a-6af2-4f6c-bf52-7a25bf53bdd5",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "name": "host_id",
              "type": "string"
            }, {
              "_type": "Property",
              "_id": "1a7ffa49-24e3-42c6-9a3e-7d35d53c88ba",
              "property_id": "1a7ffa49-24e3-42c6-9a3e-7d35d53c88ba",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "name": "hostname",
              "type": "string"
            }, {
              "_type": "Property",
              "_id": "dcfe2ec7-ab94-41d8-b0e4-d782e5411bcb",
              "property_id": "dcfe2ec7-ab94-41d8-b0e4-d782e5411bcb",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "name": "ip",
              "type": "string"
            }, {
              "_type": "Property",
              "_id": "17aed1ce-7979-436b-9366-1f0911f53266",
              "property_id": "17aed1ce-7979-436b-9366-1f0911f53266",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "name": "mac",
              "type": "string"
            }, {
              "_type": "Property",
              "_id": "a21c53d3-f0b3-45f5-837b-722682bc8f8c",
              "property_id": "a21c53d3-f0b3-45f5-837b-722682bc8f8c",
              "entity_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "name": "router_id",
              "type": "string"
            }, {
              "_type": "Relationship",
              "_id": "89d1be07-3459-4b7b-b15f-ab9a5379466a",
              "relationship_id": "89d1be07-3459-4b7b-b15f-ab9a5379466a",
              "name": "router",
              "type": "has_a",
              "to_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "to_property": "router_id",
              "from_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "from_property": "router_id",
              "back": "hosts"
            }, {
              "_type": "Entity",
              "_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "context_id": "aaa227c8-353c-4ffb-9252-40c4d99d25bc",
              "name": "Router",
              "key": "router_id"
            }, {
              "_type": "Property",
              "_id": "d8d42791-9dc7-4208-bb44-0c51ad1775d9",
              "property_id": "d8d42791-9dc7-4208-bb44-0c51ad1775d9",
              "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "name": "router_id",
              "type": "string"
            }, {
              "_type": "Property",
              "_id": "21dfa81b-4b73-496f-a4df-f798c9336c9a",
              "property_id": "21dfa81b-4b73-496f-a4df-f798c9336c9a",
              "entity_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "name": "name",
              "type": "string"
            }, {
              "_type": "Relationship",
              "_id": "fbaf51e3-de97-4bc0-b7b4-34ef05b1fd2e",
              "relationship_id": "fbaf51e3-de97-4bc0-b7b4-34ef05b1fd2e",
              "name": "hosts",
              "type": "has_many",
              "to_id": "d8fcce7e-d0fc-44e8-bef4-92fc73c9f9f6",
              "to_property": "router_id",
              "from_id": "26631940-3166-44d8-bdaf-d52a1c56b6d1",
              "from_property": "router_id",
              "back": "router"
            }
          ], true);
          s.persist(transaction).then(function(data){
            var transaction;
            transaction = new jefri.Transaction();
            transaction.add({
              "_type": 'Context',
              "entities": {
                "properties": {},
                "relationships": {}
              }
            });
            s.get(transaction).then(function(data){
              expect(data.entities.length).toBe(12, "Got all entities back.");
              done = true;
            });
          });
        });
      });
      waitsFor(function(){
        return done;
      });
    });
  });
}).call(this);
