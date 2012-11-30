<?php defined('SYSPATH') or die('No direct script access.');

/**
 * Users 
 * A model for the users entity.
 *
 */
class Model_Authsession extends Jefri_Model {
	//JEFRi ORM methods...
	public static function _primary(){return 'session_id';}
	public static function _model(){return 'Model_Authsession';}
	public static function _table(){return 'authsession';}

	public $session_id;
	public $last_ip;
	public $user_id;

}
