nzbFamilyHub
=================

Description: nzbFamily Hub is a NodeJS web application that currently performs the following duties:
  - Presents a single page with links to various media aquiring applications (nzbDrone, nzbGet, CouchPotato, uTorrent)
  - Next 10 shows airing within the last 24 hours forward with download status.
  - Last 10 shows downloaded.
  - Recent 10 movies downloaded by air date.
  - Search aggregator for nzbDrone & Couchpotato
  - Ability to queue a movie for download from Couchpotato
  - Ability to queue a TV show to be monitored while selecting Standard/Anime/Daily tracking.
  - Ability to select to also download Recent Episode/Recent Season/Pilot + 2 Episodes/First Season/Everything when monitoring a show for the first time.
  - Ability to Get More/Complete Season/Get All on any shows that are already subscribed to.

Requirements:
  - NodeJS

Instllation:
  - Install NodeJS
  - Download the contents of this repository or clone it.
  - Execute "npm install" within the directory
  - Edit config.js with a text editor, the file must be fully populated or you will have errors.
  - Execute "npm start" to start the web application.

Persistance: Run "npm install -g forever" or "npm install -g forever-win" for windows. Then execute "forever start app.js" from the program directory.


Usage Instructions:

Once logged in, you can see three different sections
Next 10 Shows Airing - shows shows that the system should automatically grab that have been scheduled to air within the past 24 hours and future.
Last 10 Downloaded Shows - Last 10 shows the system has downloaded
Newest Movies - Newest downloaded movies by release date not downloaded date.

Downloading Movies/TV Shows
To download a movie/tv show, just enter your search in the search box and press enter. The results may take up to 10 seconds to return. If you don't get anything after 30 seconds you can refresh the screen. If this happens a lot please let me know.

Once you search for a show there are a couple of options:

TV Shows - they have a yellow TV Shows tag next to them
  - Add a New Series
    - Click "Download Now" - This will automatically schedule the system to download future episodes when they air. You will need to make the following selections first.
    - Another menu will appear with a dropdown box and a radio selector select the dropdown option.
      - Recent Episode - Will download the most recent episode.
      - Recent Season - Will download all episodes of the most recent season.
      - Pilot + 2 Episodes - Will download the first three episodes of the series.
      - First Season - Will download all episodes of the first season.
      - Everything - Will download every episode of the series.
    - Leave "Standard" selected unless you are downloading Anime or a daily TV series like "The Colbert Report"
    - Click "Confirm" and you should see the status change to "Queuing" then "Pending".
  - Download More Episode
    - If the series has already been added you can search for it and it will say "Available Now". Below is a dropdown with the following options:
      - Get More - This will download 3 more episodes of the series based on the oldest episode that you do not have.
      - Complete Season - Whatever season is partially completed it will download all episodes of.
      - Get All - Will download all episodes that haven't been downloaded for this series.
  

Movies - they have a red Movie tag next to them
  - Just click "Download Now" and it will change to "Queuing" indicating it will download
  - If the movie is already downloaded it will say "Available Now" in green
