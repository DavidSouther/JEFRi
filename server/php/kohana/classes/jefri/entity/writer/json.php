<?php defined('SYSPATH') or die('No direct script access.');

/**
 *
 * @package Popo
 */
class Jefri_Entity_Writer_Json extends Jefri_Entity_Writer {
	public function new_entity_writer($obj) {
		return new Jefri_Entity_Writer_Entity_Json($obj);
	}

	public function to_string() {
		$string  = "";
		$string .= "{\n";

		$string .= "\t\"meta\": " . json_encode($this->meta) . ",\n";

		$string .= "\t\"entities\": [\n";
		foreach($this->entities as $ent)
		{
			$string .= $ent->to_string() . ',';
		}
		$string .= "\t]\n";

		$string .= "}\n";

		return static::json_clean($string);
	}

	public static function json_clean($text) {
#		$text = preg_replace("/\n/s", '', $text);
#		$text = preg_replace("/\s+/s", ' ', $text);
		$text = preg_replace('/,?\s*([\}\]])/', '\1', $text);
#		$text = preg_replace('/\s*([\[\{\}\]])\s*/', '\1', $text);
#		$text = preg_replace('/([,:])\s*"/', '\1"', $text);
		return $text;
	}
}

class Jefri_Entity_Writer_Entity_Json extends Jefri_Entity_Writer_Entity {
	public function to_string(){
		$string  = "";
		$string .= "\t{\n";
		$string .= "\t\t\"_type\":\"{$this->type}\",\n";
		$string .= "\t\t\"uuid\":\"{$this->id}\",\n";
		foreach($this->properties as $prop => $val)
		{
			$string .= "\t\t\"{$prop}\":\"{$val}\",\n";
		}
		$string .= "\t}\n";
		return $string;
	}
}
