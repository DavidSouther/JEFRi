# Entity Route Templating

Entity Route Templating is a tightened approach to building MVC applications. By
enforcing strict rules on the model, middle-ware and application developers can
spend more time focusing on adding specific features to a product.

## Entities

ERT applications begin by defining an entity context, the description of their
data in a storage-agnostic way. Contexts entity-relationship models, defining
what business entities are available to the system, the properties and
relationships between those entities, and the methods available on entities.
Any ERT framework that understands this context description would then be able
to share structured data, while keeping logic and data associated. Narrowing
the focus of the business model tools enforces certain constraints and
assumptions onto data and development. This is a good thing, in that it
reduces the number of choices developers must make that don't directly apply
to their business' needs.

### Properties

Choosing a limited set of well-defined data types allows ERT frameworks and
systems to make more intelligent observations about data it works with. ERT
frameworks can be confident in many assumptions underlying the data model, and
thus provide many more features to developers than a more generalized system.
For programmers using an ERT framework, the benefits provided by those features
outweigh the costs to focus and constrain their data model to such a narrow
scope of data structures.

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
that 

### Replaceable

## Routes

Communication between the underlying entities and the rendered template views
should be as decoupled as possible. A routing framework serves as a platform
to attach code at various points in the application's life cycle between user
interaction and data updates. This decoupling allows cross-cutting concerns
easy access to aspect points. Libraries can focus on providing

### Eventing



### Decoupled

### Aspects
