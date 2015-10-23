import psycopg2

import flask

from psycopg2.extensions import AsIs

from flask import Flask, render_template, request, url_for
from werkzeug.routing import BaseConverter

db_conn = None;

app = Flask(__name__)

class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]

app.url_map.converters['regex'] = RegexConverter

#This function should eventually be replaced to avoid getting
#more data than we actually need
def psql_query(query, args=None, include_columns=False):
    cursor = db_conn.cursor()
    if args is not None:
        cursor.execute(query, args)
    else:
        cursor.execute(query)

    if include_columns:
        return ([desc[0] for desc in cusor.description], cursor.fetchall())
    else:   
        return cursor.fetchall()

#@app.route('/api/<regex("[a-zA-Z0-9]+"):command>/<path:args>/')
#def req_api(command, args):
#    return render_template("base.html", command=command)
#    #return app.root_path
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/api/datasets/')
def api_list_datasets():
    datasets = psql_query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public';")
    return flask.jsonify(datasets=[item[0] for item in datasets])

@app.route('/api/<regex("[a-zA-Z0-9_]+"):dataset_name>/dates/')
def api_list_dates(dataset_name):
    dates = psql_query("SELECT DISTINCT ON (date(tstamp)) to_char(tstamp, 'YYYY-MM-DD') FROM %s;", (AsIs(dataset_name),))
    #We don't want to return a list of lists in json; we only want the elements in each list. Hence, we unpack
    #Each row so that each is a single litem in the JSON array
    return flask.jsonify(dataset=dataset_name, dates=[date[0] for date in dates])

@app.route('/api/<regex("[a-zA-Z0-9_]+"):dataset_name>/<regex("\d{4}-\d{2}-\d{2}"):date_string>/places/')
def api_list_places(dataset_name, date_string):
    places = psql_query("SELECT DISTINCT ON (site) site FROM %s WHERE date(tstamp) = (DATE %s)", (AsIs(dataset_name), date_string))
    return flask.jsonify(dataset=dataset_name, date=date_string, places=[place[0] for place in places])

@app.route('/api/<regex("[a-zA-Z0-9_]+"):dataset_name>/<regex("\d{4}-\d{2}-\d{2}"):date_string>/<regex("[a-zA-Z0-9_]+"):place_name>/sample-types/')
def api_list_sample_types(dataset_name, date_string, place_name):
    s_types = psql_query("SELECT DISTINCT ON (sensor) sensor FROM %s WHERE date(tstamp) = (DATE %s) AND site=%s", (AsIs(dataset_name), date_string, place_name))
    return flask.jsonify(dataset=dataset_name, date=date_string, place=place_name, sampleTypes=[s_type[0] for s_type in s_types])
      
@app.route('/api/<regex("[a-zA-Z0-9_]+"):dataset_name>/<regex("\d{4}-\d{2}-\d{2}"):date_string>/<regex("[a-zA-Z0-9_]+"):place_name>/<regex("[a-zA-Z0-9_]+"):sample_type>/')
def api_list_data(dataset_name, date_string, place_name, sample_type):
    data = psql_query("SELECT * FROM %s WHERE date(tstamp) = (DATE %s) AND site=%s AND sensor=%s", (AsIs(dataset_name), date_string, place_name, sample_type))
    return flask.jsonify(dataset=dataset_name, date=date_string, place=place_name, sample_type=sample_type, data=data)
      

#Start the testing server
if __name__ == "__main__":

    global db_conn;
    
    app.logger.info("Loading auth info...")
    with open("auth.txt", "r") as auth_file:
        host, db, username, password = [line.strip() for line in auth_file]
    app.logger.info("Connecting to postgres...")
    db_conn = psycopg2.connect(host=host, database=db, user=username, password=password)

    app.run(debug=True, host='0.0.0.0')
