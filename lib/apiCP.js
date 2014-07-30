var conf = require("../config")
  , moment = require('moment')
  , http = require('http')
  , https = require('https')
  , _ = require('underscore');

function couchPotatoAPICall (path, callback) {
  var options = {
    host: conf.public.CouchPotato.address,
    port: conf.public.CouchPotato.port,
    path: path,
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };

  var protocol = http;

  if (conf.public.CouchPotato.protocol == "https") {
    protocol = https;
  }

  protocol.request(options, function(res) {
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

function getDownloadedMovies (callback) {
  var historyQuery = '/api/' + conf.private.CouchPotato.apiKey + '/media.list?limit_offset=20&status=done,ignored';

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

module.exports.searchCouchPotato = searchCouchPotato;

function addMovie (imdbId, callback) {
  var addQuery = '/api/' + conf.private.CouchPotato.apiKey + '/movie.add?identifier=' + imdbId;

  couchPotatoAPICall(addQuery, function (err, data) {
    if (err) {callback(err);}
    callback(null, data);
  });

}

module.exports.addMovie = addMovie;

function compare(a,b) {
  if (a.releasedEpoch < b.releasedEpoch)
     return -1;
  if (a.releasedEpoch > b.releasedEpoch)
    return 1;
  return 0;
}
