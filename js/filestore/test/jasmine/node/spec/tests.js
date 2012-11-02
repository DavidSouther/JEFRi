(function(){
  var JEFRi, FileStore;
  JEFRi = require("jefri");
  FileStore = require("../../../../lib/filestore");
  beforeEach(function(){
    this.addMatchers({
      toBeAwesome: function(){
        return this.actual === 'awesome';
      }
    });
  });
  describe("filestore", function(a){
    var runtime, filestore;
    runtime = new JEFRi.Runtime({
      debug: {
        context: {
          attributes: {},
          entities: {}
        }
      }
    });
    filestore = new JEFRi.FileStore({
      runtime: runtime
    });
    it("is awesome", function(){
      expect(filestore.awesome()).toBeAwesome();
    });
  });
}).call(this);
