
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

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
from ml_model import predict_bike_availability
from ml_model import df3
import json
from aws_rds.database import Session
from aws_rds.models import Station, Availability
from sqlalchemy.sql import func
from sqlalchemy.orm import aliased

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Create our flask app. Static files are served from 'static' directory
app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})

# this route simply serves 'static/index.html'
@app.route('/')
def root():
    return app.send_static_file('index.html')



# Define a route to handle form submission and display predictions
@app.route('/predict', methods=['POST'])
def predict():
 # Get user input from the form
    station_id = int(request.form['station_id'])
    
    #Filter the DataFrame for the specified station_id
    df_station = df3[df3['station_id'] == station_id].copy()
    times = df3.iloc[df3[df3["station_id"]==station_id].index]["time_of_day"]
    bike_stands = df3.iloc[df3[df3["station_id"]==station_id].index]["bike_stands"].iloc[0]

    times_formatted = times.dt.strftime('%d %H')

    #Perform prediction using the machine learning model
    predictions = predict_bike_availability(df_station)
    
    


    sns.set_style("ticks")
    sns.set_context("paper")
    plt.figure(figsize=(3, 3))

    plot = sns.barplot(x=times_formatted, y=predictions, color='orange')
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
    
    # Construct the HTML response with the embedded plot
    html_response = f""" 
        <img src="data:image/png;base64,{plot_data}" alt="Predicted Plot">
    """
    
    
    return html_response



@app.route('/stations')
def get_stations():
    try:
        session = Session()

        # Subquery to get the most recent last_update for each station_id
        subq = session.query(
            Availability.station_id,
            func.max(Availability.last_update).label('max_last_update')
        ).group_by(Availability.station_id).subquery()

        # Aliased to join on the same table with conditions
        latest_availability = aliased(Availability)

        # Query stations and join with the subquery to fetch latest availability details
        stations_query = session.query(
            Station,
            latest_availability.available_bike_stands,
            latest_availability.bike_stands,
            latest_availability.available_bikes,
            latest_availability.status,
            latest_availability.last_update
        ).outerjoin(
            latest_availability, 
            (Station.station_id == latest_availability.station_id) & 
            (latest_availability.last_update == subq.c.max_last_update)
        ).all()

        session.close()

        stations = [
            {
                "number": station.station_id,
                "contract_name": "dublin",
                "name": station.name,
                "address": station.address,
                "position": {
                    "lat": station.position_lat,
                    "lng": station.position_lng
                },
                "banking": bool(station.banking),
                "bonus": bool(station.bonus),
                "bike_stands": availability.bike_stands if availability else 0,
                "available_bike_stands": availability.available_bike_stands if availability else 0,
                "available_bikes": availability.available_bikes if availability else 0,
                "status": availability.status if availability else "UNKNOWN",
                "last_update": availability.last_update.timestamp() * 1000 if availability else 0  # Convert to milliseconds
            }
            for station, availability in stations_query
        ]
        
        with open('stations.json', 'w') as f:
            json.dump(stations, f, indent=4)
        
        return jsonify(stations)
    except SQLAlchemyError as e:
        print(f"Database access failed: {e}, attempting API fallback.")
        try:
            contract_name = "dublin"
            api_key = '99d3e65801ab0bdae585264b25d443c5545365b5'
            base_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
            response = requests.get(base_url)
            stations = response.json()
            with open('stations.json', 'w') as file:
                json.dump(stations, file, indent=4)
            return jsonify(stations)
        except requests.RequestException  as e:
            print(f"Failed to fetch data from API: {e}")
            return jsonify({"error": "Cannot Load data"})




@app.route('/weather', methods=['GET'])
def get_weather():
    ## city = request.args.get('city')
    api_key = "6def6f5458e3226a4a33490f6635e269"
    lat = 53.346304
    lon = -6.2554112
    weather_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    ## weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    response = requests.get(weather_url)
    weather_data = response.json()
    return jsonify(weather_data)


@app.route('/stationSearch', methods=['GET'])
def get_stations_from_file():
    try:
        open(os.path.join(app.root_path, 'stations.json'), 'r')
        with open('stations.json', 'r') as file:
            stations = json.load(file)
        return jsonify(stations)
    except FileNotFoundError:
        return jsonify({"error": "Stations file not found"}), 404

if __name__ == "__main__": 
    app.run(debug=True)
