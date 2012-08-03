# Entity Route Templating

Entity Route Template is a tightened approach to building MVC applications. By
enforcing strict rules on the model, framework writers can make a variety of
assumptions about applications, allowing the framework to provide greater
functionality over more generalized systems. With such a framework,
application developers can spend more time focusing on adding specific
features to a product. The ideas behind ERT are neither new nor particularly
groundbreaking. Rather, they arose naturally out of a desire to ruthlessly
follow DRY principles; not only in having a single point of reference, but in
shaving every character possible out of the program. With that guiding thought,
let's take a closer look at the pieces in ERT.

## Entities

ERT applications begin by defining an entity context, the description of their
data in a storage-agnostic way. Contexts are entity-relationship models,
defining what business entities are available to the system, the properties
and relationships between those entities, and the methods available on
entities. Any ERT framework that understands this context description would
then be able to share structured data, while keeping logic and data
associated.

Narrowing the focus of the business model tools enforces certain constraints
and assumptions onto data and development. This is a good thing, in that it
reduces the number of choices developers must make that don't directly apply
to their business' needs. Developers are freed from writing code handling the
underlying data model.

### Properties

Entities are, at their heart, just bare key-value object stores. Entity
instances maintain a map of property names to the current value of the
property. The values allowed in properties are somewhat more constrained.
Choosing a limited set of well-defined property types allows ERT frameworks
and systems to make more intelligent observations about data it works with.
ERT frameworks can be confident in many assumptions underlying the data model,
and thus provide many more features to developers than a more generalized
system. For programmers using an ERT framework, the benefits provided by those
features outweigh the costs to focus and constrain their data model to such a
narrow scope of data structures.

### Relationships

While limiting property types can limit the data model in some ways, providing
relationships between entities recovers all lost expressiveness. Using a
formal entity-relational model encourages developers to create business
objects that reflect the problem domain vocabulary. Breaking down the domain
into an entity-relational data model provides a common solution structure,
letting tools do more work, freeing the developer to focus entirely on adding
business value.

### Methods

Defining method signatures in an entity context consolidates logic for
business data. With a public contract on business data, the entity model is
widely portable across a business' application space. In the most extreme
setting, a business could have a team dedicated solely to managing and
maintaining the entity context and its method implementations, giving the
business' application teams a consistent set of data to work with at all
levels. The application teams are then free to focus purely on providing
valuable application features, with the knowledge that whatever changes the
persist in the entity model, other applications in the organization will see
a unified view of their data.

### Parallels to...

#### ORM

Entities with relationships and properties are very similar to current active
record patterns. Instances of entities generally map to a row in a database
table, with columns holding property values. The increased power comes in the
single, well-defined entity context. With that context describing the data,
the relational database becomes just another projection of the entity data.

#### Document Storage

In flight, entity data is usually represented as a JSON string. While it is
then expanded to an in-memory instance when received by a runtime, viewing
entities as documents in a document storage system is a very apt view. The
power again comes from having a single defined entity context. With that
context, Entities become type-definitions on top of document storage.
Frameworks can make very smart decisions about the data they store.

## Templates

With well-defined entities, templates can harness the focused approach to data
definitions to streamline and simplify the developers' and designers'
work flows. Instead of being a full programming language worth of conditionals
and iterations, templates can focus on specific, individual pieces of the
entity context. This allows greater separation and focus on pieces of data.
Further, ERT frameworks can provide more sensible default templates. Indeed,
with just the knowledge of entities, properties and relationships a framework
can provide default templates capable of building an entire CRUD application,
with the developers doing no more work than defining their business data.

### Complete

For a templating system to work, it must be complete. It must handle all base
cases of data (entities, properties, and relationships) and provide a granular
mechanism for developers and designers to replace and enhance any piece of the
template, from entire entities down to individual field states. Good
templating will also separate look and feel from the user interface itself.
Templating libraries should provide hooks for common layout concerns, such as
pages and collections, as well.

### Thin

Templates should map as closely to the entity model as possible. By
encouraging developers to build a single vocabulary for their business data
with an entity model, templates should be expressive enough to map directly to
that model, with any mappings from property values inherent in the templating
definition.

### Replaceable

With flexible templates, application developers can override specific pieces
of an application on a case-by-case basis. Because they are overriding the
default implementation, there is no scaffolding code that needs replacing.
Instead, the application developer immediately writes code that realizes
a business value.

## Routes

Communication between the underlying entities and the rendered template views
should be as decoupled as possible. A routing framework serves as a platform
to attach code at various points in the application's life cycle between user
interaction and data updates. This decoupling allows cross-cutting concerns
easy access to aspect points. Libraries can focus on providing

### Eventing

Eventing systems and observers allow for clean and clear separation of
concerns. Just as libraries know entry points into their code via method
signatures, so to can an expressive eventing system define exactly where
the library will return into the client code.

### Decoupled

Using events for decoupling 

### Aspects
