<?php defined('SYSPATH') or die('No direct access allowed!'); 

/**
 * @group JEFRi Authentication
 */
class AuthTest extends Kohana_UnitTest_TestCase {
	/**
	 * @test
	 */ 
	public function newUser() {
		$user = new Model_User(array(
			'email' => 'davidsouther@gmail.com',
			'name' => 'Souther',
			'password' => 'qwer',
			'given_name' => 'David',
			'nationality' => 'USA'
		));
		echo Kohana::debug($user);
		$saved = $user->save(true);
		$this->assertTrue($saved);
	}
}
