<?php defined('SYSPATH') or die('No direct script access.');

class Jefri_Module_Authentication_Core extends Jefri_Module_Base {

	private static $_instance = null;
	public static function instance() {
		if(self::$_instance === null)
		{	//Need to get a new one...
			self::$_instance = new Jefri_Module_Authentication_Core();
		}
		return self::$_instance;
	}

	private $user = null;

	/**
	 * Protect the users, Tron!
	 */
	public function get_user(){
		return $user;
	}

	/**
	 * Called from the controller. Have data from a request, need to handle it.
	 */
	public function execute($data) {
		if(isset($data->login))
		{	//Trying to start a session
			$this->user = $data->user = Model_User::authenticate($data->user, $data->pass);
			unset($data->pass);
			if($this->user !== null)
			{	//Found a valid user, start a session
				$session = new Model_Authsession(array(
					'user_id' => $this->user->user_id,
					'last_ip' => Request::$client_ip,
				));
				$session->save();
				$data->session_id = $session->session_id;
				return $data;
			}
			else
			{
				unset($data->user);
				$data->login = false;
				return $data;
			}
		}
		elseif(isset($data->session_id))
		{	//Continuing a session
			$session = Model_Authsession::get_empty(array(
				'session_id' => $data->session_id,
				'last_ip' => Request::$client_ip,
			), NULL, FALSE);
			if(count($session) == 1)
			{	//Got a valid session
				$session = array_pop($session);
				$this->user = Model_User::get_first($session->user_id, true);
#				$data->user_id = $this->user->user_id;
			}
			else
			{
				$data = array('logout' => true);
			}
			return $data;
		}
		else
		{
			return array("farce" => "popsicle");
		}
	}

}
