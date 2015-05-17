    var express  = require('express');
    var app = express();                               // create our app w/ express
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var request = require('request');
    var fs = require('fs');

    // configuration =================

    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());

    app.get('/getEvents', function(req,res) {
      var query = req.query;
      var url = "https://www.eventbriteapi.com/v3/events/search";
      var params = {
        'token': 'QVLW2KE734XBBN6Q2DOI',
        'venue.city':query['venue.city'],
        'start_date.keyword':query['start_date.keyword'],
        'categories':query.categories,
        'page':1
      }

      console.log(params)

      request.get({url:url, qs:params}, function(err, data, response ){
        res.send(response)
      })

    });

    app.get('*', function(req, res) {
      res.sendfile('./' + req.url);
    });

    // listen (start app with node server.js) ======================================
    app.listen(process.env.PORT || 3000);