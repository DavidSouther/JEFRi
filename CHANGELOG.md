### *2012-11-29* **v1.0.0**

The first major release of JEFRi and the JEFRi ecosystem.

## Runtime

The JEFRi runtime manages data specified by an entity context,
including entities, properties, relationships, and methods of
that data.

## Runtime stores

The release includes storage implementations to utilize in-memory
javascript objects, HTML5 LocalStorage, Node Filesystems, and
PostStorage to a remote endpoint supporting JSON transactions
on /get and /persist.

## Server

A NodeJS server exposing /get and /persist, using a FileStore
pointed at ./.jefri for saving data.

## Modeler

An AngularJS application to build and manipulate JEFRi contexts.
The Modeler can server itself when installed via NPM, or be run
standalone. It saves to either HTML5 LocalStorage or a configured
PostStore.