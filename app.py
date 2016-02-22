# -*- coding: utf-8 -*-

from flask import Flask
import json
import psycopg2

app = Flask(__name__)

db_conn = None
base_config = {}


def load_config(filename):
    with open(filename, "r") as config:
        return json.load(config)


# App Configurations / Settings
base_config = load_config("server.json")
app.logger.info("Connecting to postgres...")
host = base_config["database"]["host"]
# Connect to database
db = base_config["database"]["db"]
username = base_config["database"]["user"]
password = base_config["database"]["password"]
db_conn = psycopg2.connect(host=host, database=db,
                           user=username, password=password)
bind_port = base_config["system"]["bind_port"]
app.config["SECRET_KEY"] = base_config["system"]["secret_key"]
