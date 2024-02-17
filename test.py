import sqlalchemy as sqla
from sqlalchemy import create_engine, text
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time
from IPython.display import display


URI = "cyclehub-db.cpywewmkcpo2.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "CycleHubDB"
USER = "carlo"
PASSWORD = "carlogyuwonchristian"
engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/".format(USER, PASSWORD, URI, PORT), echo=True)




# Create the database if it does not exist
sql_create_db = text("CREATE DATABASE IF NOT EXISTS {};".format(DB))

engine.connect().execute(sql_create_db)

