jefriContext = {	"attributes": {},
	"entities": {
		"Context": {
			"key": "context_id",
			"properties": {
				"context_id": {
					"type": "string"
				}
			},
			"relationships": {
				"entities": {
					"type": "has_many",
					"property": "context_id",
					"to": {
						"type": "Entity",
						"property": "context_id"
					},
					"back": "context"
				}
			}
		},
		"Entity": {
			"key": "entity_id",
			"properties": {
				"entity_id": {
					"type": "string"
				},
				"context_id": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"key": {
					"type": "string"
				}
			},
			"relationships": {
				"context": {
					"type": "has_a",
					"property": "context_id",
					"to": {
						"type": "Context",
						"property": "context_id"
					},
					"back": "entities"
				},
				"properties": {
					"type": "has_many",
					"property": "entity_id",
					"to": {
						"type": "Property",
						"property": "entity_id"
					},
					"back": "entity"
				},
				"relationships": {
					"type": "has_many",
					"property": "entity_id",
					"to": {
						"type": "Relationship",
						"property": "to_id"
					},
					"back": "from"
				}
			}
		},
		"Property": {
			"key": "property_id",
			"properties": {
				"property_id": {
					"type": "string"
				},
				"entity_id": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"type": {
					"type": "string"
				}
			},
			"relationships": {
				"entity": {
					"type": "has_a",
					"property": "entity_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					},
					"back": "properties"
				}
			}
		},
		"Relationship": {
			"key": "relationship_id",
			"properties": {
				"relationship_id": {
					"type": "string"
				},
				"to_id": {
					"type": "string"
				},
				"to_property": {
					"type": "string"
				},
				"from_id": {
					"type": "string"
				},
				"from_property": {
					"type": "string"
				},
				"name": {
					"type": "string"
				},
				"type": {
					"type": "string"
				}
			},
			"relationships": {
				"to": {
					"type": "has_a",
					"property": "to_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					}
				},
				"from": {
					"type": "has_a",
					"property": "from_id",
					"to": {
						"type": "Entity",
						"property": "entity_id"
					},
					"back": "relationships"
				}
			},
			"methods": {
				"normalize": {
					"definitions": {
						"javascript": "var this$=this;\nthis._runtime.get_first({'_type': 'Entity', 'entity_id': this.to_id()}).then(\n\tfunction(found){\n\t\tthis$.to(found);\n\t}\n);"
					}
				}
			}
		}
	}
};
