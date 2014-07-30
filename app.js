var express = require('express')
  , routes = require('./routes')
  , fileSync = require('./lib/fileSync')
  , apiCP = require('./lib/apiCP')
  , apiDrone = require('./lib/apiDrone')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , _ = require('underscore')
  , moment = require('moment')
  , async = require('async')
  , conf = require("./config")
  , fs = require('fs');

var app = express();

app.configure(function(){
  app.set('port', conf.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var auth = null;

if (conf.login && conf.password) {
  var auth = express.basicAuth( conf.login, conf.password);
}

app.get('/', auth, routes.index);

app.get('/calls/search', auth, routes.search);

app.get('/calls/queue/movie', auth, routes.addMovie);
app.get('/calls/queue/series', auth, routes.addSeries);
app.get('/calls/queue/update-series', auth, routes.updateSeries);

app.get('/calls/syncRemote', auth, fileSync.syncRemote);
app.get('/calls/pushLocalToRemote', auth, fileSync.pushLocalToRemote);


exports.searchForMedia = function (query, callback) {
  query = encodeURIComponent(query);
  
  async.parallel([
      function(callback){
        // Make CP call
        if (conf.public.CouchPotato.enabled) {
          apiCP.searchCouchPotato(query, function (err, movies) {
            callback(null, movies);
          });
        } else {
          callback(null);
        }    
      },
      function(callback){
        if (conf.public.nzbDrone.enabled) {
          async.parallel([
            function(callback){
              apiDrone.searchNzbDrone(query, function (err, series) {
                callback(null, series);
              });
            },
            function(callback){
              apiDrone.getMonitoredSeries( function (err, monitoredSeries) {
                callback(null, monitoredSeries);
              });
            }
          ], function(err, results) {
            apiDrone.compareNzbDroneSeriesData(results[0], results[1], function (err, results) {
              callback(null, results);
            });
          });
        } else {
          callback(null);
        }    
      }
  ], function (err, results){
    callback(null, results);
  });
}

if (conf.protocol == "https" && conf.ssl.key && conf.ssl.crt) {
  var credentials = {key: fs.readFileSync(conf.ssl.key, 'utf8'), cert: fs.readFileSync(conf.ssl.crt, 'utf8')};
  https.createServer(credentials, app).listen(app.get('port'), function(){
    console.log("HTTPS server listening on port " + app.get('port'));
  });
} else {
  http.createServer(app).listen(app.get('port'), function(){
    console.log("HTTP server listening on port " + app.get('port'));
  });
}

// If filesyn, enable
if (conf.private.sync.enabled) {
  fileSync.startFolderMonitor();
}

// Bugfix: SSL works with CP but not NzbDrone, not sure why.

// To-do: Add additional meta data to presentation of movies and series
// To-do: Quality profile should be set by settings on nzbdrone
// To-do: Integrate trackt into Reviews
// To-do: Add user authentication and management - DB Integration
// To-do: Allow users to subscribe to pnotifications of new downloads (Series/Movies) - DB Integration
// To-do: Allow users to download additional episodes for a series.
// To-do: Allow users to mark a download as bad
// To-do: Clean interface
// To-do: Archive old tv series/movies and allow them to be "spooled" down to a server
