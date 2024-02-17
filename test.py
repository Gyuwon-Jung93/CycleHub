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

engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)


engine.connect().execute(sql_create_db)

for res in engine.connect().execute(text("SHOW VARIABLES;")):
    print(res)

sql = text("""
CREATE TABLE IF NOT EXISTS station(
    address VARCHAR(256),
    banking INTEGER,
    bike_stands INTEGER,
    bonus INTEGER,
    contract_name VARCHAR(256),
    name VARCHAR(256),
    number INTEGER,
    position_lat REAL,
    position_lng REAL,
    status VARCHAR(256)
);
""")
try:
    res = engine.connect().execute(text("DROP TABLE IF EXISTS station"))
    res = engine.connect().execute(sql)
    print(res.fetachall())
except Exception as e:
    print(e)