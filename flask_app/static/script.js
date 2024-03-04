document.addEventListener('DOMContentLoaded', function () {
    initMap();
    getWeather();
    showTime();
    dateTimeSelected();
});

async function initMap() {
    let map;
    let markers = [];
    let locations = [];
    let mapSetting = [
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
    ];
    let customMapType = new google.maps.StyledMapType(mapSetting, { name: 'custom_style' });
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
            zoomControl: true,
        });
    }
    map.mapTypes.set('custom_style', customMapType);
    map.setMapTypeId('custom_style');

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
    let markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        gridSize: 180,
    });
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
