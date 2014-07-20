module.exports = {
  public: {
    'Plex': {
      'address': 'plex.tv',
      'path': '/servers/#####/manage',
      'port': '443',
      'protocol':  'https',
      'enabled': true
    },
    'nzbDrone': {
      'address': 'HOSTNAME',
      'path': '',
      'port': '8989',
      'protocol':  'http',
      'enabled': true,
      'clientProfile': 5,
      'downloadPath': 'c:\\media\\tv',    
      'downloadPathAnime': 'c:\\media\\anime'
    },
    'NZBGet': {
      'address': 'HOSTNAME',
      'path': '',
      'port': '6789',
      'protocol':  'http',
      'enabled': true
    },
    'CouchPotato': {
      'address': 'HOSTNAME',
      'path': '',
      'port': '5050',
      'protocol':  'http',
      'enabled': true
    },
    'uTorrent': {
      'address': 'HOSTNAME',
      'path': '/gui',
      'port': '8000',
      'protocol':  'http',
      'enabled': true
    }
  },
  private: {    
    'nzbDrone': {
      'apiKey': 'DRONE_APIKEY'
    },
    'CouchPotato': {
      'apiKey': 'CP_APIKEY'
    }
  },
  'port': 3000,
  'login': 'admin',
  'password': 'password'
}
