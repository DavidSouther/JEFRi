<?php defined('SYSPATH') or die('No direct script access.');

/**
 * Users 
 * A model for the users entity.
 *
 */
class Model_User extends Jefri_Model {
	//JEFRi ORM methods...
	public static function _primary(){return 'user_id';}
	public static function _model(){return 'Model_User';}
	public static function _table(){return 'users';}

	/**
	 * Data fields for users.
	 */
	public $user_id = -1;
	public $email = "";
	public $name = "";
	public $password = "";
	public $title = "";
	public $given_name = "";
	public $nationality = "";

	public function __construct($data = null) {
		if(!isset($data['user_id']))
		{	//Use UUIDv5
			$data['user_id'] = UUID::v5(UUID::NIL, $data['email']);
		}
		parent::__construct($data);
		if(is_array($data) && isset($data['authinfo']))
		{
			$this->set_authinfo(new Model_Authinfo($data['authinfo']));
		}
	}

	public function name() {
		return ((!empty($this->given_name))?$this->given_name . " ":"").  $this->surname;
	}

	public function save($debug = false) {
		$saved = TRUE;

		//Check if the password is in a raw format
		//\007 is ASCII bell and generally untypable, so it's a good sentinel.
		if($this->_new)
		{
			$this->password = self::hash($this->password);
		}
#		if(strpos($this->password, "\007") !== 0)
#		{	//The sentinel is not set, so hash it.
#			$this->password = self::hash($this->password);
#		}

		Transaction::begin($this, $debug);

		try
		{	//Do this safely
			$saved = $saved && parent::save($debug);

			$this->get_authinfo()->user_id = $this->user_id;
			$saved = $saved && $this->get_authinfo()->save($debug);
		}
		catch (ErrorException $e)
		{	//Don't care where the exception was, the entire thing's bad
			$saved = false;
			if($debug){echo Kohana::debug($e);}
		}

		if(!$saved)
		{	//Sad day. Rollback! $debug should have handled printing the error.
			Transaction::rollback($this, $debug);
		}
		else
		{	//Yay! Happy days. 
			Transaction::commit($this, $debug);
		}

		return $saved;
	}

	/**
	 * Prep this entity to get shipped.
	 */
	public function encode(Jefri_Entity_Writer $writer, $deep = true) {
		$context = Jefri_Entity_Context::instance();
		$def = $context->entity_definition($this);
		foreach($def->properties as $prop)
		{	//Save all the properties
			$name = $prop->name;
			if($name !== 'password')
			{	//Don't need to send the PW
				$writer->add_property($this, $name, $this->$name);
			}
		}
		if($deep)
		{
			foreach($def->relationships as $relationship)
			{	//Add all the relationships
				$single = (strstr($relationship->type, '_a') !== false);
				$prop =  'get_' . $relationship->name;
				if($single)
				{	//Add the one prop
					$props = array($this->$prop(false))?:array();;
				}
				else
				{	// Add the group
					$props = $this->$prop(false)?:array();;
				}

				foreach($props as $p)
				{	//Let the writer recurse!
					$writer->add_entity($p);
				}
			}
		}
	}

	public static function authenticate($user, $pass) {
		$pass = self::hash($pass);
		$user = Model_User::get_first(array(
			'email' => $user,
			'password' => $pass
		));
		return $user;
	}

	public static function hash($word) {
		$salt = Kohana::config('jefri/module/authentication.salt');
		$pepper = Kohana::config('jefri/module/authentication.passes');
		for($i=0; $i<$pepper; $i++)
		{	//Suck it, rainbow tables.
			$word = hash("sha256", $word . $salt);
		}
		return $word;
	}
}
