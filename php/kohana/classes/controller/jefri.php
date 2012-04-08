<?php defined('SYSPATH') or die('No direct script access.');
/**
 * Template controller
 *
 */
class Controller_Jefri extends Controller {
	public function action_get() {
		$where = json_decode(file_get_contents('php://input'));
		$writer = new Jefri_Entity_Writer_Json();
		$this->meta($where->meta, $writer);

		$results = array();
		foreach($where->entities as $entity)
		{	//Build a model based on type, then remove the _type property before using get_empty()
			$model = "Model_" . $entity->_type;
			unset($entity->_type);
			$results += $model::get_empty($entity);
		}

		foreach($results as $ent)
		{
			$writer->add_entity($ent);
		}
		echo $writer->toString();
	}

	public function action_persist() {
		$data = @file_get_contents('php://input');
		$data = json_decode($data);

		$writer = new Jefri_Entity_Writer_Json();
		$this->meta($data->meta, $writer);

		$context = Jefri_Entity_Context::instance();
		$debug = FALSE;
		$saved = TRUE;
		Transaction::begin($this);

		try
		{
			foreach($data->entities as &$entity)
			{
				$model = "Model_{$entity->_type}";
				$lookup = !(isset($entity->__new));
				$entity = $context->intern(new $model($entity), true, $lookup);
				$saved = $saved && $entity->save($debug);
			}
		}
		catch (ErrorException $e)
		{
			$saved = FALSE;
			$writer->add_meta(array("error" => $e->getMessage()));
		}

		if(!$saved)
		{
			Transaction::rollback($this);
		}
		else
		{
			Transaction::commit($this);
		}
		$writer->add_meta(array("success" => $saved));


		foreach($transaction->entities as $entity)
		{
			if($entity instanceof Jefri_Model){
				$writer->add_entity($entity, false);//Add just this entity.
			}
		}

		echo $writer->toString();
#		echo $this->encode($data);
	}

	private function meta($meta, $writer) {
		foreach($meta as $module => $data)
		{	//Need to go through and see if there are any modules...
			if(Kohana::find_file('classes', "jefri/module/{$module}")!==FALSE)
			{	//Found the Module!
				try
				{	//Lots of reflection
					$class = "Jefri_Module_{$module}";
					$moduleclass = new ReflectionClass($class);
					$instantiator = $moduleclass->getMethod("instance");
					$instance = $instantiator->invoke(new $class());
					$metadata = $instance->execute($data);
#echo Kohana::debug($writer, $module, $metadata);
					$writer->add_meta($module, $metadata);
				}
				catch (ReflectionException $re)
				{	//Module must not be configured correctly.
					Kohana_log::instance()->add(Kohana::ERROR, 'JEFRi could not load module: :module', array(':module' => $module));
				}
			}
			else
			{
				Kohana_log::instance()->add(Kohana::WARN, 'JEFRi could not find module: :module', array(':module' => $module));
			}
		}
	}

	private function encode($transaction) {
#		$json = "{\"meta\":{";
#		$parts = array();
#		foreach($transaction->meta as $key => $value)
#		{
#			$parts[] = "\"$key\":\"$value\"";
#		}
#		$json .= implode($parts, ',');
#		$json .= "},\"entities\":[";
#		$ents = array();
#		foreach($transaction->entities as $entity)
#		{
#			if(!$entity instanceof Jefri_Model){continue;}
#			$parts = array();
#			$def = $entity->_definition();
#			$parts[] = "\"_type\": \"{$def->name}\"";
#			foreach($def->properties as $prop)
#			{
#				$n = $prop->name;
#				$parts[] = "\"{$n}\": \"{$entity->$n}\"";
#			}
#			$ents[] = "{" . implode($parts, ',') . "}";
#		}
#		$json .= implode($ents, ',');
#		$json .= "]}";
		return $json;
	}
}
