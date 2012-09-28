/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
/*global isLocal:false*/

(function($){

module("DOM Merge");

test("Unit Testing Environment", function () {
	expect(1);
	ok( !isLocal, "Unit tests shouldn't be run from file://, especially in Chrome. If you must test from file:// with Chrome, run it with the --allow-file-access-from-files flag!" );
});

test("Merge", function (){
	var base, q = "<div><span class='d'></span></div>", a = "<div id='a'><div id='b'></div></div>", b = "<div id='a'><div id='c'><span><!--comment--></span></div></div><span class='e'></span>", c = "<!--Comment!-->";
	base = $(q);
	ok($.fn.merge, "jQuery has no DOM Merge plugin.");
	ok(base.merge($(a)).children("div").length === 1, "Appended first merge attempt.");
	ok(base.merge($(b)).children("div").length === 1, "Merged second merge attempt.");
	ok(base.children("#a").children().length === 2, "Appended merged children.");
	ok(base.children().length === 2, "Replaced default elements?");
	base.merge($(c));
	equal(base.html().match(/<!--/), null, "No comments in merged code.");
});

}(jQuery));
