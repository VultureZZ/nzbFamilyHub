#!/usr/bin/env python
#
# nzbFamily Hub post-processing script for NZBGet
#
# Copyright (C) 2012-2013 picard <picardhp@gmx.ch>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#


##############################################################################
### NZBGET POST-PROCESSING SCRIPT                                          ###

# sFTP mirroring from local to remote server.
# NOTE: This script requires lftp to be installed on your system.

##############################################################################
### OPTIONS                                                                ###

# Set here the full path for your FTP Server.
#postUrl="http://poseidon.feralhosting.com:8100/calls/syncFiles"

# Set it to delete the collection after copy (yes, no).
#Delete=yes

### NZBGET POST-PROCESSING SCRIPT                                          ###
##############################################################################
import os
import sys
import urllib2
import urllib
import simplejson as json

# Exit codes
POSTPROCESS_PARCHECK=92
POSTPROCESS_SUCCESS=93
POSTPROCESS_ERROR=94
POSTPROCESS_NONE=95

# Check if the script is called from nzbget 11.0 or later
if not 'NZBPP_TOTALSTATUS' in os.environ:
  print('*** NZBGet post-processing script ***')
  print('This script is supposed to be called from nzbget (13.0 or later).')
  sys.exit(POSTPROCESS_ERROR)

# Check if par-check or unpack-failt
if os.environ['NZBPP_PARSTATUS'] == '1' or os.environ['NZBPP_UNPACKSTATUS'] == '1':
  print "[ERROR] This nzb-file has failure status (par-check or unpack failed)"
  sys.exit(POSTPROCESS_ERROR)

print "[DETAIL] Script successfully started with url " + os.environ['NZBPO_POSTURL']

# All checks done, now doing the ftp job

dirFormatted = urllib.quote(os.environ['NZBPP_DIRECTORY'])

print "[INFO] sync starting... " + os.environ['NZBPO_POSTURL'] + "?path=" + dirFormatted
result = json.loads(urllib2.urlopen(os.environ['NZBPO_POSTURL'] + "?path=" + dirFormatted).read())

if (result["success"]):
  print "[INFO] sync successful. " + result
else:
  print "[ERROR] transfer failed! " + result
  sys.exit(POSTPROCESS_ERROR)

print "[DETAIL] Script successfully end"

# All OK
sys.exit(POSTPROCESS_SUCCESS)