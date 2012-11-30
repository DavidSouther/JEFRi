<?php defined('SYSPATH') or die('No direct script access.');

/**
 *	CHANGING ANYTHING WILL INVALIDATE ALL PASSWORDS. IF YOU CHANGE ANYTHING IN
 *	THIS FILE ON A PRODUCTION SERVER, YOU WILL BE HOUNDED BY EXTREMELY PISSED
 *	OFF SYSADS AND USERS. DON'T CHANGE THIS FILE.
 */
return array(
	# dd if=/dev/urandom bs=1 count=16 | base64
	'salt' => 'vI3E9SkemmdYhOE+zSGTkw==',
	'passes' => 3,
);
