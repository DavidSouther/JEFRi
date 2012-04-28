var Entities = Entities || {};

(function(){

Entities.Writer = function () {
	var self = this;
	this.entities = {};
	this.meta = [];

	this.add_meta = function(prop, val) {
		this.meta[prop] = val;
	};

	this.add_property = function(entity, property, value) {
		entity = this.add_entity(entity);
		entity.add_property(property, value);
	};

	this.add_entity = function(entity) {
		if(undefined == entity)
		{
			return;
		}
		var uid = ((entity._type && entity._type()) || "Entity") +
		    (entity.id && entity.id());
		if(!this.entities[uid])
		{
			var ent = new this.Entity(entity);
			this.entities[uid] = ent;
			entity.encode(this);
		}
		return this.entities[uid];
	};

	this.Entity = function(entity) {
		var self = this;
		var type = (entity._type && entity._type()) || "Entity";
		var id = entity.id();
		var properties = {};

		this.add_property = function(property, value) {
			properties[property] = value;
		};

		this.id = function(){return id;};
		this.type = function(){return type;};
		this.properties = function(){
			return properties;
		};
	};
};

Entities.Writer.prototype.json_clean = function(string) {
//		$text = preg_replace("/\n/s", '', $text);
//		$text = preg_replace("/\s+/s", ' ', $text);
		string = string.replace(/,?\s*([\}\]])/, '\1');
//		$text = preg_replace('/\s*([\[\{\}\]])\s*/', '\1', $text);
//		$text = preg_replace('/([,:])\s*"/', '\1"', $text);
		return string;
};

Entities.Writer.JSON = function(){
	var writer = new Entities.Writer();
	writer.__proto__.toString = function() {
		var s = "";
		s += "{\n";

		s += "\t\"meta\": {\n";
		for(var prop in this.meta)
		{
			var val = meta[prop];
			s += "\t\t\"" + prop + "\":\""+val+"\",\n";
		}
		s += "\t},\n";

		s += "\t\"entities\": [\n";
		for(var eid in this.entities)
		{
			var ent = this.entities[eid];
			s += entityWriter(ent) + ',';
		}
		s += "\t]\n";

		s += "}\n";

		return this.json_clean(s);
	};

	function entityWriter(entity) {
		$string  = "";
		$string += "\t{\n";
		$string += "\t\t\"_type\":\""+entity.type()+"\",\n";
		var props = entity.properties();
		for(var prop in props)
		{
			var val = props[prop];
			$string += '"' + prop + '":' + val + '",\n';
		}
		$string += "\t}\n";
		return $string;
	}

	return writer;
};

})();
