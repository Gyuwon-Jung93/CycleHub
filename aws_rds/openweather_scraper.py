import requests
import json
from database import update_database_weather

"""
API_KEY = 'e09fe30aecb65a55bb36442eda372b92'
lat = "53.3301"
lon = "-6.26804"

lat = "53.3409"
lon = "-6.2625"
# Make API request
url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}'
response = requests.get(url)

# Check the response
if response.status_code == 200:
    data = response.json()
    # Display JSON data nicely formatted
    print(json.dumps(data, indent=4))
else:
    print(f"Error: {response.status_code}")


    
"""


update_database_weather()

