<?php defined('SYSPATH') or die('No direct script access.');

/**
 *
 * @package Popo
 */
abstract class Jefri_Model_Error extends Prototype {
	public $field = "";
	public $message = "";
	public $params = null;
}
