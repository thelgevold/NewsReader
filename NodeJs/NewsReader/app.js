var express  = require('express');
    var app      = express();  
    var cors = require('cors')                             // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    
    var http = require('http');

    var bodyParser = require('body-parser');
    app.use(bodyParser());
    // configuration =================

    mongoose.connect('mongodb://localhost:27017/newsreader');     // connect to mongoDB database on modulus.io
    app.use(cors());

    var parseString = require('xml2js').parseString;

    var categorySchema = new mongoose.Schema({
        title: { type: String }
        });
        
    var cat = mongoose.model('Category', categorySchema);

    var sourceSchema = new mongoose.Schema({
        title: { type: String },
        host:{ type: String },
        path:{ type: String },
        categoryId:{ type: String },
        });
        
    var source = mongoose.model('Source', sourceSchema);

    app.post('/api/newsource', function(request, response){
        
        var s = new source({title:request.body.title,categoryId:request.body.categoryId,host:request.body.host,path:request.body.path});
        console.log(s);
        s.save(function(err, s) {
            if (err) return console.error(err);

            response.json(s); 
        });

    });

    app.post('/api/newsreader', function(request, response){
        
        var category = new cat({title:request.body.title});

        category.save(function(err, category) {
            if (err) return console.error(err);

            response.json(category); 
        });

    });

    app.delete('/api/newsreader', function(request, response){
        
        cat.find({ _id:request.body.categoryId }).remove().exec();

    });


    app.get('/api/getrss/:sourceId',function(req,response){
        
        source.findOne({_id:req.params.sourceId}, function (err, s) {
            
            var options = {
            host: s.host,
            port: 80,
            path: s.path,
            method: 'GET',
            headers: {'Content-Type': 'text/xml'}
            };

            var rssCallback = function(res) {
                var str = '';

                res.on('data', function (chunk) {
                    str += chunk;
                });

                res.on('end', function () {
                    parseString(str, function (err, result) {
                        response.json(result); 
                    });
                });
            };

            http.request(options, rssCallback).end();
            });
    });

    app.get('/api/newsreader', function(req, res) {

       cat.find(function(err, categories) {
            if (err) return console.error(err);
    
            res.json(categories); 
        });
      
     });

    app.get('/api/sources/:categoryId', function(req, res) {
        source.find({categoryId:req.params.categoryId}, function (err, docs) {
            console.log(docs);
            res.json(docs);
        });
        
     });

     // listen (start app with node server.js) ======================================
     app.listen(8089);
     console.log("App listening on port 8089");

