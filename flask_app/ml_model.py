import requests
from datetime import datetime
import pickle
import pandas as pd
#Need to construct dataframe for next 24 hours to generate charts

# For fetching future weather data, collects 7 days in the future
def fetch_weather_data(lat, lng):
    
    API_KEY = 'xxxxxxxxxxxxxxxxxxxxxx'
    BASE_URL = f" https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lng}&appid={API_KEY}"

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

#fetch up to date staion ids and bike stands
def fetch_decaux_data():
    CONTRACT_NAME = "dublin"
    API_KEY = 'xxxxxxxxxxxxxxxxxxx'
    BASE_URL = f"https://api.jcdecaux.com/vls/v1/stations?contract={CONTRACT_NAME}&apiKey={API_KEY}"

    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None




# Process function
def process_data(weather_data, station_data):
    # Early exit if data fetching failed
    if weather_data is None or station_data is None:
        print("Error fetching data. Exiting.")
        return None
    else:
        weather = [{'time_of_day': datetime.utcfromtimestamp(item['dt']),
                    'wind_speed': item['wind']['speed'],
                    'temperature': item['main']['temp'] - 273.15,
                    'description': item['weather'][0]['description']}
                for item in weather_data['list']]

        df_weather = pd.DataFrame(weather)
        # To allow interpolation set index of df to every hour of the day
        start_date = df_weather["time_of_day"].min()
        end_date = df_weather["time_of_day"].max()
        hourly_range = pd.date_range(start=start_date, end=end_date, freq='H')
        df_weather = df_weather.set_index('time_of_day').reindex(hourly_range).reset_index()

        df_weather.rename(columns={'index': 'time_of_day'}, inplace=True)
        df_interpolated = df_weather.interpolate(method='linear')
        df_interpolated['description'] = df_interpolated['description'].fillna(method='ffill')
        df_interpolated = df_interpolated.iloc[:24]



        df_station = pd.DataFrame([{'station_id': d['number'], 'bike_stands': d['bike_stands']} for d in station_data])
        future_data = df_interpolated.merge(df_station, how ="cross")
        future_data['month'] = pd.to_datetime(future_data['time_of_day']).dt.month
        future_data['day'] = pd.to_datetime(future_data['time_of_day']).dt.day
        future_data['hour'] = pd.to_datetime(future_data['time_of_day']).dt.hour
        future_data['weekday_num'] = future_data['time_of_day'].dt.weekday + 1 
        return future_data

def predict_bike_availability(df):
   
    with open('your_model.pkl', 'rb') as file:
        model = pickle.load(file)
    predictions = model.predict(df).round()
    
    return predictions

# Function for making dataframe without 24hr restriction
def make_dataframe_without_day_restriction(weather_data, station_data):
    # Early exit if data fetching failed
    if weather_data is None or station_data is None:
        print("Error fetching data. Exiting.")
        return None
    else:
        weather = [{'time_of_day': datetime.utcfromtimestamp(item['dt']),
                    'wind_speed': item['wind']['speed'],
                    'temperature': item['main']['temp'] - 273.15,
                    'description': item['weather'][0]['description']}
                for item in weather_data['list']]

        df_weather = pd.DataFrame(weather)
        start_date = df_weather["time_of_day"].min()
        end_date = df_weather["time_of_day"].max()
        hourly_range = pd.date_range(start=start_date, end=end_date, freq='H')
        df_weather = df_weather.set_index('time_of_day').reindex(hourly_range).reset_index()
        df_weather.rename(columns={'index': 'time_of_day'}, inplace=True)
        df_interpolated = df_weather.interpolate(method='linear')
        df_interpolated['description'] = df_interpolated['description'].fillna(method='ffill')
        df_station = pd.DataFrame([{'station_id': d['number'], 'bike_stands': d['bike_stands']} for d in station_data])
        future_data = df_interpolated.merge(df_station, how ="cross")
        future_data['month'] = pd.to_datetime(future_data['time_of_day']).dt.month
        future_data['day'] = pd.to_datetime(future_data['time_of_day']).dt.day
        future_data['hour'] = pd.to_datetime(future_data['time_of_day']).dt.hour
        future_data['weekday_num'] = future_data['time_of_day'].dt.weekday + 1 
        return future_data

weather_data = fetch_weather_data(53.3498,-6.2603)
station_data = fetch_decaux_data()
future_data = process_data(weather_data,station_data)

# Making Dataframe without 24 hr restriction for Day and Time Prediction
dat_time_predict = make_dataframe_without_day_restriction(weather_data,station_data)

def predict_bike_availability_date_time(hour, day, station_id):
    
    filtered_df = dat_time_predict[(dat_time_predict['hour'] == hour) & (dat_time_predict['weekday_num'] == day) & (dat_time_predict['station_id'] == station_id)].copy()
    with open('your_model.pkl', 'rb') as file:
        model = pickle.load(file)
    predictions = model.predict(filtered_df).round()
    return predictions
