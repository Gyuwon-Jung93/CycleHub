#!/usr/bin/env python
from flask import Flask,jsonify, request
from flask import Flask, render_template
import requests
from flask_cors import CORS
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from ml_model import predict_bike_availability
from ml_model import df3


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
    
    # Filter the DataFrame for the specified station_id
    df_station = df3[df3['station_id'] == station_id].copy()
    times = df3.iloc[df3[df3["station_id"]==station_id].index]["time_of_day"]

   
    
    # Perform prediction using the machine learning model
    predictions = predict_bike_availability(df_station)
    
    # Plot the predictions
    plt.figure(figsize=(10, 6))
    plt.plot(times, predictions, label='Predicted', color='orange')
    plt.xlabel('Time')
    plt.ylabel('Value')
    plt.title('Predicted Values Over Time')
    plt.legend()
    plt.xticks(rotation=45)  # Rotate x-axis labels for better readability
    
    # Convert the plot to a base64-encoded image
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    plot_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    plt.close()
    
    # Construct the HTML response with the embedded plot
    html_response = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Predictions</title>
    </head>
    <body>
        <h1>Predicted Values for Station {station_id}</h1>
        <img src="data:image/png;base64,{plot_data}" alt="Predicted Plot">
    </body>
    </html>
    """
    
    
    return html_response


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