var conf = require("../config")
  , async = require('async')
  , moment = require('moment')
  , _ = require('underscore')
  , FTPS = require('ftps')
  , fs = require('fs')
  , async = require('async')
  , chokidar = require('chokidar')
  , watch = require('watch')
  , ls = require('list-directory-contents');

if (conf.private.sync.enabled) {
  var ftps = new FTPS({
    host: conf.private.sync.host + ':' + conf.private.sync.port,
    username: conf.private.sync.username,
    password: conf.private.sync.password,
    protocol: conf.private.sync.protocol,
    keyFile: conf.private.sync.keyFile
  });
}

// ISSUES
// If you are downloading multiple episodes it appears it sometimes will not queue the later ones and only do the earlier episodes
// New versions of the episodes will not sync

var queuedFiles = [];

var lftpConnections = 0;

exports.startFolderMonitor = function(req, res){

  // Setup to monitor folders
  _.each(conf.private.sync.syncFolders, function (folder) {
    console.log('Now monitoring', folder);
/*
    var watcher = chokidar.watch(conf.private.sync.fileStructure + folder, {ignoreInitial: true, ignored: /[\/\\]\./, persistent: true});

    watcher
      .on('add', function( path) {pushFile(path);})
      .on('change', function( path) {pushFile(path);})
*/

watch.createMonitor(conf.private.sync.fileStructure + folder, function (monitor) {
    monitor.files[conf.private.sync.fileStructure + folder + '/.zshrc'] // Stat object for my zshrc.
    monitor.on("created", function (path, stat) {
      pushFile(path);
    })
    monitor.on("changed", function (path, curr, prev) {
      pushFile(path);
    })
})


  });

  setInterval(function () {
    // Only works on linux
    if (lftpConnections < conf.private.sync.maxTransfers && queuedFiles.length >= 1) {

      queuedFiles.sort(sortQueueTimes);

      if (conf.private.sync.debug) {
        console.log(queuedFiles);
      }

      var path;
      var file;

      if ( moment().diff(moment(queuedFiles[0].time)) >= conf.private.sync.fileWait) {

        pathObject = queuedFiles.splice(0,1)[0];
        console.log('pathObject', pathObject);
        if (pathObject.path.match(/[^/]*$/)[0].length > 0) {
          file = pathObject.path;
        } else {
          path = pathObject.path;
        }

        if (conf.private.sync.debug) {
          console.log('Plucked times', queuedFiles, pathObject, path, file);
        }
      } else {
        return;
      }

      if (path) {
        // Folder to sync detected

        var directory = path;
        var destDir = directory.replace(conf.private.sync.fileStructure, '');
        var dirPieces = destDir.split('/');

        var category = dirPieces[0];
        var name = dirPieces[1];
        var season = dirPieces[2];

        // To-do: Queue files to make sure you are not transferring more than conf.private.sync.maxTransfers at a time.

        // Mirror the full series just in case we have placeholder files created in that directory

        if (conf.private.sync.debug) {
          console.log('This is the dir', directory);
        }

        if (season) {
          directory = directory.substring(0, directory.indexOf(season) -1 );

          if (conf.private.sync.debug) {
            console.log('SEASON', directory, dirPieces);
          }
        } else if (dirPieces[3]) {
          directory = directory.substring(0, directory.indexOf(dirPieces[3]) - 1);

          if (conf.private.sync.debug) {
            console.log('No Season', directory, dirPieces);
          }
        }

        lftpConnections++;

        var params = "-R --only-missing -c";

        if (conf.private.sync.deleteAfter) {
          params = "-R --Remove-source-files --only-missing -c";
        }

        if (conf.private.sync.debug) {
          console.log('Starting to sync',path,directory)
        }

        if (directory) {
          ls(directory, function (err, files) {

            if (conf.private.sync.debug) {
              console.log('File list', files);
            }
            if (files) {

              if (conf.private.sync.debug) {
                console.log('mirror ' + params + ' "' + directory + '" "/' + category + '/"');
              }
              ftps.raw('mirror ' + params + ' "' + directory + '" "/' + category + '/"').exec(function (err, result) {
                lftpConnections --;

                if (conf.private.sync.debug) {
                  console.log('Sync completed for',path);
                }
                _.each(files, function(file){

                  if (conf.private.sync.debug) {
                    console.log('Checking file', file);
                  }
                  // If it doesn't exist touch it
                  if (file.substr(-1) == "/") {
                    fs.exists(file,function(exists){
                      if (!exists) {
                        fs.mkdirSync(file);

                        if (conf.private.sync.debug) {
                          console.log('Touch folder', file);
                        }
                      }
                    });
                  } else {
                    fs.exists(file,function(exists){
                      if (!exists) {
                        fs.openSync(file, 'w');

                        if (conf.private.sync.debug) {
                          console.log('Touch file', file);
                        }
                      }
                    });
                  }
                  // if a folder check if it exists, if not create it
                });
              });
            }
          });
        } else {
          if (conf.private.sync.debug) {
            console.log('Sync not completed', directory);
          }
        }
      } else if (file) {

        //check if it exists
        fs.exists( file, function (continueExists) {

          if (continueExists) {
            var fileSize = fs.statSync(file)["size"];

            if (fileSize >= conf.private.sync.fileMinSize) {
              lftpConnections++;

              // File to sync detected
              var destFile = '/' + file.replace(conf.private.sync.fileStructure, '');

              // Transfer the file

              var params = "";

              if (conf.private.sync.deleteAfter) {
                params = " -E ";
              }

              console.log('put ' + params + ' "' + file + '" -o "' + destFile + '"');
              ftps.raw('put' + params + '"' + file + '" -o "' + destFile + '"').exec(function (err, result) {
                lftpConnections --;
                fs.exists( file, function (exists) {
                  if (!exists) {
                    fs.openSync(file, 'w');
                  }
                });
              });
            }
          }
        });
      }
    }
  },10000);
}

function pushFile (file) {

  var directory = file;

  // Only accept folders that are not being extracted or in temp folders
  if (! (file.match(/_unpack/)) && ! (file.match(/tmp/)) && ! (file.match(/temp/)) ) {

    var fileSize = fs.statSync(file)["size"];
    if (!(directory.substr(-1) == "/") && (fileSize >= conf.private.sync.fileMinSize) ) {
      // If a file is detected we need to push both the folder and the file into the queue
      directory = directory.match(/^.*[\/\\]/, '')[0];

      queuedFiles = queuedFiles.filter(function (loc) { return loc.path != directory });
      console.log('Pushed folder into queue', directory);
      queuedFiles.push({path: directory, time: new Date().getTime()});

      // Delay files so that mirror can do its job first.
      setTimeout ( function (){
        queuedFiles = queuedFiles.filter(function (loc) { return loc.path != file });
        console.log('Pushed file into queue', file);
        queuedFiles.push({path: file, time: new Date().getTime()});
      }, 5000);

    } else if (fileSize >= conf.private.sync.fileMinSize ) {

      queuedFiles = queuedFiles.filter(function (loc) { return loc.path != directory });

      console.log('Pushed folder into queue', directory);
      queuedFiles.push({path: directory, time: new Date().getTime()});
    }
  }

}

exports.syncRemote = function(req, res){

  async.eachSeries(conf.private.sync.syncFolders, function (rootFolder, callback){
    crawlDirectory(ftps, rootFolder, function (err, data) {
      fileStructure = [];
      folderStructure = [];
      // Create folders
      console.log('Start the folder stage');
      async.eachSeries(data.folderStructure, function (folder, callback){
        createFolder (folder, function (err) {
          callback(err);
        });
      }, function (err) {
        console.log('Start the file stage');
        async.eachSeries(data.fileStructure, function (file, callback){
          createFile (file, function (err) {
            callback(err);
          });
        }, function (err) {
          callback(err);
        });
      });

    });
  }, function (err){
    res.send(200);
  });
}

function createFile (file, callback) {
  setTimeout( function() {
    console.log('Create ', file);
    fs.exists( conf.private.sync.fileStructure + file, function (exists) {
      if (!exists) {
        fs.openSync(conf.private.sync.fileStructure + file, 'w');
        callback(null);
      } else {
        callback(null);
      }
    });
  }, Math.floor(Math.random() * (500 - 10) + 10));
}

function createFolder (path, callback) {
  setTimeout( function() {
    console.log('Create ', path);
    fs.exists( conf.private.sync.fileStructure + path, function (exists) {
      if (!exists) {
        fs.mkdirSync(conf.private.sync.fileStructure + path);
        callback(null);
      } else {
        callback(null);
      }
    });
  }, Math.floor(Math.random() * (500 - 10) + 10));
}

var fileStructure = [];
var folderStructure = [];

function crawlDirectory (ftps, path, callback) {

  setTimeout( function() {

    ftps.cd(path).raw('cls -1').exec(function (err, result) {

      async.each(result.data.split(/\n/), function( item, callback) {
        if (item && item.substr(-1) == "/") {
          folderStructure.push(path + '/' + item);
          crawlDirectory(ftps, path + '/' + item.substr(0, item.length -1), function (err, data) {

            callback(err);
          });
        } else if (item) {
          fileStructure.push(path + '/' + item);
          callback(null);
        } else {
          callback(null);
        }
      }, function (err) {
        callback(err, {'fileStructure': fileStructure, 'folderStructure': folderStructure });
      });
    });
  }, Math.floor(Math.random() * (15000 - 2000) + 2000));
}

exports.pushLocalToRemote = function(req, res){
  syncDir(req.query.local, req.query.remote,function (err, data){

  });
  res.send(200);
}

function syncDir (localDir, remoteDir, callback) {

  ls(localDir, function (err, files) {
    console.log(files, 'mirror -R --Remove-source-files --only-missing -c "' + localDir + '" "' + remoteDir + '"');

    ftps.raw('mirror -R --Remove-source-files --only-missing -c "' + localDir + '" "' + remoteDir + '"').exec(function (err, result) {
      console.log('Sync completed for',localDir)
      _.each(files, function(file){
        console.log('Checking file', file);
        // If it doesn't exist touch it
        if (file.substr(-1) == "/") {
          fs.exists(file,function(exists){
            if (!exists) {
              fs.mkdirSync(file);
              console.log('Touch folder', file);
            }
          });
        } else {
          fs.exists(file,function(exists){
            if (!exists) {
              fs.openSync(file, 'w');
              console.log('Touch file', file);
            }
          });
        }

        callback(null, result);
        // if a folder check if it exists, if not create it
      });
    });
  });
}


function sortQueueTimes(a, b) {
  if (a.time < b.time)
     return -1;
  if (a.time > b.time)
    return 1;
  return 0;
};
