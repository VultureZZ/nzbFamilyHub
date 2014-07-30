module.exports = {
  public: {
    'Plex': {
      'address': 'plex.tv',
      'path': '/servers/######/manage',
      'port': '443',
      'protocol':  'https',
      'enabled': true
    },
    'nzbDrone': {
      'address': '',
      'path': '',
      'port': '8989',
      'protocol':  'http', // Only HTTP supported right now
      'enabled': false,
      'clientProfile': 5, // Starting at 1 count out your profiles (for now)
      'downloadPath': 'c:\\media\\tv',
      'downloadPathAnime': 'c:\\media\\anime'
    },
    'NZBGet': {
      'address': '',
      'path': '',
      'port': '6789',
      'protocol':  'http',
      'enabled': true
    },
    'CouchPotato': {
      'address': '',
      'path': '',
      'port': '5050',
      'protocol':  'http',
      'enabled': false
    },
    'uTorrent': {
      'address': '',
      'path': '/gui',
      'port': '8000',
      'protocol':  'http',
      'enabled': true
    }
  },
  private: {    
    'nzbDrone': {
      'apiKey': ''
    },
    'CouchPotato': {
      'apiKey': ''
    },
    'sync': { // This function will allow you to sync files on the server running nodejs to a remote host via ftp/sftp/ftps. 
      'host': '',
      'username': '',
      'password': '',
      'port': '22',
      'protocol': 'sftp', // values : 'ftp', 'sftp', 'ftps' - blank is ftp
      'maxTransfers': 1, // maximum number of simultaneous transfers to this host.
      'fileStructure': '/media/', // must contain the ending slash
      'syncFolders': ['/tv', '/anime', '/movies'],
      'deleteAfter': true, // Delete files from the server running this app after transferring to this server?
      'fileWait': 60000, // How long to wait after a change has been detected to transfer the filee. While a file is being written to it should not transfer, but do not set this less than 5 seconds.
      'fileMinSize': 500000, // Minimum files size to initiate a trasnfer. Do not set less than 1 or it will cause a loop.
      'debug': true, // Enable debugging as this is experamental
      'enabled': false 
    }
  },
  'port': 3000,
  'login': 'admin',
  'password': '',
  'protocol': 'http',
  'ssl': {
    'key': 'domain.key',
    'crt': 'domain.cert'
  }
}