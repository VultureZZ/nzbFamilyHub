var conf = require("../config")
  , app = require("../app")
  , moment = require('moment')
  , apiCP = require('../lib/apiCP')
  , apiDrone = require('../lib/apiDrone')
  , _ = require('underscore')
  , async = require('async');

exports.index = function(req, res){
  async.parallel([
      function(callback){
        if (conf.public.CouchPotato.enabled) {
          apiCP.getDownloadedMovies ( function (err, movies) {
            callback(err, movies);
          });
        } else {
          callback(null, []);
        }
      },
      function(callback){
        if (conf.public.nzbDrone.enabled) {
          apiDrone.getShowHistory ( function (err, downloadedShows) {
            callback(err, downloadedShows);
          });
        } else {
          callback(null, []);
        }
      },
      function(callback){
        if (conf.public.nzbDrone.enabled) {
          apiDrone.getFutureShows ( function (err, futureShows) {
            callback(err, futureShows);
          });
        } else {
          callback(null, []);
        }
      }
  ], function (err, results){
    res.render('index', {config: conf.public, recentlyDownloadedEpisodes: results[1], futureEpisodes: results[2], movies: results[0]});
  });
};

exports.search = function(req, res){
  app.searchForMedia(req.query.search, function(err, results) {
    res.send(results.reverse());
  });
};

exports.addMovie = function(req, res){
  apiCP.addMovie(req.query.imdb, function(err, results) {
    res.send(results);
  });
};


exports.addSeries = function(req, res){
  var series = req.query.model;
  var seasons = series.model.seasons;
  var finalSeasons = [];

  _.each( seasons, function(season) {
    if (season.monitored == 'false') {
      season.monitored = false;
    } else if (season.monitored == 'true') {
      season.monitored = true;
    }

    finalSeasons.push(season);
  }); 
  
  finalSeasons.sort(compareSeasons);

  switch ( req.query.method ) {
    case "recentEpisode":
      // Monitor recent season only      
      seasons[0].monitored = true;

      apiDrone.addSeries({seriesType: req.query.seriesType, model: series.model, seasons: seasons}, function(err, series) {
        // Search for latest episode
        
        res.send(series);
        series = JSON.parse(series);

        setTimeout( function () {
          apiDrone.getSeriesEpisodes(series.id, function (err, episodes) {

            var seNo = 0;
            var epNo = 0;
            var primaryEpisode;

            _.each(episodes,function (episode) {
              if ( episode.airDate && ((seNo <= episode.seasonNumber) || (seNo <= episode.seasonNumber) && (epNo <= episode.episodeNumber)) && (moment(episode.airDate).diff(moment()) < 0) ) {
                primaryEpisode = episode;
                seNo = episode.seasonNumber;
                epNo = episode.episodeNumber;
              }
            });

            if (primaryEpisode && !primaryEpisode.hasFile) {
              apiDrone.searchSeriesEpisodes([primaryEpisode.id], function (err, data) {
              });
            }
          });
        }, 5000);

      });
      break;
    case "recentSeason":
      // Monitor recent season only    
      seasons[0].monitored = true;

      apiDrone.addSeries({seriesType: req.query.seriesType, model: series.model, seasons: seasons}, function(err, series) {
        
        // Search for all episodes in season
        
        res.send(series);
        series = JSON.parse(series);

        setTimeout( function () {
          apiDrone.getSeriesEpisodes(series.id, function (err, episodes) {

            var seNo = 0;
            var epNo = 0;
            var episodeIds = [];

            _.each(episodes,function (episode) {
              if ( episode.airDate && (seNo <= episode.seasonNumber) && (moment(episode.airDate).diff(moment()) < 0) ) {
                seNo = episode.seasonNumber;
              }
            });

            _.each(episodes,function (episode) {
              if ( !episode.hasFile && episode.airDate && ( seNo = episode.seasonNumber) && (moment(episode.airDate).diff(moment()) < 0) ) {
                episodeIds.push(episode.id);
              }
            });

            if (episodeIds.length > 0) {
              apiDrone.searchSeriesEpisodes(episodeIds, function (err, data) {

              });
            }
          });
        }, 5000);

      });
      break;
    case "pilot2":
      // Monitor recent season only and pilot   
      seasons[0].monitored = true;

      apiDrone.addSeries({seriesType: req.query.seriesType, model: series.model, seasons: seasons}, function(err, series) {
        
      // Search for pilot episode + 2
        
        res.send(series);
        series = JSON.parse(series);

        setTimeout( function () {
          apiDrone.getSeriesEpisodes(series.id, function (err, episodes) {

            var episodeIds = [];

            _.each(episodes,function (episode) {
              if ( !episode.hasFile && episode.airDate && (episode.seasonNumber == 1) && (episode.episodeNumber < 4) && (episode.episodeNumber >= 1) && (moment(episode.airDate).diff(moment()) < 0) ) {
                episodeIds.push(episode.id);
              }
            });

            if (episodeIds.length > 0) {
              apiDrone.searchSeriesEpisodes(episodeIds, function (err, data) {
                
              });
            }
          });
        }, 5000);

      });
      break;
    case "firstSeason":
      // Monitor current and recent seasons
      seasons[0].monitored = true;

      apiDrone.addSeries({seriesType: req.query.seriesType, model: series.model, seasons: seasons}, function(err, series) {
        
      // Search for first season 
        
        res.send(series);
        series = JSON.parse(series);

        setTimeout( function () {
          apiDrone.getSeriesEpisodes(series.id, function (err, episodes) {

            var episodeIds = [];
            
            _.each(episodes,function (episode) {
              if ( !episode.hasFile && episode.airDate && (episode.seasonNumber == 1) && (moment(episode.airDate).diff(moment()) < 0) ) {
                episodeIds.push(episode.id);
              }
            });

            if (episodeIds.length > 0) {
              apiDrone.searchSeriesEpisodes(episodeIds, function (err, data) {
                
              });
            }

          });
        }, 5000);

      });
      break;
    case "everything":
      // Monitor everything
      seasons[0].monitored = true;

      apiDrone.addSeries({seriesType: req.query.seriesType, model: series.model, seasons: seasons}, function(err, series) {
        
      // Search for everything
        
        res.send(series);
        series = JSON.parse(series);

        setTimeout( function () {
          apiDrone.getSeriesEpisodes(series.id, function (err, episodes) {

            var episodeIds = [];

            _.each(episodes,function (episode) {
              if ( !episode.hasFile && episode.airDate && (moment(episode.airDate).diff(moment()) < 0) ) {
                episodeIds.push(episode.id);
              }
            });

            if (episodeIds.length > 0) {
              apiDrone.searchSeriesEpisodes(episodeIds, function (err, data) {
                
              });
            }

          });
        }, 5000);

      });
      break;
  }
};

exports.updateSeries = function(req, res){
  var id = req.query.id;

  switch ( req.query.method ) {
    case "getMore":  
      apiDrone.getSeriesEpisodes(id, function (err, episodes) {

        var seNo = 1;
        var maxEps = 3;
        var downloadEpisodes = [];

        _.each(episodes,function (episode) {
          if (seNo == episode.seasonNumber && !episode.hasFile && (moment(episode.airDate).diff(moment()) < 0) && (downloadEpisodes.length < maxEps) ) {
            downloadEpisodes.push(episode.id);
          } else if ( (episode.seasonNumber > seNo)  && !episode.hasFile && (moment(episode.airDate).diff(moment()) < 0) && (downloadEpisodes.length < maxEps) ) {
            downloadEpisodes.push(episode.id);
            seNo = episode.seasonNumber;
          }
        });

        if (downloadEpisodes.length > 0) {
          apiDrone.searchSeriesEpisodes(downloadEpisodes, function (err, data) {
            res.send({success: true});
          });
        } else {
          res.send({success: true})
        }
      });
      break;
    case "getAll":
      apiDrone.getSeriesEpisodes(id, function (err, episodes) {

        var seNo = 1;
        var maxEps = 3;
        var downloadEpisodes = [];

        _.each(episodes,function (episode) {
          if (!episode.hasFile && (moment(episode.airDate).diff(moment()) < 0) && (downloadEpisodes.length < maxEps) ) {
            downloadEpisodes.push(episode.id);
          }
        });

        if (downloadEpisodes.length > 0) {
          apiDrone.searchSeriesEpisodes(downloadEpisodes, function (err, data) {
            res.send({success: true});
          });
        } else {
          res.send({success: true})
        }
      });
      break;
    case "completeSeason":
      apiDrone.getSeriesEpisodes(id, function (err, episodes) {

        var seNo;
        var maxEps = 3;
        var downloadEpisodes = [];

        _.each(episodes,function (episode) {
          // Locate first partial season
          if ((episode.seasonNumber > 0) && !episode.hasFile && (moment(episode.airDate).diff(moment()) < 0)) {
            seNo = episode.seasonNumber;
          }

          if ( (seNo > 0) && seNo == episode.seasonNumber && !episode.hasFile && (moment(episode.airDate).diff(moment()) < 0) ) {
            downloadEpisodes.push(episode.id);
          }
        });

        if (downloadEpisodes.length > 0) {
          apiDrone.searchSeriesEpisodes(downloadEpisodes, function (err, data) {
            res.send({success: true});
          });
        } else {
          res.send({success: true})
        }
      });
      break;
  }
};