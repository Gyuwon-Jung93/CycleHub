from models import Station, Availability
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import datetime
from models import Base

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