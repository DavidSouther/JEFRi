<?php defined('SYSPATH') or die('No direct script access.');

abstract class Jefri_Module_Base {
#	abstract public static function instance();
	abstract public function execute($data);
}
