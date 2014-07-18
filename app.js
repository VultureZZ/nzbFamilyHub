
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , moment = require('moment')
  , async = require('async')
  , conf = require("./config");

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
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

app.get('/', routes.index);

app.get('/calls/search', routes.search);

app.get('/calls/queue/movie', routes.addMovie);
app.get('/calls/queue/series', routes.addSeries);
app.get('/calls/queue/update-series', routes.updateSeries);


function nzbDroneAPICall (path, callback) {
  console.log('Making Drone request', path);
  var options = {
    host: conf.public.nzbDrone.address,
    port: conf.public.nzbDrone.port,
    path: path,
    method: 'GET',
    headers: {
      'X-Api-Key': conf.private.nzbDrone.apiKey
    }
  };

  http.request(options, function(res) {
    res.setEncoding('utf8');
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function(){
        callback( null, JSON.parse( data ) );
    });
  }).end();

}

function couchPotatoAPICall (path, callback) {
  console.log('Making CP request', path);
  var options = {
    host: conf.public.CouchPotato.address,
    port: conf.public.CouchPotato.port,
    path: path,
    method: 'GET'
  };

  http.request(options, function(res) {
    res.setEncoding('utf8');
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function(){
        callback( null, JSON.parse( data ) );
    });
  }).end();

}

var Client = require('node-rest-client').Client;

var client = new Client();

function nzbDronePOSTAPICall (path, post_data, callback) {

  var args = {
    data: post_data,
    headers: {
      'X-Api-Key': conf.private.nzbDrone.apiKey,
      'Content-Type': 'application/json'
    }
  };

  client.post(conf.public.nzbDrone.protocol + '://' + conf.public.nzbDrone.address + ':' + conf.public.nzbDrone.port + path, args, function(data,response) {
      if (data.id) {
        callback(null, data);
      } else {
        callback(true, data);
      }
  });
}

function compare(a,b) {
  if (a.releasedEpoch < b.releasedEpoch)
     return -1;
  if (a.releasedEpoch > b.releasedEpoch)
    return 1;
  return 0;
}

function addMovie (imdbId, callback) {
  var addQuery = '/api/' + conf.private.CouchPotato.apiKey + '/movie.add?identifier=' + imdbId;

  couchPotatoAPICall(addQuery, function (err, data) {
    console.log('All done', err, data);
    if (err) {callback(err);}
    callback(null, data);
  });

}

module.exports.addMovie = addMovie;

function addSeries (data, callback) {

  var model = data.model;

  var titleSlug = model.title.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
 
  model.tvdbId = model.tvdbId;
  model.title = model.title;
  model.qualityProfileId = conf.public.nzbDrone.clientProfile;
  model.titleSlug = titleSlug;
  model.seasons = data.seasons;
  model.seasonFolder = true;
  model.monitored = true;
  model.useSceneNumbering = false;
  model.qualityProfileId = conf.public.nzbDrone.clientProfile;

  if (data) {
    model.RootFolderPath = conf.public.nzbDrone.downloadPath;
  }

  if (data.seriesType) {
    model.seriesType = data.seriesType;

    if (data.seriesType == "anime") {
      model.RootFolderPath = conf.public.nzbDrone.downloadPathAnime;
    }
  }

  nzbDronePOSTAPICall('/api/series', model, function (err, data) {
    callback(err, data);
  });

}

module.exports.addSeries = addSeries;

function getSeries (tvdbId, callback) {
  var getQuery = '/api/series?' + tvdbId;

  nzbDroneAPICall(getQuery, function (err, data) {
    callback(err, data);
  });

}

function searchSeriesEpisodes (episodeIds, callback) {
  // episodeIds is an array of episide int

  var data = {
    name: 'EpisodeSearch',
    episodeIds: episodeIds
  }

  nzbDronePOSTAPICall('/api/command', data, function (err, data) {
    callback(err, data);
  }); 

}

module.exports.searchSeriesEpisodes = searchSeriesEpisodes;

function searchSeries (seriesId, callback) {
 
  var data = {
    name: 'SeriesSearch',
    seriesId: seriesId
  }

  nzbDronePOSTAPICall('/api/command', data, function (err, data) {
    callback(err, data);
  });

}

function getSeriesEpisodes (seriesId, callback) {
  var getQuery = '/api/episode?seriesId=' + seriesId;

  nzbDroneAPICall(getQuery, function (err, data) {
    callback(err, data);
  });

}

module.exports.getSeriesEpisodes = getSeriesEpisodes;

function getDownloadedMovies (callback) {
  var historyQuery = '/api/' + conf.private.CouchPotato.apiKey + '/media.list?status=done,ignored';

  couchPotatoAPICall(historyQuery, function (err, data) {
    if (err) {callback(err);}
    var movies = _.map( data.movies, function( movie ){
      
      var titleSlug = movie.title.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '') + '-' + movie.info.year;
      return {
        name: movie.title,
        image: movie.info.images.poster_original[0],
        imdb: movie.info.imdb,
        released: moment(movie.info.released).format("MM/DD/YYYY"),
        releasedEpoch: moment(movie.info.released).unix(),
        imdbScore: movie.info.rating.imdb[0],
        imdbReviews: movie.info.rating.imdb[1],
        runtime: movie.info.runtime,
        plot: movie.info.plot,
        tag: movie.info.tagline,
        mpaa: movie.info.mpaa,
        titleSlug: titleSlug
      };
    })

    movies.sort(compare);
    callback(null, movies.slice(movies.length - 10,movies.length).reverse() );
  });

}

module.exports.getDownloadedMovies = getDownloadedMovies;

function getShowHistory (callback) {
  var historyQuery = '/api/history?page=1&pagesize=10&sortkey=date&sortdir=desc';

  nzbDroneAPICall(historyQuery, function (err, data) {
    if (err) {callback(err);}
    var episodes = [];
    _.each(data.records, function(episode) {
      episodes.push({
        series: episode.series.title,
        episode: episode.episode.title,
        downloaded: moment(episode.date).format('MM/DD/YYYY'),
        aired: moment(episode.episode.airDate).format('MM/DD/YYYY')
      });
    });
    callback(null, episodes);
  });

}

module.exports.getShowHistory = getShowHistory;

function getFutureShows (callback) {
  var historyQuery = '/api/calendar?start=' + moment().subtract('days',1).format('YYYY-MM-DD') + '&end=' + moment().add('days',6).format('YYYY-MM-DD');

  nzbDroneAPICall(historyQuery, function (err, data) {
    if (err) {callback(err);}
    var counter = 1;

    var episodes = _.map( data, function( episode ){
      if (counter > 10) {
        return;
      } else {
        counter++;
        return {
          series: episode.series.title,
          episode: episode.title,
          downloaded: episode.hasFile,
          airDate: moment(episode.airDate).format('MM/DD/YYYY')
        }
      }
    });

    callback(null, _.compact(episodes));
  });

}

module.exports.getFutureShows = getFutureShows;

function searchForMedia (query, callback) {
  query = encodeURIComponent(query);
  
  async.parallel([
      function(callback){
        // Make CP call
        if (conf.private.CouchPotato.enabled) {
          searchCouchPotato(query, function (err, movies) {
            callback(null, movies);
          });
        }       
      },
      function(callback){
        if (conf.public.nzbDrone.enabled) {
          async.parallel([
            function(callback){
              searchNzbDrone(query, function (err, series) {
                callback(null, series);
              });
            },
            function(callback){
              getMonitoredSeries( function (err, monitoredSeries) {
                callback(null, monitoredSeries);
              });
            }
          ], function(err, results) {
            compareNzbDroneSeriesData(results[0], results[1], function (err, results) {
              callback(null, results);
            });
          });
        }
      }
  ], function (err, results){
    callback(null, results);

  });
}

module.exports.searchForMedia = searchForMedia;

function searchCouchPotato (query, callback) {
  var searchQuery = '/api/' + conf.private.CouchPotato.apiKey + '/search?q=' + query;

  couchPotatoAPICall(searchQuery, function (err, data) {
    if (err) {callback(err);}
    
    var movies = _.map( data.movies, function( movie ){

      var imdbScore = null;
      var imdbReviews = null;

      if (movie.rating  && movie.rating.imdb && movie.rating.imdb[0] && movie.rating.imdb[1]) {
        imdbScore = movie.rating.imdb[0];
        imdbReviews = movie.rating.imdb[1];
      }

      return {
        name: movie.original_title,
        image: (movie.images && movie.images.poster_original) ? movie.images.poster_original[0] : null,
        imdb: movie.imdb,
        released: movie.year,
        releasedEpoch: moment(movie.year).unix(),
        imdbScore: imdbScore,
        imdbReviews: imdbReviews,
        runtime: movie.runtime,
        plot: movie.plot,
        tag: movie.tagline,
        in_library: movie.in_library,
        in_wanted: movie.in_wanted
      }
    });

    callback(null, movies );
  });

}

function searchNzbDrone (query, callback) {
  var seriesQuery = '/api/Series/lookup?term=' + query;

  nzbDroneAPICall(seriesQuery, function (err, data) {
    if (err) {callback(err);}

    var seriesArray = _.map( data, function( series ){
      return {
        series: series.title,
        seasons: series.seasonCount,
        episodes: series.episodeCount,
        network: series.network,
        airTime: series.airTime,
        overview: series.overview,
        image: series.remotePoster,
        year: series.year,
        monitored: series.monitored,
        imdb: series.imdbId,
        mpaa: series.certification,
        genres: series.genres,
        seasons: series.seasons,
        tvdbId: series.tvdbId,
        tvRageId: series.tvRageId,
        model: series
      }
    });

    callback(null, seriesArray);
  });

}

function getMonitoredSeries (callback) {
  var seriesQuery = '/api/Series';

  nzbDroneAPICall(seriesQuery, function (err, data) {
    if (err) {callback(err);}

    var seriesArray = _.map( data, function( series ){
      return {
        id: series.id,
        series: series.title,
        seasons: series.seasonCount,
        episodes: series.episodeCount,
        network: series.network,
        airTime: series.airTime,
        nextAiring: series.nextAiring,
        overview: series.overview,
        image: series.remotePoster,
        year: series.year,
        qualityProfileId: series.qualityProfileId,
        monitored: series.monitored,
        imdb: series.imdbId,
        seasons: series.seasons,
        tvdbId: series.tvdbId,
        tvRageId: series.tvRageId
      }
    });

    callback(null, seriesArray);
  });
}

function compareNzbDroneSeriesData (seriesSearch, seriesMonitored, callback) {
  var newSeries = [];
  _.each(seriesSearch, function(series) {
    var found = false;
    var monitoredSource;

    _.each(seriesMonitored, function(subSeries) {
      if (subSeries.tvdbId === series.tvdbId) {
        found = true;
        monitoredSource = subSeries;
        monitoredSource.image = series.image;
      }
    });

    if (found) {
      newSeries.push(monitoredSource);
    } else {
      newSeries.push(series);
    }
  });
  callback(null, newSeries);
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// To-do: Add a "get more" and "complete season" and "everything" to monitored series
// To-do: Add additional meta data to presentation of movies and series
// To-do: Quality profile should be set by settings on nzbdrone
// To-do: Integrate trackt into Reviews
// To-do: Add user authentication and management - DB Integration
// To-do: Allow users to subscribe to pnotifications of new downloads (Series/Movies) - DB Integration
// To-do: Allow users to download additional episodes for a series.
// To-do: Allow users to mark a download as bad
// To-do: Clean interface

// To-do: Add Anime as a selection for API for NZBDrone?
// To-do: Archive old tv series/movies and allow them to be "spooled" down to a server