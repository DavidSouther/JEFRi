// superscore - v0.2.5 - 2012-06-19
// https://github.com/DavidSouther/superscore
// Copyright (c) 2012 David Souther; Licensed MIT

//     superscore core.js 0.2.5
//     (c) 2012 David Souther
//     superscore is freely distributable under the MIT license.
//     For all details and documentation:
//     https://github.com/DavidSouther/superscore

(function(_, $){
"use strict";

// Missing from Underscore.
_.mixin({
	// ### indexBy*(list, func)*
	// The default underscore indexOf uses a literal value; we often want to use an comparator. This function returns the index of the first element in the list that the comparator returns truthy when evaluating, or -1 if no elements match.
	indexBy: function(list, func) {
		list = list || []; func = func || function(){return false;};
		for (var i = 0, l = list.length; i < l; i++) {
			if (func(list[i])){ return i; }
		}
		return -1;
	},

	// ### noop
	noop: function(){},

	// ### symmetricDifference*(set1, set2[, ...setN])*
	// The symmetric of two sets is is the set of elements in either set, but not their intersection.
	// If two sets are equal, the symmetric difference is empty.
	symmetricDifference: function(){
		return _.reduce(arguments, function(first, second){
			return _.union(
				_.difference(first, second),
				_.difference(second, first)
			);
		});
	},

	// ### deep*(object, path[, value[, overwrite]])*
	// Follow a path deep into an object, creating intermediate objects or arrays as necessary.
	// If value is specified, sets the value of that key if unset. If overwrite is true, sets
	// even if the value is already set. Returns the root object on set, or the current value
	// on get.
	deep: function(object, path, value, overwrite){
		overwrite = overwrite || false;
		value = value || null;

		// Break the path, if it's not already an array.
		path = _.isString(path) ? path.split('.') : _.isArray(path) ? path : [];
		// Get the next step
		var part = path.shift();
		// Different behavior depending on if we're at the last step
		if(path.length) {
			// More children, so make sure there's a container at the next level
			if(!object[part]){
				object[part] = !_.isNaN(+path[0]) ? [] : {};
			}
			// Recurse, returning either the object or the old value
			var next = _.deep(object[part], path, value, overwrite);
			return value ? object : next;
		} else {
			// If no value, return the part.
			if(!value){
				return object[part];
			} else {
				object[part] = overwrite ? value : (object[part] || value);
				return object;
			}
		}
	}
});

// ## Underscore Utilities
_._extend = _.extend;
var hasOwn = Object.prototype.hasOwnProperty;

// ### Underscore's extend doesn't do deep extension. Use jQuery's (^c/^v from jQuery core).
_.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !_.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) !== null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( _.isPlainObject(copy) || (copyIsArray = _.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && _.isArray(src) ? src : [];

					} else {
						clone = src && _.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = _.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}
	// Return the modified object
	return target;
};
_.isPlainObject = function( obj ) {
	// Must be an Object.
	// Because of IE, we also have to check the presence of the constructor property.
	// Make sure that DOM nodes and window objects don't pass through, as well
	if ( !obj || !_.isObject(obj) || obj.nodeType || _.isWindow( obj ) ) {
		return false;
	}

	try {
		// Not own constructor property must be Object
		if ( obj.constructor &&
			!hasOwn.call(obj, "constructor") &&
			!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}
	} catch ( e ) {
		// IE8,9 Will throw exceptions on certain host objects #9897
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.

	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

_.isWindow = $ ? $.isWindow : function( obj ) {
	return obj !== null && obj === obj.window;
};

}.call(this, _, jQuery || null));
//     superscore uuid.js 0.2.2
//     (c) 2012 David Souther
//     superscore is freely distributable under the MIT license.
//     For all details and documentation:
//     https://github.com/DavidSouther/superscore

(function(_){

// Build several namespaces, globally...
var UUID = {};
var Sha1 = function(str){return Sha1.hash(str, true);};
var Utf8 = {};


UUID.rvalid = /^\{?[0-9a-f]{8}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{4}\-?[0-9a-f]{12}\}?$/i;

UUID.v4 = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

UUID.v5 = function(msg, namespace) {
	var nst = bin(namespace || '00000000-0000-0000-0000-000000000000');

	var hash = Sha1.hash(nst + msg, true);
	var uuid =  hash.substring(0, 8) +	//8 digits
		'-' + hash.substring(8, 12)	+ //4 digits
//			// four most significant bits holds version number 5
		'-' + ((parseInt(hash.substring(12, 16), 16) & 0x0fff) | 0x5000).toString(16) +
//			// two most significant bits holds zero and one for variant DCE1.1
		'-' + ((parseInt(hash.substring(16, 20), 16) & 0x3fff) | 0x8000).toString(16) +
		'-' + hash.substring(20, 32);	//12 digits
	return uuid;
};

// Convert a string UUID to binary format.
//
// @param   string  uuid
// @return  string
var bin = function(uuid) {
	if ( ! uuid.match(UUID.rvalid))
	{	//Need a real UUID for this...
		return false;
	}

	// Get hexadecimal components of uuid
	var hex = uuid.replace(/[\-{}]/g, '');

	// Binary Value
	var bin = '';

	for (var i = 0; i < hex.length; i += 2)
	{	// Convert each character to a bit
		bin += String.fromCharCode(parseInt(hex.charAt(i) + hex.charAt(i + 1), 16));
	}

	return bin;
};

//  SHA-1 implementation in JavaScript | (c) Chris Veness 2002-2010
//             | www.movable-type.co.uk/scripts/sha256.html
//   - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
//         http://csrc.nist.gov/groups/ST/toolkit/examples.html

//var Sha1 = {};  // Sha1 namespace

// Generates SHA-1 hash of string
//
// @param {String} msg                String to be hashed
// @param {Boolean} [utf8encode=true] Encode msg as UTF-8 before generating hash
// @returns {String}                  Hash of msg as hex character string
Sha1.hash = function(msg, utf8encode) {
	var i, t;
	utf8encode =  (typeof utf8encode === 'undefined') ? true : utf8encode;

	// convert string to UTF-8, as SHA only deals with byte-streams
	if (utf8encode){ msg = Utf8.encode(msg); }

	// constants [§4.2.1]
	var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

	// PREPROCESSING

	msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

	// convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
	var l = msg.length/4 + 2;  // length (in 32-bit integers) of msg + ‘1’ + appended length
	var N = Math.ceil(l/16);   // number of 16-integer-blocks required to hold 'l' ints
	var M = new Array(N);

	for (i=0; i<N; i++) {
		M[i] = new Array(16);
		for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
			M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
				(msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
		} // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
	}
	// add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
	// note: most significant word would be (len-1)*8 >>> 32, but since JS converts
	// bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
	M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
	M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

	// set initial hash value [§5.3.1]
	var H0 = 0x67452301;
	var H1 = 0xefcdab89;
	var H2 = 0x98badcfe;
	var H3 = 0x10325476;
	var H4 = 0xc3d2e1f0;

	// HASH COMPUTATION [§6.1.2]

	var W = new Array(80); var a, b, c, d, e;
	for (i=0; i<N; i++) {

		// 1 - prepare message schedule 'W'
		for (t=0;  t<16; t++){ W[t] = M[i][t]; }
		for (t=16; t<80; t++){ W[t] = Sha1.ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1); }

		// 2 - initialise five working variables a, b, c, d, e with previous hash value
		a = H0; b = H1; c = H2; d = H3; e = H4;

		// 3 - main loop
		for (t=0; t<80; t++) {
			var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
			var T = (Sha1.ROTL(a,5) + Sha1.f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
			e = d;
			d = c;
			c = Sha1.ROTL(b, 30);
			b = a;
			a = T;
		}

		// 4 - compute the new intermediate hash value
		H0 = (H0+a) & 0xffffffff;  // note 'addition modulo 2^32'
		H1 = (H1+b) & 0xffffffff;
		H2 = (H2+c) & 0xffffffff;
		H3 = (H3+d) & 0xffffffff;
		H4 = (H4+e) & 0xffffffff;
	}

	return Sha1.toHexStr(H0) + Sha1.toHexStr(H1) +
		Sha1.toHexStr(H2) + Sha1.toHexStr(H3) + Sha1.toHexStr(H4);
};

/**
 * function 'f' [§4.1.1]
 */
Sha1.f = function(s, x, y, z)  {
	switch (s) {
	case 0: return (x & y) ^ (~x & z);           // Ch()
	case 1: return x ^ y ^ z;                    // Parity()
	case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
	case 3: return x ^ y ^ z;                    // Parity()
	}
};

/**
 * rotate left (circular left shift) value x by n positions [§3.2.5]
 */
Sha1.ROTL = function(x, n) {
	return (x<<n) | (x>>>(32-n));
};

/**
 * hexadecimal representation of a number
 *   (note toString(16) is implementation-dependant, and
 *   in IE returns signed numbers when used on full words)
 */
Sha1.toHexStr = function(n) {
	var s="", v;
	for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
	return s;
};


//  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple
//              single-byte character encoding (c) Chris Veness 2002-2010

//var Utf8 = {};  // Utf8 namespace

// Encode multi-byte Unicode string into utf-8 multiple single-byte characters
// (BMP / basic multilingual plane only)
//
// Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
//
// @param {String} strUni Unicode string to be encoded as UTF-8
// @returns {String} encoded string
Utf8.encode = function(strUni) {
	// use regular expressions & String.replace callback function for better efficiency
	// than procedural approaches
	var strUtf = strUni.replace(
			/[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
			function(c) {
				var cc = c.charCodeAt(0);
				return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
		);
	strUtf = strUtf.replace(
			/[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
			function(c) {
				var cc = c.charCodeAt(0);
				return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
		);
	return strUtf;
};

// Decode utf-8 encoded string back into multi-byte Unicode characters
//
// @param {String} strUtf UTF-8 string to be decoded back to Unicode
// @returns {String} decoded string
Utf8.decode = function(strUtf) {
	// note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
	var strUni = strUtf.replace(
			/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
			function(c) {  // (note parentheses for precence)
				var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f);
				return String.fromCharCode(cc); }
		);
	strUni = strUni.replace(
			/[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
			function(c) {  // (note parentheses for precence)
				var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
				return String.fromCharCode(cc); }
		);
	return strUni;
};

// UUID, etc are objects that need to be attached to _, not functions to be mixed in.
_.extend(_, {
	'UUID': UUID,
	'Utf8': Utf8,
	'Sha1': Sha1
});

}.call(this, _));

//     superscore deferred.js 0.2.0
//     (c) 2012 David Souther
//     superscore is freely distributable under the MIT license.
//     For all details and documentation:
//     https://github.com/DavidSouther/superscore

(function(_){
	var flagsCache = {};
	// Convert String-formatted flags into Object-formatted ones and store in cache
	function createFlags( flags ) {
			var object = flagsCache[ flags ] = {},
					i, length;
			flags = flags.split( /\s+/ );
			for ( i = 0, length = flags.length; i < length; i++ ) {
					object[ flags[i] ] = true;
			}
			return object;
	}

	// Save references to some utilities
	var slice = Array.prototype.slice;

	_.Callbacks = function( flags ) {

		// Convert flags from String-formatted to Object-formatted
		// (we check in cache first)
		flags = flags ? ( flagsCache[ flags ] || createFlags( flags ) ) : {};

		var // Actual callback list
			list = [],
			// Stack of fire calls for repeatable lists
			stack = [],
			// Last fire value (for non-forgettable lists)
			memory,
			// Flag to know if list was already fired
			fired,
			// Flag to know if list is currently firing
			firing,
			// First callback to fire (used internally by add and fireWith)
			firingStart,
			// End of the loop when firing
			firingLength,
			// Index of currently firing callback (modified by remove if needed)
			firingIndex,
			// Add one or several callbacks to the list
			add = function( args ) {
				var i,
					length,
					elem,
					type,
					actual;
				for ( i = 0, length = args.length; i < length; i++ ) {
					elem = args[ i ];
					if ( _.isArray(elem) ) {
						// Inspect recursively
						add( elem );
					} else if ( _.isFunction(elem) ) {
						// Add if not in unique mode and callback is not in
						if ( !flags.unique || !self.has( elem ) ) {
							list.push( elem );
						}
					}
				}
			},
			// Fire callbacks
			fire = function( context, args ) {
				args = args || [];
				memory = !flags.memory || [ context, args ];
				fired = true;
				firing = true;
				firingIndex = firingStart || 0;
				firingStart = 0;
				firingLength = list.length;
				for ( ; list && firingIndex < firingLength; firingIndex++ ) {
					if ( list[ firingIndex ].apply( context, args ) === false && flags.stopOnFalse ) {
						memory = true; // Mark as halted
						break;
					}
				}
				firing = false;
				if ( list ) {
					if ( !flags.once ) {
						if ( stack && stack.length ) {
							memory = stack.shift();
							self.fireWith( memory[ 0 ], memory[ 1 ] );
						}
					} else if ( memory === true ) {
						self.disable();
					} else {
						list = [];
					}
				}
			},
			// Actual Callbacks object
			self = {
				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {
						var length = list.length;
						add( arguments );
						// Do we need to add the callbacks to the
						// current firing batch?
						if ( firing ) {
							firingLength = list.length;
						// With memory, if we're not firing then
						// we should call right away, unless previous
						// firing was halted (stopOnFalse)
						} else if ( memory && memory !== true ) {
							firingStart = length;
							fire( memory[ 0 ], memory[ 1 ] );
						}
					}
					return this;
				},
				// Remove a callback from the list
				remove: function() {
					if ( list ) {
						var args = arguments,
							argIndex = 0,
							argLength = args.length;
						for ( ; argIndex < argLength ; argIndex++ ) {
							for ( var i = 0; i < list.length; i++ ) {
								if ( args[ argIndex ] === list[ i ] ) {
									// Handle firingIndex and firingLength
									if ( firing ) {
										if ( i <= firingLength ) {
											firingLength--;
											if ( i <= firingIndex ) {
												firingIndex--;
											}
										}
									}
									// Remove the element
									list.splice( i--, 1 );
									// If we have some unicity property then
									// we only need to do this once
									if ( flags.unique ) {
										break;
									}
								}
							}
						}
					}
					return this;
				},
				// Control if a given callback is in the list
				has: function( fn ) {
					if ( list ) {
						var i = 0,
							length = list.length;
						for ( ; i < length; i++ ) {
							if ( fn === list[ i ] ) {
								return true;
							}
						}
					}
					return false;
				},
				// Remove all callbacks from the list
				empty: function() {
					list = [];
					return this;
				},
				// Have the list do nothing anymore
				disable: function() {
					list = stack = memory = undefined;
					return this;
				},
				// Is it disabled?
				disabled: function() {
					return !list;
				},
				// Lock the list in its current state
				lock: function() {
					stack = undefined;
					if ( !memory || memory === true ) {
						self.disable();
					}
					return this;
				},
				// Is it locked?
				locked: function() {
					return !stack;
				},
				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( stack ) {
						if ( firing ) {
							if ( !flags.once ) {
								stack.push( [ context, args ] );
							}
						} else if ( !( flags.once && memory ) ) {
							fire( context, args );
						}
					}
					return this;
				},
				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},
				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};

		return self;
	};

	_.Deferred = function( func ) {
		var doneList = _.Callbacks( "once memory" ),
			failList = _.Callbacks( "once memory" ),
			progressList = _.Callbacks( "memory" ),
			state = "pending",
			lists = {
					resolve: doneList,
					reject: failList,
					notify: progressList
			},
			promise = {
					done: doneList.add,
					fail: failList.add,
					progress: progressList.add,

					state: function() {
							return state;
					},

					// Deprecated
					isResolved: doneList.fired,
					isRejected: failList.fired,

					then: function( doneCallbacks, failCallbacks, progressCallbacks ) {
							deferred.done( doneCallbacks ).fail( failCallbacks ).progress( progressCallbacks );
							return this;
					},
					always: function() {
							deferred.done.apply( deferred, arguments ).fail.apply( deferred, arguments );
							return this;
					},
					pipe: function( fnDone, fnFail, fnProgress ) {
							return _.Deferred(function( newDefer ) {
									_.each( {
											done: [ fnDone, "resolve" ],
											fail: [ fnFail, "reject" ],
											progress: [ fnProgress, "notify" ]
									}, function( data, handler ) {
											var fn = data[ 0 ],
													action = data[ 1 ],
													returned;
											if ( _.isFunction( fn ) ) {
													deferred[ handler ](function() {
															returned = fn.apply( this, arguments );
															if ( returned && _.isFunction( returned.promise ) ) {
																	returned.promise().then( newDefer.resolve, newDefer.reject, newDefer.notify );
															} else {
																	newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
															}
													});
											} else {
													deferred[ handler ]( newDefer[ action ] );
											}
									});
							}).promise();
					},
					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
							if ( !obj ) {
									obj = promise;
							} else {
									for ( var key in promise ) {
											obj[ key ] = promise[ key ];
									}
							}
							return obj;
					}
			},
			deferred = promise.promise({}),
			key;

			for ( key in lists ) {
					deferred[ key ] = lists[ key ].fire;
					deferred[ key + "With" ] = lists[ key ].fireWith;
			}

			// Handle state
			deferred.done( function() {
				state = "resolved";
			}, failList.disable, progressList.lock ).fail( function() {
				state = "rejected";
			}, doneList.disable, progressList.lock );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
	};

	// Deferred helper
	_.when = function( firstParam ) {
		var args = slice.call( arguments, 0 ),
			i = 0,
			length = args.length,
			pValues = new Array( length ),
			count = length,
			pCount = length,
			deferred = length <= 1 && firstParam && _.isFunction( firstParam.promise ) ?
					firstParam :
					_.Deferred(),
			promise = deferred.promise();
		function resolveFunc( i ) {
			return function( value ) {
				args[ i ] = arguments.length > 1 ? slice.call( arguments, 0 ) : value;
				if ( !( --count ) ) {
					deferred.resolveWith( deferred, args );
				}
			};
		}
		function progressFunc( i ) {
			return function( value ) {
				pValues[ i ] = arguments.length > 1 ? slice.call( arguments, 0 ) : value;
				deferred.notifyWith( promise, pValues );
			};
		}
		if ( length > 1 ) {
			for ( ; i < length; i++ ) {
				if ( args[ i ] && args[ i ].promise && _.isFunction( args[ i ].promise ) ) {
					args[ i ].promise().then( resolveFunc(i), deferred.reject, progressFunc(i) );
				} else {
					--count;
				}
			}
			if ( !count ) {
				deferred.resolveWith( deferred, args );
			}
		} else if ( deferred !== firstParam ) {
			deferred.resolveWith( deferred, length ? [ firstParam ] : [] );
		}
		return promise;
	};

}.call(this, _));
//     superscore pubsub.js 0.2.3
//     (c) 2012 David Souther
//     superscore is freely distributable under the MIT license.
//     For all details and documentation:
//     https://github.com/DavidSouther/superscore

(function(_, $){
"use strict";

// ## Pubsub with jQuery-backed eventing
// This eventing library uses pubsub channels attached to specific object instances.
// If a channel is used with an object, it becomes associated implicitly with that object.
// If a channel is used without an object, it is in the global pubsub scope.
_.mixin({
	// ### on*([object, ]event, callback)*
	// Register a function to get called when a certain event is published.
	// Any event handlers attached after an event has been triggered at least once will
	// immediately be called with the most recently triggered value.
	on: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && $){return $(obj).on(event, callback); }

		// Use internal handler for pubsub
		if(this.isString(obj)) {callback = event; event = obj; obj = this; }

		// Ensure a container is available for all events.
		if(!this.isObject(obj.__event_handlers)){ obj.__event_handlers = {}; }
		// Ensure a handler is available for this particular event.
		if (!(event in obj.__event_handlers)) {
			// Using a memory callback
			obj.__event_handlers[event] = _.Callbacks("memory");
		}
		obj.__event_handlers[event].add(callback);
		return this;
	},
	// ### once*([object, ]event, callback)*
	// Register a function that will be called a single time when the event is published.
	once: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && $){return $(obj).one(event, callback); }

		// Turn the callback into a callback that will remove itself after getting execute.
		var removeEvent = function() { _.off(obj, event, callback); };
		callback = _.compose(removeEvent, callback);

		// Register the self-removing callback normally.
		this.on(obj, event, callback);
	},
	// ### trigger*([object, ]event, args)*
	// Publish an event, passing args to each function registered. Each callback will
	// be executed with `obj` as their `this` context.
	trigger: function(obj, event, args) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && $){return $(obj).trigger(event, args); }

		// Use internal handler for pubsub
		if(this.isString(obj)) {args = event; event = obj; obj = this; }

		// If there aren't any handlers for this event, don't do anything.
		if(this.isObject(obj.__event_handlers) && event in obj.__event_handlers) {
			obj.__event_handlers[event].fireWith(obj, args);
		}
		return this;
	},
	// ### off*([object, ]event, callback)*
	// Remove a certain callback from an event chain.
	off: function(obj, event, callback) {
		// Use jQuery to handle DOM events.
		if(_.isElement(obj) && $){ return $(obj).off(event, callback); }

		// Use internal handler for pubsub
		if(this.isString(obj)) { event = obj; obj = this; }

		// If there aren't any handlers for this event, don't do anything.
		if(this.isObject(obj.__event_handlers) && event in obj.__event_handlers) {
			obj.__event_handlers[event].remove(callback);
		}
		return this;
	}
});

}.call(this, _, jQuery || null));
//     superscore ajax.js 0.2.0
//     (c) 2012 David Souther
//     superscore is freely distributable under the MIT license.
//     For all details and documentation:
//     https://github.com/DavidSouther/superscore

(function(_, $){
"use strict";

// ## Ajax, through jQuery if possible.
var ajax = $ ? $.ajax : function (options){
	var xhr, XHR, d = _.Deferred();

	// Nice clean way to get an xhr
	XHR = window.ActiveXObject || XMLHttpRequest;
	xhr = new XHR('Microsoft.XMLHTTP');

	// Probably a GET requst, unless there is data or something else is specified.
	xhr.open(options.type || (options.data ? 'POST' : 'GET'), options.url, true);

	// Most likely sending text/plain
	if ('overrideMimeType' in xhr) {
		xhr.overrideMimeType(options.dataType || 'text/plain');
	}

	// Handle state changes.
	xhr.onreadystatechange = function() {
		var _ref;
		if (xhr.readyState === 4) {
			if ((_ref = xhr.status) === 0 || _ref === 200) {
				// Resolve on success.
				d.resolve(xhr.responseText);
			} else {
				// Reject on failure.
				d.reject(new Error("Could not load " + options.url));
			}
			return;
		}
		// Notify for any other events.
		d.notify(xhr);
	};

	// We'll need to set headers to send the data.
	if(options.data){
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Content-length", options.data.length);
		xhr.setRequestHeader("Connection", "close");
	}

	// Execute the request.
	xhr.send(options.data || null);

	// No need to return the entire XHR request.
	return d.promise();
};

// ### get*(url[, options])*
// Shorthand for a GET request.
var get = $ ? $.get : function(url, options){
	options = options || {};
	options.url = url;
	options.type = 'GET';
	options.data = null;
	return _.ajax(options);
};

// ### post*(url[, options])*
// Shorthand for a POST request.
var post = $ ? $.post : function(url, options){
	options = options || {};
	options.url = url;
	options.type = 'POST';
	return _.ajax(options);
};

// Add these to underscore.
_.mixin({
	ajax: ajax,
	get: get,
	post: post
});


}.call(this, _, jQuery || null));

/*global window:false, XMLHttpRequest:false*/
