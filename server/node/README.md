# JEFRi Server

JEFRi Node Server

## Getting Started
### On the server
Install the module with: `npm install jefri-server`

```javascript
var jefri_server = require('jefri-server');
jefri_server.awesome(); // "awesome"
```

### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/DavidSouther/JEFRi/master/dist/jefri-server.min.js
[max]: https://raw.github.com/DavidSouther/JEFRi/master/dist/jefri-server.js

In your web page:

```html
<script src="dist/jefri-server.min.js"></script>
<script>
awesome(); // "awesome"
</script>
```

In your code, you can attach jefri-server's methods to any object.

```html
<script>
this.exports = Bocoup.utils;
</script>
<script src="dist/jefri-server.min.js"></script>
<script>
Bocoup.utils.awesome(); // "awesome"
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" or "lib" subdirectories as they are generated via grunt. You'll find source code in the "src" subdirectory!_

## Release History
_(Nothing yet)_

## License
Copyright (c) 2012 David Souther	
Licensed under the MIT license.
