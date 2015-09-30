import psycopg2

from flask import Flask, render_template
from werkzeug.routing import BaseConverter

db_conn = None;

app = Flask(__name__)

class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]

app.url_map.converters['regex'] = RegexConverter


#@app.route('/api/<regex("[a-zA-Z0-9]+"):command>/<path:args>/')
#def req_api(command, args):
#    return render_template("base.html", command=command)
#    #return app.root_path

@app.route('/api/datasets/')
def api_list_datasets():
	pass

@app.route('/api/<regex("[a-zA-Z0-9]+"):dataset_name>/columns/')
def api_list_variables(dataset_name):
	pass

@app.route('/api/<regex("[a-zA-Z0-9]+"):data_set_name>/<regex("[a-zA-Z0-9]+"):column_name>')
def api_get_column(dataset_name, column_name):
	pass

#Start the testing server
if __name__ == "__main__":

    global db_conn;
    
    app.logger.info("Loading auth info...")
    with open("auth.txt", "r") as auth_file:
        host, db, username, password = [line.strip() for line in auth_file]
    app.logger.info("Connecting to postgres...")
    db_conn = psycopg2.connect(host=host, database=db, user=username, password=password)

    app.run(debug=True)
