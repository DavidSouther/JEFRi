console.log("In test");
describe("JEFRi", function(a){
  var JEFRi;
  console.log("Requiring jefri");
  JEFRi = require("jefri");
  it("Can instantiate", function(){
    expect(JEFRi).toBeDefined();
  });
});