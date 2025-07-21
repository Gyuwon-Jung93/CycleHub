# app.py
import sys
import numpy as np
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from sqlalchemy import and_
from flask import Flask,jsonify, request
from flask import Flask
import requests
from flask_cors import CORS
import seaborn as sns
import matplotlib as plt
plt.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from matplotlib.ticker import MaxNLocator
from io import BytesIO
from sqlalchemy.exc import SQLAlchemyError
import base64
from ml_model import predict_bike_availability, predict_bike_availability_date_time
# from ml_model import predict_date_time
from ml_model import future_data
import json
from aws_rds.database import Session
from aws_rds.models import Station, Availability
from sqlalchemy.sql import func
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})
@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route("/process_data", methods=["POST"])
def process_data():
    hour = int(request.form['hour'])
    stat = int(request.form['station_id'])
    day = int(request.form['day'])
    result = predict_bike_availability_date_time(hour, day, stat)
    result_str = int(result[0])
    result_str = str(result_str)
    return result_str


@app.route('/stations')
def get_stations():
    try:
        contract_name = "dublin"
        api_key = os.getenv('JCDECAUX_API_KEY')
        base_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
        response = requests.get(base_url)
        stations = response.json()
        with open('stations_data.json', 'w') as file:
            json.dump(stations, file, indent=4)
        return jsonify(stations)
    except requests.RequestException  as e:
        print(f"Failed to fetch data from API: {e}")
        return jsonify({"error": "Cannot Load data"})



@app.route('/weather', methods=['GET'])
def get_weather():
    api_key = os.getenv('OPENWEATHER_API_KEY')
    lat = 53.346304
    lon = -6.2554112
    weather_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    response = requests.get(weather_url)
    weather_data = response.json()
    return jsonify(weather_data)


@app.route('/predict', methods=['POST'])
def predict():
    if future_data is None:
        html_response = '<div style="color: red;">ML_model error Chart not Available</div>'
        return html_response
    station_id = int(request.form['station_id'])
    df_station = future_data[future_data['station_id'] == station_id].copy()
    times = future_data.iloc[future_data[future_data["station_id"]==station_id].index]["time_of_day"]
    bike_stands = future_data.iloc[future_data[future_data["station_id"]==station_id].index]["bike_stands"].iloc[0]
    times_formatted = times.dt.strftime('%a %H:%m')
    predictions = predict_bike_availability(df_station)
    

    sns.set_style("ticks")
    sns.set_context("paper")
    plt.figure(figsize=(3, 3))
    plot = sns.lineplot(x=times_formatted, y=predictions, color='orange')
    plt.xlabel('Time', color='grey')
    plt.ylabel('Bikes', color='grey')
    plt.title('Forecasted Bike Availability, Next 24 hours', color='grey')
    plt.tick_params(axis='x', colors='grey')
    plt.tick_params(axis='y', colors='grey')
    plt.gca().yaxis.set_major_locator(MaxNLocator(integer=True))
    plt.xticks(rotation=45)  
    plot.xaxis.set_major_locator(ticker.LinearLocator(6))
    plt.ylim(0, bike_stands)
    plt.tight_layout()  


    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    
  
    html_response = f""" 
        <img src="data:image/png;base64,{plot_data}" alt="Predicted Plot">
    """

    return html_response




@app.route('/stationSearch', methods=['GET'])
def get_stations_from_file():
    try:
        open(os.path.join(app.root_path, 'stations_data.json'), 'r')
        with open('stations_data.json', 'r') as file:
            stations = json.load(file)
        return jsonify(stations)
    except FileNotFoundError:
        return jsonify({"error": "Stations file not found"}), 404

if __name__ == "__main__": 
    app.run(debug=True)