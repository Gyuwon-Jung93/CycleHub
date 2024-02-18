import requests
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

URI = "cyclehub-db.cpywewmkcpo2.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "CycleHubDB"
USER = "carlo"
PASSWORD = "carlogyuwonchristian"

# Connect to the MySQL server and select the database
engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)

Base = declarative_base()

# Define Station model
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

# Define Availability model
class Availability(Base):
    __tablename__ = 'availability'
    id = Column(Integer, primary_key=True)
    station_id = Column(Integer)
    status = Column(String(256))
    last_update = Column(DateTime)
    bike_stands = Column(Integer)
    available_bikes = Column(Integer)
    available_bike_stands = Column(Integer)

# Create the tables if they do not exist
Base.metadata.create_all(engine)

# Function to fetch data from the API and save to the database
def fetch_data_and_save():
    CONTRACT_NAME = "dublin"
    API_KEY = '99d3e65801ab0bdae585264b25d443c5545365b5'
    BASE_URL = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT_NAME}&apiKey={API_KEY}"

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        data = response.json()
        Session = sessionmaker(bind=engine)
        session = Session()
        for station_data in data:
            existing_station = session.query(Station).filter_by(station_id=station_data['number']).first()
            if existing_station:
                # Update existing record if needed
                existing_station.name = station_data['name']
                existing_station.address = station_data['address']
                # Update other attributes as needed
            else:
                # Insert new record if it doesn't exist
                station = Station(
                    station_id=station_data['number'],
                    name=station_data['name'],
                    address=station_data['address'],
                    banking=1 if station_data['banking'] else 0,
                    bonus=1 if station_data['bonus'] else 0,
                    position_lat=station_data['position']['lat'],
                    position_lng=station_data['position']['lng'],
                    contract_name=CONTRACT_NAME
                )
                session.add(station)
            availability = Availability(
                station_id=station_data['number'],
                status=station_data['status'],
                last_update=datetime.datetime.utcfromtimestamp(station_data['last_update'] / 1000),
                bike_stands=station_data['bike_stands'],
                available_bikes=station_data['available_bikes'],
                available_bike_stands=station_data['available_bike_stands']
            )
            session.add(availability)
        session.commit()
        session.close()
        print("Data saved to the database")
    else:
        print("Failed to fetch data from the API")

fetch_data_and_save()
