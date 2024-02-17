import json
import requests



def fetch_data():
    CONTRACT_NAME = "dublin"
    API_KEY = '99d3e65801ab0bdae585264b25d443c5545365b5'
    BASE_URL = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT_NAME}&apiKey={API_KEY}"

    response = requests.get(BASE_URL)
    
    if response.status_code == 200:
        data = response.json()
        with open('output.json', 'w') as outfile:
            json.dump(data, outfile)
    else:
        print("Failed to fetch data from the API")

if __name__ == "__main__":
    fetch_data()