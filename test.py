import sqlalchemy as sqla
from sqlalchemy import create_engine
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
DB = "CycleHub-DB"
USER = "carlo"
PASSWORD = "test"
engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/{}".format(USER, PASSWORD, URI, PORT, DB), echo=True)


sql = """
CREATE DATABASE IF NOT EXISTS CycleHub-DB;
"""

sql = engine.execute(sql)