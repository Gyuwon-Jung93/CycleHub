from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.schema import PrimaryKeyConstraint, ForeignKeyConstraint
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship




Base = declarative_base()

# Define Station model
class Station(Base):
    __tablename__ = 'station'
    station_id = Column(Integer, primary_key=True)
    name = Column(String(256))
    address = Column(String(256))
    position_lat = Column(Float)
    position_lng = Column(Float)
    banking = Column(Integer)
    bonus = Column(Integer)


# Define Availability model
class Availability(Base):
    __tablename__ = 'availability'
    station_id = Column(Integer, ForeignKey('station.station_id'), primary_key=True)
    last_update = Column(DateTime, primary_key=True)
    available_bike_stands = Column(Integer)
    bike_stands = Column(Integer)
    available_bikes = Column(Integer)
    status = Column(String(256))
    __table_args__ = (
        PrimaryKeyConstraint('station_id', 'last_update'),
    )
    station = relationship("Station")



# Define Weather model
class Weather(Base):
    __tablename__ = 'weather'
    time_of_day = Column(DateTime,primary_key=True)
    station_id = Column(Integer, ForeignKey('station.station_id'), primary_key=True)
    main = Column(String(256))
    description = Column(String(256))
    temperature = Column(Integer)
    wind_speed = Column(Float)
    __table_args__ = (
        PrimaryKeyConstraint('time_of_day', 'station_id'),
    )
    station = relationship("Station")
