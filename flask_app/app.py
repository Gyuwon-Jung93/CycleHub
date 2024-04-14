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
from ml_model import df3
import json
from aws_rds.database import Session
from aws_rds.models import Station, Availability
from sqlalchemy.sql import func
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))




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

@app.route('/predict', methods=['POST'])
def predict():

    station_id = int(request.form['station_id'])
    df_station = df3[df3['station_id'] == station_id].copy()
    times = df3.iloc[df3[df3["station_id"]==station_id].index]["time_of_day"]
    bike_stands = df3.iloc[df3[df3["station_id"]==station_id].index]["bike_stands"].iloc[0]
    times_formatted = times.dt.strftime('%a %H:%m')
    predictions = predict_bike_availability(df_station)
    

    sns.set_style("ticks")
    sns.set_context("paper")
    plt.figure(figsize=(3, 3))
    plot = sns.lineplot(x=times_formatted, y=predictions, color='orange')
    plt.xlabel('Time', color='grey')
    plt.ylabel('Bikes', color='grey')
    plt.title('Forecasted Bike Availability', color='grey')
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



@app.route('/stations')
def get_stations():
    try:
        session = Session()
 
        latest_update_subq = session.query(
            Availability.station_id,
            func.max(Availability.last_update).label('max_last_update')
        ).group_by(Availability.station_id).subquery('latest_updates')

        stations_with_latest_availability = session.query(
            Station.station_id,
            Station.name,
            Station.address,
            Station.position_lat,
            Station.position_lng,
            Station.banking,
            Station.bonus,
            Availability.available_bike_stands,
            Availability.bike_stands,
            Availability.available_bikes,
            Availability.status,
            Availability.last_update
        ).join(Availability, Station.station_id == Availability.station_id
        ).join(latest_update_subq, and_(
            Availability.station_id == latest_update_subq.c.station_id,
            Availability.last_update == latest_update_subq.c.max_last_update
        )).all()

        stations_data = []
        for (station_id, name, address, position_lat, position_lng, banking, bonus, available_bike_stands, bike_stands, available_bikes, status, last_update) in stations_with_latest_availability:
            station_data = {
                "number": station_id,
                "contract_name": "dublin", 
                "name": name,
                "address": address,
                "position": {"lat": position_lat, "lng": position_lng},
                "banking": bool(banking),
                "bonus": bool(bonus),
                "bike_stands": bike_stands,
                "available_bike_stands": available_bike_stands,
                "available_bikes": available_bikes,
                "status": status,
                "last_update": last_update.timestamp() * 1000 
            }
            stations_data.append(station_data)

        session.close()

        with open('stations_data.json', 'w') as f:
            json.dump(stations_data, f, indent=4)

        return jsonify(stations_data)
    except SQLAlchemyError as e:
        print(f"Database access failed: {e}, attempting API fallback.")
        try:
            contract_name = "dublin"
            api_key = '99d3e65801ab0bdae585264b25d443c5545365b5'
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
    api_key = "6def6f5458e3226a4a33490f6635e269"
    lat = 53.346304
    lon = -6.2554112
    weather_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    response = requests.get(weather_url)
    weather_data = response.json()
    return jsonify(weather_data)


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