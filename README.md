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
