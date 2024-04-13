import requests
from datetime import datetime
import pickle
import pandas as pd
#Need to construct dataframe for next 24 hours to generate charts

# For fetching future weather dtaa
def fetch_weather_data(lat, lng):
    
    API_KEY = 'e09fe30aecb65a55bb36442eda372b92'
    BASE_URL = f" https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&appid={API_KEY}"

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None
    
weather_data = fetch_weather_data(53.3498,-6.2603)

#fetch up to date staion ids and bike stands
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
    
station_data = fetch_decaux_data()



weather = [{'time_of_day': datetime.utcfromtimestamp(item['dt']),
            'wind_speed': item['wind']['speed'],
            'temperature': item['main']['temp'] - 273.15,
            'description': item['weather'][0]['description']}
           for item in weather_data['list']]

df = pd.DataFrame(weather)


# To allow interpolation set index of df to every hour of the day
start_date = df["time_of_day"].min()
end_date = df["time_of_day"].max()
hourly_range = pd.date_range(start=start_date, end=end_date, freq='H')
df = df.set_index('time_of_day').reindex(hourly_range).reset_index()

df.rename(columns={'index': 'time_of_day'}, inplace=True)
df_interpolated = df.interpolate(method='linear')
df_interpolated['description'] = df_interpolated['description'].fillna(method='ffill')
df_interpolated = df_interpolated.iloc[:24]



df = pd.DataFrame([{'station_id': d['number'], 'bike_stands': d['bike_stands']} for d in station_data])
df3 = df_interpolated.merge(df, how ="cross")
df3['month'] = pd.to_datetime(df3['time_of_day']).dt.month
df3['day'] = pd.to_datetime(df3['time_of_day']).dt.day
df3['hour'] = pd.to_datetime(df3['time_of_day']).dt.hour
df3['weekday_num'] = df3['time_of_day'].dt.weekday + 1  




def predict_bike_availability(df):
   
    with open('flask_app\your_model.pkl', 'rb') as file:
        model = pickle.load(file)
    predictions = model.predict(df).round()
    
    return predictions


