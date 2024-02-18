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


station_table = text("""
CREATE TABLE IF NOT EXISTS station(
    station_id INTEGER AUTO_INCREMENT PRIMARY KEY,
    station_number INTEGER,
    name VARCHAR(256),
    address VARCHAR(256),
    banking INTEGER,
    bonus INTEGER,
    overflow BOOLEAN,
    contract_name VARCHAR(256),
    position_lat REAL,
    position_lng REAL
);
""")



try:
    res = engine.connect().execute(text("DROP TABLE IF EXISTS station"))
    res = engine.connect().execute(station_table)
    print(res.fetachall())
except Exception as e:
    print(e)


availability_table = text("""
CREATE TABLE IF NOT EXISTS availability(
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT UNIQUE, 
    status VARCHAR(256),
    connected BOOLEAN,
    last_update DATETIME,               
    bikes INTEGER,
    stands INTEGER,
    mechanical_bikes INTEGER,
    electrical_bikes INTEGER,
    electrical_internal_battery_bikes INTEGER,
    electrical_removable_battery_bikes INTEGER
                        
);
""")


try:
    res = engine.connect().execute(availability_table)
    print(res.fetachall())
except Exception as e:
    print(e)


