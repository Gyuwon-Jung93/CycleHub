document.addEventListener('DOMContentLoaded', function () {
    initMap();
    getWeather();
});

async function initMap() {
    let map;
    let markers = [];
    let locations = [];

    //fetch station information data from the flask Server
    //install pip3 flask-cors to fetch data
    const response = await fetch('/stations');
    const stations_info = await response.json();

    locations = stations_info.map((station) => ({
        lat: station.position.lat,
        lng: station.position.lng,
    }));

    //Googlemaps loading
    const mapDiv = document.getElementById('map');
    const mapCenter = { lat: 53.3483031, lng: -6.2637067 };
    const { PinElement } = await google.maps.importLibrary('marker');
    if (mapDiv) {
        map = new google.maps.Map(mapDiv, {
            center: mapCenter,
            zoom: 13,
        });
    }

    // Add some markers to the map.
    //developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization?hl=ko

    stations_info.forEach((station) => {
        let markerColor;

        if (station.available_bikes <= 3) {
            markerColor = '#FF0000'; // Red
        } else if (station.available_bikes <= 5) {
            markerColor = '#FFA500'; // Orange
        } else if (station.available_bikes <= 10) {
            markerColor = '#FFFF00'; // Yellow
        } else {
            markerColor = '#008000'; // Green
        }
        const pinElement = new PinElement({
            background: markerColor, // Example: setting the background to red
            glyphColor: '#000000',
        });

        let marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(station.position.lat, station.position.lng),
            title: station.name, // Optional: add a title
            icon: pinElement, // Use the custom SVG icon
        });

        // Create an info window
        let infoWindow = new google.maps.InfoWindow({
            content: `
        <h3>${station.name}</h3>
        <p>Address: ${station.address}</p>
        <p>Bikes_stands: ${station.bike_stands}</p>
        <p>Available bikes: ${station.available_bikes}</p>
        <p>Available bike stands: ${station.available_bike_stands}</p>
        <p>Banking: ${station.banking ? 'Yes' : 'No'}</p>
        <p>Status: ${station.status}</p>`,
            // You can add more station details here
        });
        //Add click event listener to the marker
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
        markers.push(marker);
    });
    //marker cluster
    let markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        gridSize: 180,
    });
}

async function getWeather() {
    fetch(`/weather?city=dublin`)
        .then((response) => response.json())
        .then((data) => {
            var weather = document.getElementById('weatherResult');
            weather.innerHTML = 'Temperature: ' + data.main.temp + '°C<br>' + 'Weather: ' + data.weather[0].main;
        })
        .catch((error) => console.log('Error:', error));
}
