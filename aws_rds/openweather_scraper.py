import requests
from database import Session
from models import Station, Weather
import datetime


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
        if weather_data is not None:
            main = weather_data['weather'][0]['main']
            description = weather_data['weather'][0]['description']
            wind_speed = weather_data['wind']['speed']

            weather = Weather(
                station_id = id,
                time_of_day = datetime.datetime.utcfromtimestamp(weather_data['dt']).strftime("%Y-%m-%d %H:%M:%S"),
                main=main,
                description=description,
                wind_speed=wind_speed
            )
            session.add(weather)
        else:
            print(f"Failed to fetch weather data for station {id}")

    session.commit()
    session.close()

update_database_weather()

