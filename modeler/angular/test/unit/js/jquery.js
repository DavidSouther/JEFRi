describe('jQuery service', function(){
  beforeEach(module('jquery'));
  describe('jQuery', function(a){
    it('Should provide jQuery', inject(function(jQuery){
      expect(jQuery);
      expect(window.jQuery);
    }));
    it('should not expose $', inject(function(jQuery){
      expect(window.$).not;
    }));
  });
});