$(document).ready(function(){


module("Entity Context");


test("Unit Testing Environment", function () {
  expect(1);
  ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

test("Basic requirements", function() {
  expect(2);
  ok( JEFRi.EntityContext, "EntityContext" );

});

});