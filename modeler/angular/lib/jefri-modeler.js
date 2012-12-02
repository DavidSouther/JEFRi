(function(){
  var server, express;
  server = require('jefri-server');
  express = require('express');
  server.get('/', function(req, res){
    res.sendfile("build/index.html");
  });
  server.use('/', express['static']('build/'));
  server.listen(3000);
}).call(this);
