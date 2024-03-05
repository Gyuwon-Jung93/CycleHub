document.addEventListener('DOMContentLoaded', function () {
    initMap();
    getWeather();
    showTime();
    dateTimeSelected();
});
let map;
let markers = [];
async function initMap() {
    let locations = [];
    const { Map } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

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

    //Current location add
    const locationButton = document.createElement('button');
    locationButton.classList.add('custom-map-control-button');

    //Google maps options setting
    if (mapDiv) {
        map = new Map(mapDiv, {
            center: mapCenter,
            zoom: 15,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
            },
            mapId: '4504f8b37365c3d0',
            styles: [
                {
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#f5f5f5',
                        },
                    ],
                },
                {
                    elementType: 'labels.icon',
                    stylers: [
                        {
                            visibility: 'off',
                        },
                    ],
                },
                {
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#616161',
                        },
                    ],
                },
                {
                    elementType: 'labels.text.stroke',
                    stylers: [
                        {
                            color: '#f5f5f5',
                        },
                    ],
                },
                {
                    featureType: 'administrative.land_parcel',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#bdbdbd',
                        },
                    ],
                },
                {
                    featureType: 'poi',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#eeeeee',
                        },
                    ],
                },
                {
                    featureType: 'poi',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#757575',
                        },
                    ],
                },
                {
                    featureType: 'poi.business',
                    stylers: [
                        {
                            visibility: 'off',
                        },
                    ],
                },
                {
                    featureType: 'poi.park',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#e5e5e5',
                        },
                    ],
                },
                {
                    featureType: 'poi.park',
                    elementType: 'labels.text',
                    stylers: [
                        {
                            visibility: 'off',
                        },
                    ],
                },
                {
                    featureType: 'poi.park',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#9e9e9e',
                        },
                    ],
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#ffffff',
                        },
                    ],
                },
                {
                    featureType: 'road.arterial',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#757575',
                        },
                    ],
                },
                {
                    featureType: 'road.highway',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#dadada',
                        },
                    ],
                },
                {
                    featureType: 'road.highway',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#616161',
                        },
                    ],
                },
                {
                    featureType: 'road.local',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#9e9e9e',
                        },
                    ],
                },
                {
                    featureType: 'transit.line',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#e5e5e5',
                        },
                    ],
                },
                {
                    featureType: 'transit.station',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#eeeeee',
                        },
                    ],
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [
                        {
                            color: '#c9c9c9',
                        },
                    ],
                },
                {
                    featureType: 'water',
                    elementType: 'geometry.fill',
                    stylers: [
                        {
                            color: '#bcd4eb',
                        },
                    ],
                },
                {
                    featureType: 'water',
                    elementType: 'labels.text.fill',
                    stylers: [
                        {
                            color: '#9e9e9e',
                        },
                    ],
                },
            ],
        });
    }

    // Add some markers to the map.
    stations_info.forEach((station) => {
        let markerColor = '#008000';

        if (station.available_bikes <= 3) {
            markerColor = '#FF0000'; // Red
        } else if (station.available_bikes <= 5) {
            markerColor = '#FFA500'; // Orange
        } else if (station.available_bikes <= 10) {
            markerColor = '#FFFF00'; // Yellow
        }
        const pinElement = new PinElement({
            background: markerColor, // Example: setting the background to red
            glyphColor: '#000000',
        });

        const marker = new AdvancedMarkerElement({
            map: map,
            position: new google.maps.LatLng(station.position.lat, station.position.lng),
            title: station.name, // Optional: add a title
            content: pinElement.element, // Use the custom SVG icon
        });

        // Create an info window
        let infoWindow = new google.maps.InfoWindow({
            content: `
        <h3 class="stationdetails">${station.name}</h3>
        <p class="stationdetails">Address: ${station.address}</p>
        <p class="stationdetails">Bikes_stands: ${station.bike_stands}</p>
        <p class="stationdetails">Available bikes: ${station.available_bikes}</p>
        <p class="stationdetails">Available bike stands: ${station.available_bike_stands}</p>
        <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
        <p class="stationdetails">Status: ${station.status}</p>`,
            // You can add more station details here
        });
        //Add click event listener to the marker
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
    //marker cluster
    const clusterer = new markerClusterer.MarkerClusterer({ markers, map, maxZoom: 40 });
}

async function getWeather() {
    fetch(`/weather?city=dublin`)
        .then((response) => response.json())
        .then((data) => {
            // weather details for widget
            let currentDate = new Date();
            let dayOfWeek = currentDate.getDay();
            let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let currentDay = daysOfWeek[dayOfWeek];

            let weatherimage;
            let temperature = document.getElementById('temperature');
            let clouds = document.getElementById('clouds');
            if ((data.weather[0].main = 'clear')) {
                weatherimage = `<img id="weatherimage" src="/static/image/weather_overcast.png" />`;
            }
            // need to add else if statements here for sunny, raining, and sunny showers, but not sure of data.weather[0].main strings
            temperature.innerHTML = data.main.temp + '°C ' + '<br>' + currentDay;
            clouds.innerHTML = data.weather[0].main + '<br>' + weatherimage;
            // end
        })
        .catch((error) => console.log('Error:', error));
}

// when user clicks on specific date, statistics returns
// to be finished later using ML model

async function dateTimeSelected(inputType) {
    let selectedValue;
    if (inputType === 'date') {
        selectedValue = document.getElementById('dateInput').value;
    } else if (inputType === 'time') {
        selectedValue = document.getElementById('timeInput').value;
    }

    // more to come
}

async function showTime() {
    setInterval(function () {
        let date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();

        let displayTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes;

        document.getElementById('time').innerHTML = displayTime;
    }, 1000); // 1000 milliseconds = 1 second
}

//Reuse same flask call
document.getElementById('station-search').addEventListener('input', async function (e) {
    const input = this.value;
    const resultsDiv = document.getElementById('search-results');

    if (input.length >= 3) {
        const response = await fetch('/stations');
        const stations = await response.json();
        resultsDiv.innerHTML = ''; // Clear previous results

        stations
            .filter((station) => station.name.toLowerCase().includes(input.toLowerCase()))
            .forEach((station) => {
                const div = document.createElement('div');
                div.innerHTML = station.name; // Display station name
                div.className = 'station-result';
                div.onclick = function () {
                    // Find the marker that matches the clicked station
                    const markerObj = markers.find((m) => m.qz === station.name);
                    if (markerObj) {
                        const stationName = markerObj.Ds;
                        const marker = new google.maps.Marker({
                            position: { stationName },
                            position: new google.maps.LatLng(station.position.lat, station.position.lng),
                            map: map,
                        });
                        // Move the map to the selected marker
                        map.setCenter(stationName);
                        map.setZoom(17);
                        // Assuming we have stored InfoWindow objects in a map or similar structure
                        // This part assumes you have an existing mechanism to match markers with InfoWindows
                        // For simplicity, let's assume each marker's 'title' property matches the station name and use it to find the corresponding InfoWindow
                        let infoWindow = new google.maps.InfoWindow({
                            content: `
                                <h3 class="stationdetails">${station.name}</h3>
                                <p class="stationdetails">Address: ${station.address}</p>
                                <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
                                <p class="stationdetails">Available bikes: ${station.available_bikes}</p>
                                <p class="stationdetails">Available bike stands: ${station.available_bike_stands}</p>
                                <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
                                <p class="stationdetails">Status: ${station.status}</p>
                            `,
                        });

                        // Open the InfoWindow on the map at the marker's location
                        infoWindow.open(map, marker);
                    }
                };
                resultsDiv.appendChild(div);
            });

        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.style.display = 'none';
    }
});
function displayResults(stations) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    stations.forEach((station) => {
        const div = document.createElement('div');
        div.className = 'station-result';
        div.textContent = station.name;
        resultsContainer.appendChild(div);
    });
}
