![JEFRi - JSON Entity Framework Runtime](https://github.com/DavidSouther/JEFRi/raw/master/assets/jefri_logo.png)

### Overview

JEFRi is an entity framework. Entity Frameworks allow developers to specify data descriptions and relationships in a single location, then share data throughout
the application space in a unified way. JEFRi accomplishes this by specifying
an Entity Context independent of any programming language. This context
describes the entities available in the domain model, the properties of those
entities, and any additional attributes needed to make the model suitably
robust. Further, it describes the relationships between entities. These
navigation properties allow entities to act naturally and transparently as
composite types. This allows intelligent loading of related data, without
requiring an application to load an entire object graph.

An Entity Framework provides a wealth of functionality over a pure
Object-Relational Mapper. Straight ORMs simply translate between a database
table and an instantiated object. A full EF includes tracking modifications
of entities, descriptive methods to navigate entity relationships, intelligent
sharing between framework instances, and more. JEFRi is a specification for how
to provide these entities, how to share these entities, and many other features
enabling software projects to quickly and efficiently work with their data.


