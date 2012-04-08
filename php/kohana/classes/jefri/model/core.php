<?php defined('SYSPATH') or die('No direct script access.');

/**
 *
 *
 * @package Popo
 */
abstract class Jefri_Model_Core extends Prototype {
	/**
	 * Return the name of the property that serves as the model's primary key,
	 * or the empty string.
	 */
	protected static function _primary(){return '';}

	/**
	 * Return the name of the database table for this class.
	 */
	public static function _table(){return '';}

	/**
	 * Return the name of the class to build from data.
	 */
	protected static function _model(){return '';}

	/**
	 * Default property for getting a name from.
	 */
	protected static function _name() {return "";}

	/**
	 * Translate from object properties to database columns.
	 */
	public static function _lookup($key) {
		if(strpos($key, '.') === false)
		{	//Need to prepend the table name
			$key = static::_table() . '.' . $key;
		}
		return $key;
	}

	/**
	 * Return an array of validation rules for the model.
	 */
	protected function _rules() {
		return array();
		//TODO look up rules from Context
	}

	/**
	 * Return a default string value for this model. NOT a full view, just enough
	 * for a naive request to get useful data.
	 */
	public function name() {
		//Default from CRUDder is first non-primary, non-key field.
		$name = $this->_name();
		//return $this->$name ?: "No name";
		return isset($this->$name) ? $this->$name : "No name";
	}

	/**
	 * Return the ID
	 */
	public function id() {
		$pk = static::_primary();
		return $this->$pk;
	}

	public function _path() {
		return $this->_definition()->name . '/' . $this->id();
	}

	protected $_new = FALSE;
	protected $_errors = array();

	/**
	 * Default constructor, with optional copy-ctor parameters.
	 */
	function __construct($data = NULL) {
		$def = $this->_definition();
		foreach($def->properties as $property)
		{	//Make sure all our fields are available
			$p = $property->name;
			if(!isset($this->$p))
			{	//Give it a default value...
				$this->$p = "";
			}
		}
		parent::__construct($data);
		$_p = static::_primary();
		if(null == $data || !isset($data->__new) || true == $data->__new)
		{	//Set _new to true if no data was provided or if data->_new is true
			$this->_new = true;
			//Not set, need to set it. Empty, need to set. -1, common default, need to set.
			if(!isset($this->$_p) || !($this->$_p) || $this->$_p == -1)
			{	//generate a UUID if not set already
				K::$log->add(Kohana::INFO, "Reseting primary from " . Debug::obj($this->$_p, true));
				$this->$_p = UUID::v4();
			}
		}
	}

	/**
	 * Verify that the object as is satisfies validation rules.
	 */
	public function _check($debug = false) {
		if(empty($this->_errors))
		{	//Make sure we haven't already validated.
			$rules = $this->_rules();
			foreach($rules as $field => $field_rules)
			{	//Go through each of the rules
				try
				{	//Safely get the value of the field.
					$value = $this->$field;
				}
				catch (ErrorException $e)
				{	//Sensible default- "required" etc rules will take care of the rest.
					$value = "";
				}

				foreach($field_rules as $rule)
				{	//Go through the rules
					$params = array();

					if(is_array($rule))
					{	//
						$params[] = array_pop($rule);
						$rule = array_shift($rule);
					}
					array_unshift($params, $value);

					$pass = TRUE; //Assume true if there's no rule.
					if(method_exists('Validate', $rule))
					{	// Use a method from the Validate class
						$method = new ReflectionMethod('Validate', $rule);
						$pass = $method->invokeArgs(NULL, $params);
					}

					if(FALSE === $pass)
					{	//Rule failed
						array_shift($params);
						$this->_error($field, $value, $params);
						if($debug)	//TODO use logging framework
						{	//Log it
							echo "<pre>Failed: $field with $value</pre>\n";
						}
					}
				}
			}
		}
		//TODO this should be in a logging class somewhere
		if($debug){echo Kohana::debug($this->_errors);}
		return empty($this->_errors);
	}

	/**
	 * Private method to set an error on a field.
	 */
	function _error($field, $value, $params = null) {
		$this->_errors[] = new Jefri_Error(
			array('field' => $field, 'message' => $value, 'params' => $params)
		);
		return $this;
	}

	/**
	 * Getter for the errors
	 */
	function errors() {
		return $this->_errors;
	}

	/**
	 * Reset the object instance to a known good state.
	 * Useful for batch updates.
	 */
	public function reset() {
		$this->_errors = array();
		$this->_new = true;
		$_p = $this->_primary();
		$this->$_p = -1;

		$def = $this->_definition();
		foreach($def->relationships as $rel)
		{	//Check for all is_a relationships to save.
			if("is_a" === $rel->type)
			{	//It is, so save up the chain
				$field = "get_" . $rel->to->vname;
				$field = $this->$field();
				$field->reset();
			}
		}

		return $this;
	}

	public function equals($entity) {
		$fields = static::_definition()->properties;
		foreach($fields as $property)
		{	//Check on a per-property level
			$field = $property->name;
			if( !$this->_equal($entity, $field))
			{	//Bail as early as possible
				return FALSE;
			}
		}
		return TRUE;
	}

	private function _equal($entity, $field) {
		$property = Arr::get($entity, $field);
		$field = $this->$field;
		if(NULL === $property)
		{	//Bail, not checking.
			return true;
		}

		if(is_array($property))
		{	//We have a variety of values we might want
			foreach($proprety as $prop)
			{	//Check if it's any one of these
				if($field === $prop)
				{	//Hey, we found a match!
					return true;
				}
			}
		}
		else
		{	//Just a scalar...
			return $field === $property;
		}
		return false;
	}

	/**
	 * Get an array of this entity.
	 *
	 * @param   mixed    where clause describing returned entities.
	 * @param   array    pageination bounds
	 * @param   boolean  Whether to print debug info for the query.
	 *
	 * @return  mixed    array with one or all the entities.
	 */
	public static function get($where = NULL, $page = NULL, $save = TRUE, $debug = FALSE) {
		return Jefri_Entity_Context::instance()->get(static::_entity_type(), $where, $page, $save, $debug);;
	}

	/**
	 * Get an array of these entities, possibly empty.
	 *
	 * @param   mixed    where clause describing returned entities.
	 * @param   array    pageination bounds
	 * @param   boolean  Whether to print debug info for the query.
	 *
	 * @return  mixed    array with one or all the entities.
	 */
	public static function get_first($where = NULL, $intern = true, $save = FALSE, $debug = FALSE) {
		return Jefri_Entity_Context::instance()->get_first(static::_entity_type(), $where, $save, $debug);;
	}

	/**
	 * Return a single instance of this entity, as described by the $where
	 * prototype. If the object is set in the DB, its UUID will filled.
	 * Otherwise, its properties will be filled from the $where prototype, but
	 * with a sentinel uuid.
	 * 
	 * @param   mixed    where clause describing the returned entity.
	 * @param   boolean  whether to print debug info for the query.
	 *
	 * @return  mixed    the prototyped entity.
	 */
	public static function get_empty($where = NULL, $page = NULL, $save = TRUE, $debug = FALSE) {
		return Jefri_Entity_Context::instance()->get_empty(static::_entity_type(), $where, $page, $save, $debug);;
	}

	/**
	 * Update or insert the given entity.
	 *
	 * @param    mixed    Entity prototype to request, update, and persist.
	 */
	public static function update($data = NULL, $debug = false) {
		return Jefri_Entity_Context::instance()->update(static::_entity_type(), $data, $debug);;
	}

	/**
	 * Persist the current state of the entity.
	 */
	public function save($debug = FALSE) {
		$_primary = $this->_primary();
		$saved = TRUE;

		if(!$this->_check())
		{	//Passed our checks?
			return TRUE;
		}
		if($debug){echo "<pre>Passed checks...</pre>\n";}

		Transaction::begin($this, $debug);

		try
		{	//Do this safely
			$def = static::_definition();
			foreach($def->relationships as $rel)
			{	//Check for all is_a relationships to save.
				if("is_a" === $rel->type)
				{	//It is, so save up the chain
					$field = "get_" . $rel->to->vname;
					$field = $this->$field();
					$saved = $saved && $field->save($debug);
					if($saved)
					{	//Update the pk from the parent...not!!!
						//$this->$_primary = $field->id();
					}
				}
			}

			$saved = $saved && $this->_save($debug);
		}
		catch (ErrorException $e)
		{	//Don't care where the exception was, the entire thing's bad
			$saved = false;
			if($debug){
				echo Kohana::debug($e);
			}
			else
			{
				throw $e;
			}
		}

		if(!$saved)
		{	//Sad day. Rollback! $debug should have handled printing the error.
			Transaction::rollback($this, $debug);
		}
		else
		{	//Yay! Happy days. 
			Transaction::commit($this, $debug);
		}

		if(!$saved && $debug) {
			echo Kohana::debug("NOT SAVED", $this);
		}

		return $saved;
	}

	private function _save($debug = true) {
		$_primary = $this->_primary();
		$vars = array();
		$fields = array();

		// TODO Replace with definition
		foreach($this as $k => $v)
		{	//Prep each property to get persisted.
			if (static::_property($k) !== FALSE)
			{	//The field is defined in the context
				$fields[] = $k;
				$vars[$k] = $v;
			}
		}

		$query = NULL;
		if($this->_new)
		{	//New means insert.
			$query = DB::insert($this->_table(), $fields)->values($vars);
		}
		else
		{	//Updating!
			$query = DB::update($this->_table(), $this)
				->set($vars)
				->where($_primary, '=', $this->$_primary);
		}
		//TODO this should be in a logging class somewhere
		if($debug){echo Kohana::debug($query->compile(Database::instance()))."\n";}

		$query->execute();

		$this->_new = FALSE;
		return TRUE;
	}

	/**
	 * Permanently remove this entity from existence.
	 */
	public function delete() {
		$_primary = $this->_primary();
		$query = DB::delete($this->_table(), $this)
			->where($_primary, '=', $this->$_primary);
		return $query->execute();
	}

	/**
	 * Return a count of entities of this type.
	 */
	public static function count() {
		return Database::instance()->count_records(static::_table());
	}

	public static function _entity_type() {
		$type = static::_model();
		$type = str_replace('Model_', '', $type);
		return $type;
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
			$writer->add_property($this, $name, $this->$name);
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

	/**
	 * Get the context's definition for the entity.
	 */
	public static function _definition($field = NULL) {
		$type = static::_entity_type();
		$_definition = Jefri_Entity_Context::instance()->entity_definition($type);
		return $_definition;
	}
	public static function _property($field) {
		return Arr::get(static::_definition()->properties, $field, FALSE);
	}
	public static function _relationship($field) {
		return Arr::get(static::_definition()->relationships, $field, FALSE);
	}

	protected function _get_nav($relationship, $args) {
		$field = "_{$relationship->name}";
		$model = "Model_{$relationship->to->type}";
		$to = $relationship->to->property;
		$from = $relationship->from->property;

		$vname = $relationship->to->vname;
		$callback = "";
		$getter = "";

		$autoload = isset($args[0])?$args[0]:TRUE;

		switch($relationship->type)
		{
			case "has_a":
			case "is_a":
				$getter = "get_first";
				break;
			case "has_many":
				$callback = "set_{$vname}";
				$getter = "get_empty";
				break;
		}

		if(!isset($this->$field))
		{	//Make sure we have the field...
			$this->$field = NULL;
		}

		if(NULL === $this->$field && $autoload)
		{	//Lazy load the relationship.
			$this->$field = $model::$getter(array($to => $this->$from));

			switch($getter)
			{
				case 'get_first':
					$this->_mutator_callback($relationship, $this->$field);
					$this->$from = $this->$field->id();
					break;
				case 'get_empty':
					foreach($this->$field as $ent)
					{	//Add us to them...
						$this->_mutator_callback($relationship, $ent);
					}
					break;
			}
		}

		return $this->$field;
	}

	protected function _set($relationship, $args) {
		$field = "_{$relationship->name}";
		$to_key = $relationship->to->property;
		$from_key = $relationship->from->property;

		$set = array_shift($args);


		if(!isset($this->$field) OR $this->$from_key != $set->$to_key)
		{	//The relationship is new or changing
			$this->$from_key = $set->$to_key;
			$this->$field = $set;

			//Reciprocate
			$this->_mutator_callback($relationship, $this->$field);
		}

		return $this;
	}

	protected function _add($relationship, $args) {
		$autoload = Arr::get($args, 1, TRUE);
		$field = "_{$relationship->name}";
		if($autoload)
		{
			$getter = "get_{$field}";
			$this->$getter();
		}
		if(!isset($this->$field) || NULL === $this->$field)
		{
			$this->$field = array();
		}
		$f = array_shift($args);
		array_unshift($this->$field, $f);

		//Reciprocate
		$this->_mutator_callback($relationship, $f);

		return $this;
	}

	protected function _mutator_callback($relationship, $field) {
		$model = "Model_{$relationship->to->type}";
		$f = get_class($field);
		$f = 'Model_' . $f::_entity_type();
		$type = self::_entity_type();
		$farside = Jefri_Entity_Context::instance()->back_rel($type, $relationship);
		if($farside !== NULL)
		{	//Set the callback based on the far side's type
			$callback = ($farside->type == "has_a" ? "set_" : "add_") . $farside->name;
#			$field->$callback($this, FALSE);
		}
	}

	/**
	 * Catch calls looking for a few special cases, especially get_field()
	 */
	public function __call($name, $args) {
		$def = static::_definition();
		$parts = array();
		if(preg_match('/(get|set|add|is)_([a-zA-Z\-\_])/', $name, $parts) !== FALSE)
		{	//Using an accessor/mutator
			$field = substr($name, 4);
			if(isset($def->properties[$field]))
			{	//Regular Property
				switch($parts[1])
				{
					case 'get': return $this->$field;
					case 'set': $this->$field = $args[0]; return $this;
				}
			}
			if(isset($def->relationships[$field]))
			{	//Navigation property...
				$def = $def->relationships[$field];
				$m = "_{$parts[1]}";
				if($m === "_get") {$m .= "_nav";}
				return $this->$m($def, $args);
			}
		}

		foreach($def->relationships as $rel)
		{	//Check for all is_a relationships to chain.
			if("is_a" == $rel->type)
			{	//It is, so try to chain
				$field = "get_" . $rel->to->vname;
				$field = $this->$field();
				try
				{	//Try to call the method...
					$field->$name($args);
				}
				catch (Exception $e)
				{
				
				}
			}
		}

#		$this->_call_error('__call', $name, debug_backtrace());
	}

	public function __get($name) {
		if(!isset($this->$name))
		{
			$this->$name = NULL;
		}

		if($this->_property($name) !== FALSE)
		{
			return $this->$name;
		}

		$this->_call_error('__get', $name, debug_backtrace());
	}

	public function __set($name, $value) {
#		if($this->_accessible($name))
#		{
			$this->$name = $value;
#		}

#		$this->_call_error('__set', $name, debug_backtrace());
	}

	protected function _accessible($name) {
		$accessible = is_string($name) AND !empty($name) AND $name[0] !== '_' AND isset($this->name);
		return $accessible;
	}

	private function _call_error($method, $property, $trace) {
		//TODO Use a logging framework
		$message = "Undefined property via {$method}({$property}) @ {$trace[0]['file']}::{$trace[0]['line']}";
		throw new Exception($message);
	}
}
