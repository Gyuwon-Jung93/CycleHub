#!/usr/bin/env python
from flask import Flask,jsonify, request
import requests
from flask_cors import CORS
import pickle

# Create our flask app. Static files are served from 'static' directory
app = Flask(__name__, static_url_path='/static')
CORS(app, resources={r"/*": {"origins": "*"}})

# this route simply serves 'static/index.html'
@app.route('/')
def root():
    return app.send_static_file('index.html')


# Load the pickled model
with open('your_model.pkl', 'rb') as file:
    model = pickle.load(file)




# Define a route for handling station clicks
@app.route('/predict', methods=['POST'])
def predict():
    
    # Get station data from request
    station_data = request.json

    # Perform prediction using your model
    prediction = model.predict(station_data)  # Replace this with actual prediction logic

    # Return prediction result
    return str(prediction)


# Scrapping DATA
# it has to be changed to get data from DataBase later.
# We need to hide the API keys later
@app.route('/stations')
def get_stations():
    contract_name = "dublin"
    api_key = '99d3e65801ab0bdae585264b25d443c5545365b5'
    base_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
    response = requests.get(base_url)
    stations = response.json()

    return jsonify(stations)

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    api_key = "6def6f5458e3226a4a33490f6635e269"
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    response = requests.get(weather_url)
    weather_data = response.json()
    return jsonify(weather_data)

if __name__ == "__main__": 
    app.run(debug=True)