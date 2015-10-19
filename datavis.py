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
def psql_query(query, args=None):
    cursor = db_conn.cursor()
    if args is not None:
        cursor.execute(query, args)
    else:
        cursor.execute(query)
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

@app.route('/api/<regex("[a-zA-Z0-9_]+"):dataset_name>/<regex("[a-zA-Z0-9_+]+"):column_names>/')
def api_get_column(dataset_name, column_names):
    data = None

    columns = str(", ".join(column_names.split("+")))
    if request.args.get("count"):

        record_count = int(request.args.get("count"))
        data = psql_query("SELECT %s FROM %s LIMIT %s;", (AsIs(columns), AsIs(dataset_name), record_count))		

    else:
        data = psql_query("SELECT %s FROM %s;", (AsIs(columns), AsIs(dataset_name)))
	
    return flask.jsonify(dataset=dataset_name, data=data)

#Start the testing server
if __name__ == "__main__":

    global db_conn;
    
    app.logger.info("Loading auth info...")
    with open("auth.txt", "r") as auth_file:
        host, db, username, password = [line.strip() for line in auth_file]
    app.logger.info("Connecting to postgres...")
    db_conn = psycopg2.connect(host=host, database=db, user=username, password=password)

    app.run(debug=True, host='0.0.0.0')
