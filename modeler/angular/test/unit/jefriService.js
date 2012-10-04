describe('JEFRi Service', function(){
	beforeEach(module('jefri'));

	describe('JEFRi', function(){
		it('should make JEFRi accessible', inject(function(JEFRi){
			expect(JEFRi.build);
		}));
	});
});