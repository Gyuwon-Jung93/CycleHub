import requests
from database import update_database_decaux


def fetch_decaux_data():
    CONTRACT_NAME = "dublin"
    API_KEY = '99d3e65801ab0bdae585264b25d443c5545365b5'
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