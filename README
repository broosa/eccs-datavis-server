A work in progress visualization tool for quickly analyzing geotagged
environmental data. Created for Earlham College Computer Science
field science group.

The tool needs to be configured to access the databse correctly.
The server config should be stored in server.conf with a format
something like this:

  {
    "database": {
      "host": "<db_hostname>",
      "db": "<db_name>",
      "user": "<db_username>",
      "password": "<db_password>"
    },
    "map_view": {
      "map_start_center": [64.810, -18.245],
      "map_start_zoom": 7,
      "map_url": "http://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png",
      "map_attrib": "&copy <a href='http://www.opentopomap.org/'>OpenTopoMap</a> Contributors"
    },
    "system": {
      "secret_key": "<flask_secret_key>"
    }
  }


= Required Packages =

flask
psycopg2
hashids
