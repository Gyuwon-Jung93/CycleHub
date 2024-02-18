import sqlalchemy as sqla
import traceback
import glob
import os
from pprint import pprint
import simplejson as json
import requests
import time
from IPython.display import display
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker


URI = "cyclehub-db.cpywewmkcpo2.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "CycleHubDB"
USER = "carlo"
PASSWORD = "carlogyuwonchristian"

# Connect to sql server
engine = create_engine("mysql+mysqldb://{}:{}@{}:{}/".format(USER, PASSWORD, URI, PORT), echo=True)

# Create the database if it does not exist
sql_create_db = text("CREATE DATABASE IF NOT EXISTS {};".format(DB))
#Connect to database part of server
engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)





Base = declarative_base()

class Station(Base):
    __tablename__ = 'station'
    station_id = Column(Integer, primary_key=True)
    name = Column(String(256))
    address = Column(String(256))
    banking = Column(Integer)
    bonus = Column(Integer)
    position_lat = Column(Float)
    position_lng = Column(Float)
    contract_name = Column(String(256))


class Availability(Base):
    __tablename__ = 'availability'
    id = Column(Integer, primary_key=True)
    station_id = Column(Integer, ForeignKey('station.station_id'), unique=True)
    status = Column(String(256))
    last_update = Column(DateTime)
    bike_stands = Column(Integer)
    available_bikes = Column(Integer)
    available_bike_stands = Column(Integer)
    station = relationship("Station", back_populates="availability")


# Set up the foreign key relationship
Station.availability = relationship("Availability", back_populates="station")

# Create the tables in the database
Base.metadata.create_all(engine)