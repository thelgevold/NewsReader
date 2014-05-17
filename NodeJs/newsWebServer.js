var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });  
  var categories = [];

  categories.push({name:"Sports",id:"1"});
  categories.push({name:"News",id:"2"});
  categories.push({name:"Technology",id:"3"});

  res.end(JSON.stringify(categories));

});
server.listen(8080);