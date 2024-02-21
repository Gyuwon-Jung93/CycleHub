from models import Station, Availability, Weather
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base
import requests
# Connection Details
URI = "cyclehub-db.cpywewmkcpo2.eu-north-1.rds.amazonaws.com"
PORT = "3306"
DB = "CycleHubDB"
USER = "carlo"
PASSWORD = "carlogyuwonchristian"

# Connect to the MySQL server and select the database
engine = create_engine(f"mysql+mysqldb://{USER}:{PASSWORD}@{URI}:{PORT}/{DB}", echo=True)

    
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)



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


def fetch_weather_data(lat, lng):
    
    API_KEY = 'e09fe30aecb65a55bb36442eda372b92'
    BASE_URL = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEY}'

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None



def update_database_weather():
    session = Session()

    rows = session.query(Station.position_lat, Station.position_lng, Station.station_id).all()

    # Iterate through the points and make API requests
    for lat, lng, id in rows:
        weather_data = fetch_weather_data(lat, lng)
        print(lat)
        if weather_data is not None:
            main = weather_data['weather'][0]['main']
            description = weather_data['weather'][0]['description']
            wind_speed = weather_data['wind']['speed']
            # Insert weather data into the database
            weather_entry = Weather(
                station_id = id,
                time_day =weather_data['dt'],
                main=main,
                description=description,
                wind_speed=wind_speed
            )
            session.add(weather_entry)
        else:
            print(f"Failed to fetch weather data for lat={lat}, lon={lng}")

    # Commit changes and close session
    session.commit()
    session.close()