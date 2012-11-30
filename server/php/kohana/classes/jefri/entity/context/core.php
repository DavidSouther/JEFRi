<?php defined('SYSPATH') or die('No direct script access.');
/**
 * Base Context.
 */
class Jefri_Entity_Context_Core {

	/**
	 * @var  string  default context
	 */
	public static $default = 'default';

	/**
	 * @var  array  session instances
	 */
	protected static $instances = array();

	/**
	 * Creates a singleton session of the given type.
	 *
	 *     $context = Jefri_Entity_Context::instance();
	 *
	 */
	public static function instance($name = NULL) {
		if ($name === NULL)
		{	// Use the default type
			$name = static::$default;
		}

		if ( ! isset(static::$instances[$name]))
		{	// Load the configuration for this type
			$config = Kohana::config('context')->get($name);
			// Set the session class name
			$context = new Jefri_Entity_Context($config);
			// Create a new session instance
			static::$instances[$name] = $context;
		}

		return static::$instances[$name];
	}

	protected $context = NULL;

	public function __construct($settings) {
		// Maybe abstract this to a context loader?
		$this->context = json_decode(file_get_contents($settings['uri']));

		foreach($this->context->entities as $name, $element)
		{	//Visit every element once
			$this->context->entities[$name] = $element;

			foreach($element->properties as $prop => $property)
			{	//Visit every property once...
				$element->properties[$prop] = $property;
			}

			foreach($element->relationships as $rel => $relationship)
			{	//Visit every property once...
				$element->relationships[$rel] = $relationship;
			}
		}
	}

	/**
	 * Return a definition of an entity.
	 */
	public function entity_definition($name) {
		if(!is_string($name))
		{
			$name = $name->_entity_type();
		}
		return Arr::get($this->context->entities, $name);
	}

	/**
	 * Find the relationship back to this guy...
	 *
	 * $type is the 
	 */
	public function back_rel($type, $relationship) {
		$def = $this->entity_definition($relationship->to->type);
		$back = null;
		foreach($def->relationships as $relation)
		{	// Looking through all the relationships
			if($relation->to->type == $type && $relation->name !== $relationship->name)
			{	//Found it
				$back = $relation;
			}
		}

		return $back;
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
	public function get($type, $where = NULL, $page = NULL, $save = true, $debug = FALSE) {
		$model = "Model_$type";
		$result = $this->get_empty($type, $where, $page, $debug);

		if (empty($result))
		{	//No results, so return a new object prototyped from the $where spec
			$result[0] = $this->intern(new $model($where));
			if($save)
			{	//Immediately save it, so as to verify persistance.
				$result[0]->save();
			}
		}

		return $result;
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
	public function get_first($type, $where = NULL, $save = FALSE, $debug = FALSE) {
		$model = "Model_$type";
		$get = $model::get($where, $save, $debug);
		if(is_array($get))
		{	//Pull the first element out
			$get = array_shift($get);
		}
#		$get->save();//Immediately save it, so as to verify persistance.
#		             // This shouldn't be necessary... get will handle it.
		return $get;
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
	public function get_empty($type, $where = NULL, $page = NULL, $save = TRUE, $debug = FALSE) {
		//Start the query, using the named table.
		$model = 'Model_' . $type;
		$definition = $this->entity_definition($type);
		$query = DB::select()->from($model::_table());
		$this->models = array();
		$this->tables = array();
		$this->_select($model, $definition, $query);
		$this->_where($model, $where, $query, $definition); 
		$this->_page($model, $page, $query, $definition);

		//TODO this should be in a logging class somewhere
		if($debug){echo Kohana::debug(substr($query->compile(Database::instance()), -1000));}
		$result = $query->execute();
		//Ready the return array.
		$results = $result->as_assoc();
		foreach($results as &$data)
		{	//Prototype an instance from the data.
			$data = $this->_expand($model, $data);
		}

		return $results;
	}

	//These don't need to get passed around in every damned request. They should
	//get reset every time get_empty starts.
	private $models;
	private $tables;

	/**
	 * Add all the fields from the definition to the query.
	 */
	private function _select($model, $definition, $query) {
Kohana::$log->add(Kohana::INFO, "_select $model");
		$props = $definition->properties;
		$table = $model::_table();
		$this->models[$model] = $table;
		$this->tables[$table] = $model;
		foreach($props as $prop)
		{	//Add all the particular model's properties
			$prop = $model::_lookup($prop->name);
			$query->select(array($prop, "'$prop'"));
		}
	}

	/**
	 * Prepare the appropriate rules from a $where array.
	 */
	private function _where($model, $where, $query, $definition) {
Kohana::$log->add(Kohana::INFO, "_where " . Debug::obj($where, true));
		if(is_scalar($where))
		{	//A single scalar value is assumed to be a primary key.
			$query->where($model::_primary(), '=', $where, $definition);
		}
		else if( !empty($where))
		{	//Something keyed, either an object or array.
			$this->_where_array($model, $where, $query, $definition);
		}
	}

	private function _where_array($model, $where, $query, $definition) {
Kohana::$log->add(Kohana::INFO, "_where_array " . Debug::obj($where, true));
		$definition = Jefri_Entity_Context::instance()->entity_definition($model::_entity_type());
		foreach($where as $key => $value)
		{	//Each key is a condition
			if(($prop = Arr::get($definition->properties, $key, FALSE))!==FALSE)
			{	//This is a property...
				$key = $model::_lookup($key);
				$this->_condition($key, $value, 'where', $query, $definition);
			}
			elseif(($relationship = Arr::get($definition->relationships, $key, FALSE)) !== FALSE)
			{	//A relationship. Add it.
				$this->_where_nav($model, $relationship, $value, $query, $definition);
			}
		}
	}

	/**
	 * Recursive function to add children.
	 */
	private function _where_nav($model, $relationship, $where, $query, $definition) {
Kohana::$log->add(Kohana::INFO, "_where_nav " . Debug::obj($where, true));
		$to_model = 'Model_' . $relationship->to->type;
		$from_model = 'Model_' . $relationship->from->type;
		$to_def = $to_model::_entity_type();
		$to_def = Jefri_Entity_Context::instance()->entity_definition($to_def);
		$query->join($to_model::_table(), 'LEFT')->on(
			$from_model::_lookup($relationship->from->property),
			'=',
			$to_model::_lookup($relationship->to->property)
		);
		$this->_select($to_model, $to_def, $query);
		$this->_where_array($to_model, $where, $query, $definition);
	}

	/**
	 * Apply the key/value condition to the query.
	 */
	private function _condition($key, $value, $where, $query, $definition) {
Kohana::$log->add(Kohana::INFO, "_condition " . Debug::obj($where, true));
		if(is_numeric($value))
		{	//Numbers must be equal
			$query->$where($key, '=', $value);
		}
		if(is_string($value))
		{	//Strings can be similar. Allows for '%value%' conditions.
			//However, strings can also be IDs. So, we need to check IDness
			#if(preg_match('/[a-zA-Z0-9]{8}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{4}\-[a-zA-Z0-9]{12}/', $value))
#			var_dump($definition);
			$model = 'Model_' . $definition->name;
			if($key === $model::_lookup($definition->key))
			{	//It's the ID, match exactly
				$query->$where($key, 'like', $value);
			}
			else
			{	//Just a field
				$query->$where($key, 'like', '%'.$value.'%');
			}
		}
		if(is_array($value))
		{	//Several options:
			if (
				($regexin = (isset($value["regexin"])))
				    OR
				($likein = (isset($value["likein"])))
			)
			{	//Extended "IN" syntax
				$terms = array_shift($value);
				foreach($terms as $term)
				{	//Add each term to the search critera
					$op = $regexin?"REGEX":($likein?"LIKE":"=");
					$term = $likein?"%{$term}%":$term;
					$query->or_where($key, $op, $term);
				}
			}
			else
			{	//Operator-based lookup
				$this->_condition_array($key, $value, $where, $query, $definition);
			}
		}
	}

	private function _condition_array($key, $value, $where, $query, $definition) {
Kohana::$log->add(Kohana::INFO, "_condition_array " . Debug::obj($where, true));
		$op = $value[0];
		if(Database_SQLite3::is_operator($op)) //This will be really bad...
		{	//First term is a valid SQL operator
			$v = $value[1];
			$query->$where($key, $op, $v);
		}
		elseif(is_array($op))
		{
			foreach($value as $val)
			{
				$this->_condition($key, $val, $where, $query, $definition);
			}
		}
		else
		{	//An array otherwise means 'one of these'.
			$query->$where($key, 'in', $value);
		}
	}

	/**
	 * Apply page conditions to the query.
	 */
	private function _page($model, $page, $query) {
		//Set pagination bounds.
		if( !empty($page['start']) )
		{	//Get the starting index...
			$query->offset($page['start']);
		}
		if(!empty($page['length']) && empty($page['limit']))
		{	//It makes sense to use either lentgh or limit. Using both is dumb.
			$page['limit'] = $page['length'];
		}
		if( !empty($page['limit']) )
		{	//Set the page li
			$query->limit($page['limit']);
		}

		if( !empty($page['order']) AND is_array($page['order']))
		{	//Set ordering
			foreach($page['order'] as $key => $value)
			{
				$key = $model::_lookup($key);
				$query->order_by($key, $value);
			}
		}
	}

	/**
	 * $model	the model for the requested type
	 * $data	assoc array of the columns, keyed table.column 
	 * $this->tables	a lookup array of DBTable to Model
	 * $this->models	a lookup array of Model to DBTable
	 */
	private function _expand($model, $data) {
		$type = $model::_entity_type();
		$entities = array();
		foreach($data as $prop => $val)
		{
			$parts = explode('.', $prop);
			$entity = isset($entities[$parts[0]]) ? $entities[$parts[0]] : array();
			$entity[$parts[1]] = $val;
			$entities[$parts[0]] = $entity;
		}

		$table = $this->models[$model];
		if(isset($entities[$table]))
		{	//Make sure the requested entity at least was loaded
			$entity = $this->intern(new $model($entities[$table]));
			unset($entities[$table]);
			$entity->_new = false;
			$definition = $this->entity_definition($entity);

			foreach($definition->relationships as $rel)
			{
				$m = 'Model_'.$rel->to->type;
				if(isset($this->models[$m]) && isset($entities[$this->models[$m]]))
				{	//We loaded the relationship in this query, so set it
					$nav = $this->intern(new $m($entities[$this->models[$m]]));
					$prop = (strpos($rel->type, '_a') === FALSE)
						? "add_"
						: "set_";
					$prop .= $rel->name;
					$entity->$prop($nav, FALSE);
				}
			}

			return $entity;
		}
		return NULL;
	}

	/**
	 * Run a GET Aggregation. 
	 */
	public function aggregate($aggregate, $debug = false) {
		//The return container
		$aggregation = array();
		//First, run the subquery...
		$subquery = $aggregate['_aggregate'];
		$subselect = array();
		unset($aggregate['_aggregate']);
		if(isset($subquery['_aggregate']))
		{	//Get the subselect from another aggregation
			$subselect = $this->aggregate($subquery);
		}
		else
		{	//Get the subselect from a selection
			$subselect = $this->get_empty($subquery);
		}
		$aggregation['_subselect'] = $subselect;

		//Now, we'll run the aggregates
		foreach($aggregate as $field => $func)
		{	//Need to apply each function to each field
			
		}

		return $aggregation;
	}

	/**
	 * Update or insert the given entity.
	 *
	 * @param    mixed    Entity prototype to request, update, and persist.
	 */
	public function update($type, $data = NULL, $debug = false) {
		$_model = "Model_$type";
		$_primary = $_model::_primary();

		$saved = FALSE;
		$primary = Arr::get($data, $_primary, -1);
		$model = $_model::get_empty($primary);//Primary key lookup, update that one
		if(count($model) > 0)
		{	//We got one, update it.
			unset($data[$_primary]);
			$model = $model[$primary];
			$model->_update($data);
			//TODO Should we do something here if we can't find it?
		}
		else
		{	//Build a new one with the data.
			unset($data[$primary]);
			$model = new $_model($data);
		}

		$saved = $model->save($debug);

		return array($saved, $model);
	}

	/** 
	 * Get a canonical instance of the entity in this context.
	 */
	private $interns = array();
	public function intern($entity, $updateOnIntern = true, $lookupOnMiss = false) {
		if(is_array($entity))
		{	//Ha ha- method overloading, PHP!
			return $this->_intern_array($entity);
		}

		$type = Arr::get($this->interns, $entity->_entity_type(), array());

		// Look up any currently loaded entity.
		$intern = Arr::get($type, $entity->id(), null);

		if($intern === NULL && $lookupOnMiss)
		{	//Nothing currently interned, Load from the DB
			$intern = self::get_first($entity->_entity_type(), $entity->id());
		}

		if($intern === NULL)
		{	//Still haven't found anything!
			$intern = $entity;
		}

		if($updateOnIntern)
		{	//Update the stored values
			$definition = $entity->_definition();
			foreach($definition->properties as $property)
			{
				$name = $property->name;
				//TODO Take into account default values...
				$intern->$name = $entity->$name;
			}
		}

		$type[$entity->id()] = $intern;
		$this->interns[$entity->_entity_type()] = $type;	//Why resetting this?

		return $intern;
	}

	private function _intern_array($entities) {
		if(!is_array($entities))
		{	//Oops, called the wrong one
			return $this->intern($ies);
		}

		$ents = array();
		foreach($entities as $entity)
		{
			$entity = $this->intern($entity);
			$ents[$entity->id()] = $entity;
		}

		return $ents;
	}
}
