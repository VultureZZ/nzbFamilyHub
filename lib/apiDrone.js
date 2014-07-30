var conf = require("../config")
  , moment = require('moment')
  , http = require('http')
  , https = require('https')
  , Client = require("node-rest-client").Client
  , _ = require('underscore');

client = new Client();

function nzbDroneAPICall (path, callback) {
  var options = {
    host: conf.public.nzbDrone.address,
    port: conf.public.nzbDrone.port,
    path: path,
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
    headers: {
      'X-Api-Key': conf.private.nzbDrone.apiKey
    }
  };

  var protocol = http;

  if (conf.public.nzbDrone.protocol == "https") {
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

function compareSeasons(a,b) {
  if (a.seasonNumber < b.seasonNumber)
     return -1;
  if (a.seasonNumber > b.seasonNumber)
    return 1;
  return 0;
};


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

module.exports.getSeries = getSeries;

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

module.exports.searchSeries = searchSeries;

function getSeriesEpisodes (seriesId, callback) {
  var getQuery = '/api/episode?seriesId=' + seriesId;

  nzbDroneAPICall(getQuery, function (err, data) {
    callback(err, data);
  });

}

module.exports.getSeriesEpisodes = getSeriesEpisodes;


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

module.exports.searchNzbDrone = searchNzbDrone;

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

module.exports.getMonitoredSeries = getMonitoredSeries;

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

module.exports.compareNzbDroneSeriesData = compareNzbDroneSeriesData;