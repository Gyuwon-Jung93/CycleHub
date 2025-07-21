# decaux_scraper.py
import requests
from database import Session
from models import Station, Availability
import datetime
from dotenv import load_dotenv
import os

load_dotenv()

def update_database_decaux(data):
    session = Session()
    for station_data in data:
        existing_station = session.query(Station).filter_by(station_id=station_data['number']).first()
        if existing_station:
            #Update existing station
            existing_station.name = station_data['name']
            existing_station.address = station_data['address']
            existing_station.banking = 1 if station_data['banking'] else 0
            existing_station.bonus = 1 if station_data['bonus'] else 0
            existing_station.position_lat = station_data['position']['lat']
            existing_station.position_lng = station_data['position']['lng']
        else:
            #Insert new station
            station = Station(
                station_id=station_data['number'],
                name=station_data['name'],
                address=station_data['address'],
                banking=1 if station_data['banking'] else 0,
                bonus=1 if station_data['bonus'] else 0,
                position_lat=station_data['position']['lat'],
                position_lng=station_data['position']['lng']
            )
            session.add(station)


        #Create Availability record
        availability = Availability(
            station_id=station_data['number'],
            last_update=datetime.datetime.utcfromtimestamp(station_data['last_update'] / 1000),
            available_bike_stands=station_data['available_bike_stands'],
            bike_stands=station_data['bike_stands'],
            available_bikes=station_data['available_bikes'],
            status=station_data['status']
        )
        session.merge(availability)
    
    session.commit()
    session.close()




def fetch_decaux_data():
    CONTRACT_NAME = "dublin"
    API_KEY = os.getenv('JCDECAUX_API_KEY')
    BASE_URL = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT_NAME}&apiKey={API_KEY}"

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None


def fetch_data_and_update_database_decaux():
    data = fetch_decaux_data()
    if data:
        update_database_decaux(data)
    else:
        print("No data available to update the database")


fetch_data_and_update_database_decaux()