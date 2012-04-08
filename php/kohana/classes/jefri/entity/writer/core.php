<?php defined('SYSPATH') or die('No direct script access.');

/**
 *
 * @package Popo
 */
abstract class Jefri_Entity_Writer_Core {
	protected $entities = array();
	protected $meta = array();

	public function add_property($entity, $prop, $val){
		$obj = $this->add_entity($entity);

		$obj->add_property($prop, $val);
	}

	public function add_meta($prop, $val)
	{
#var_dump($prop);
		$this->meta[$prop] = $val;
	}

	public function add_entity($entity, $deep = true) {
		if(!$entity instanceof Jefri_Model)
		{	//Get the fuck off the plane you ain't no goddamn duck
			return;
		}
		$hash = spl_object_hash($entity);
		$obj = Arr::get($this->entities, $hash, NULL);
		if(NULL === $obj)
		{	//Don't have one, build a new one and save it.
			$obj = $this->new_entity_writer($entity);
			$this->entities[$hash] = $obj;
			// Important to call this AFTER adding it to $entities
			// so we don't recurse too deep
			$entity->encode($this, $deep = true);
		}
		return $obj;
	}

	abstract public function new_entity_writer($obj);
	abstract public function to_string();
	public function __toString(){return $this->to_string();}
	public function toString(){return $this->to_string();}
}

abstract class Jefri_Entity_Writer_Entity {
	protected $type = "";
	protected $id = "";
	protected $properties = array();

	public function __construct($obj) {
		$this->type = $obj->_entity_type();
		$this->id = $obj->id();
	}

	public function add_property($prop, $val) {
		$this->properties[$prop] = $val;
	}

	abstract public function to_string();
	public function __toString(){return $this->to_string();}
}
