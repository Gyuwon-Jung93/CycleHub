document.addEventListener('DOMContentLoaded', function () {
    initMap();
    // getWeather();  fix this later
    showTime();
    dateTimeSelected();

    // Toggles the open sidebar icon 
    let toggleButton = document.getElementById("openToggle");
    toggleButton.addEventListener("click", function() {
        
        if (toggleButton.classList.contains("bx-chevron-right")) {
            // If it contains "bx-chevron-right", replace it with "bx-chevron-left"
            toggleButton.classList.remove("bx-chevron-right");
            toggleButton.classList.add("bx-chevron-left");
        } else {
            // If it contains "bx-chevron-left", replace it with "bx-chevron-right"
            toggleButton.classList.remove("bx-chevron-left");
            toggleButton.classList.add("bx-chevron-right");
        }
    });
});

const body = document.querySelector('body'),
    sidebar = body.querySelector('.sidebar'),
    toggle = body.querySelector('.toggle'),
    searchBtn = body.querySelector('.search-box'),
    modeSwitch = body.querySelector('.toggle-switch'),
    modeText = body.querySelector('.mode-text');

modeSwitch.addEventListener('click', () => {
    body.classList.toggle('dark');
    if (darkModeFlag == false) {
        darkModeFlag = true;
    } else {
        darkModeFlag = false;
    }
    initMap();
});

toggle.addEventListener('click', () => {
    sidebar.classList.toggle('close');
});

// Function to calculate the distance between two points using the Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Calculate distances and find the closest destination
let closestDestination = null;
let closestDistance = Infinity;

async function findNearestStation(loca) {
    let closestDestination = null;
    let closestDistance = Infinity;
    const responseFind = await fetch('/stations');
    const stations_info_stat = await responseFind.json();
    const destinations = stations_info_stat.map(station => ({
        lat: station.position.lat,
        lng: station.position.lng,
    }));
    try {
        const location = await geocodeAddress(loca);
        destinations.forEach(destination => {
            const distance = getDistanceFromLatLonInKm(location.lat(), location.lng(), destination.lat, destination.lng);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestDestination = destination;
            }
        });
        return closestDestination;
    } catch (error) {
        console.error("Error finding nearest station:", error);
        errorResult.innerHTML = 'Directions request failed. Try again';
        throw error;
    }
}

//When the user inputs a location it will be a trigger
function searchDest(event) {
    event.preventDefault(); // Prevent the usual form submission behavior
    let locationInput = document.getElementById('searchLocation');
    let destInput = document.getElementById('searchDestination');
    calculateAndDisplayRoute(locationInput.value, destInput.value);
};
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
                const location = results[0].geometry.location;
                resolve(location);
            } else {
                reject("Geocode was not successful for the following reason: " + status);
                errorResult.innerHTML = 'Directions request failed. Try again';
            }
        });
    });
};
// Google Directions API
let previousDirectionsRenderer = null;

async function calculateAndDisplayRoute(loc, dest) {
    const errorResult = document.getElementById('errorResult');
    errorResult.innerHTML = '';
    try {
        const dest1 = await findNearestStation(loc);
        const dest2 = await findNearestStation(dest);
        console.log(loc, dest, dest1, dest2);
        
        let directionsService = new google.maps.DirectionsService();
        let directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        if (previousDirectionsRenderer) {
            previousDirectionsRenderer.setMap(null); // Remove previous renderer from the map
        }
        previousDirectionsRenderer = directionsRenderer; // Update previous renderer reference

        directionsService.route({
            origin: loc,
            destination: dest,
            waypoints: [
                {
                    location: dest1,
                    stopover: true
                },
                {
                    location: dest2,
                    stopover: true
                }
            ],
            provideRouteAlternatives: false,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            } else {
                console.error("Directions request failed:", status);
                errorResult.innerHTML = 'Directions request failed. Try again';
                setTimeout(() => {
                    errorResult.innerHTML = ''; // Remove the error message
                }, 3000);
                
            }
        });
    } catch (error) {
        console.error("Error calculating and displaying route:", error);
    }
};

let darkModeFlag = false;
let map;
let markers = [];
let currLatLng;
async function initMap() {
    let locations = [];
    const { Map } = await google.maps.importLibrary('maps');
    //fetch station information data from the flask Server
    //install pip3 flask-cors to fetch data
    const response = await fetch('/stations');
    const stations_info = await response.json();

    locations = stations_info.map((station) => ({
        lat: station.position.lat,
        lng: station.position.lng,
    }));
    // Current Users Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                let markerImg = document.createElement('img');
                markerImg.src = '/static/image/home_icon.png';
                markerImg.width = 50; // Width in pixels
                markerImg.height = 50; // Height in pixels

                new google.maps.Marker({
                    position: currLatLng,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: markerImg.src,
                        scaledSize: new google.maps.Size(50, 50), // Adjust size as needed
                    },
                });
            },
            (error) => {
                console.error(error);
            },
            {
                //enableHighAccuracy added 21/3/2024 Gyuwon
                enableHighAccuracy: true, // This requests the highest possible accuracy.
                timeout: 10000, // Maximum time in milliseconds to wait for a response.
                maximumAge: 0, // Maximum age in milliseconds of a possible cached position that is acceptable to return.
            }
        );
    };

    //Googlemaps loading
    const mapDiv = document.getElementById('map');
    const mapCenter = { lat: 53.3483031, lng: -6.2637067 };

    //Current location add
    const locationButton = document.createElement('button');
    locationButton.classList.add('custom-map-control-button');

    //GoogleMaps Style Select

    if (darkModeFlag) {
        customStyle = darkStyleArray;
    } else {
        customStyle = brightStyleArray;
    }

    if (mapDiv) {
        map = new Map(mapDiv, {
            center: mapCenter,
            zoom: 13,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
            },
            styles: customStyle,
        });
    }

    // Add some markers to the map.
    // set the number as a percentage
    stations_info.forEach((station) => {
        let markerImg = document.createElement('img');
        markerImg.src = '/static/image/redMarker.png';
        let bikeAvailability = ((station.available_bikes / station.bike_stands) * 100).toFixed();
        if (bikeAvailability == 0) {
            markerImg.src = './static/image/grayMarker.png';
        } else if (bikeAvailability > 0 && bikeAvailability < 40) {
            markerImg.src = './static/image/redMarker.png';
        } else if (bikeAvailability >= 40 && bikeAvailability < 50) {
            markerImg.src = './static/image/orangeMarker.png';
        } else {
            markerImg.src = './static/image/greenMarker.png';
        }
        const marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(station.position.lat, station.position.lng),
            title: station.name, // Optional: add a title
            icon: { url: markerImg.src, scaledSize: new google.maps.Size(40, 40) },
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
        <p class="stationdetails">Status: ${station.status}</p>
        <p class="stationdetails">Available Percent: ${(
            (station.available_bikes / station.bike_stands) *
            100
        ).toFixed()}%</p>`,
            // You can add more station details here
        });
        //Add click event listener to the marker
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });
    //marker cluster
    let clusterer = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
    });
};

// I have no clue why, but this is causing problems with the Search Stations

// google.maps.event.addListener(markerCluster, 'clusterclick', function (cluster) {
//     // Get the bounds of the cluster
//     let bounds = new google.maps.LatLngBounds();

//     // Add each marker's position to the bounds
//     cluster.getMarkers().forEach(function (marker) {
//         bounds.extend(marker.getPosition());
//     });

//     // Adjust the map's viewport to ensure all markers in the cluster are visible
//     map.fitBounds(bounds);

//     // Optionally, if you want to zoom in just one level, you can use:
//     map.setCenter(cluster.getCenter());
//     map.setZoom(map.getZoom() + 1);
// });


// Fix weather !

// async function getWeather() {
//     fetch(`/weather?city=dublin`)
//         .then((response) => response.json())
//         .then((data) => {
//             // weather details for widget
//             let currentDate = new Date();
//             let dayOfWeek = currentDate.getDay();
//             let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//             let currentDay = daysOfWeek[dayOfWeek];

//             let weatherimage;
//             let temperature = document.getElementById('temperature');
//             let clouds = document.getElementById('clouds');
//             if ((data.weather[0].main = 'clear')) {
//                 weatherimage = `<img id="weatherimage" src="/static/image/weather_overcast.png" />`;
//             }
//             // need to add else if statements here for sunny, raining, and sunny showers, but not sure of data.weather[0].main strings
//             temperature.innerHTML = data.main.temp.toFixed() + '°C ' + '<br>' + currentDay;
//             clouds.innerHTML = data.weather[0].main + '<br>' + weatherimage;
//             // end
//         })
//         .catch((error) => console.log('Error:', error));
// };

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

// Fix time!

async function showTime() {
    setInterval(function () {
        let date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();

        let displayTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes;

        document.getElementById('time').innerHTML = displayTime;
    }, 1000); // 1000 milliseconds = 1 second
};


//Reuse same flask call
document.getElementById('station-searcher').addEventListener('input', async function (e) {
    const input = this.value;
    const resultsDiv = document.getElementById('search-results-stations');

    
    if (input.length >= 3) {
        const response = await fetch('/stations');
        const stations = await response.json();
        resultsDiv.innerHTML = ''; // Clear previous results
        

        stations
            .filter((station) => station.name.toLowerCase().includes(input.toLowerCase()))
            .forEach((station) => {
                //Make div for searching result
                const div = document.createElement('div');
                div.innerHTML = station.name; // Display station name
                div.className = 'station-result';
                //Move zoom to the target station the user cliked
                div.onclick = function () {
                    resultsDiv.style.display = 'None';
                    // Find the marker that matches the clicked station
                    // Object's index name changes when we change marker style(Advanced=>Legacy Marker)
                    const markerObj = markers.find((m) => m.title === station.name);
                    if (markerObj) {
                        // Move the map to the selected marker
                        let searchLat = station.position.lat;
                        let searchLng = station.position.lng;
                        map.setCenter(new google.maps.LatLng(searchLat, searchLng));
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
                        infoWindow.open(map, markerObj);
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

// Trigger search function when Enter key is pressed in the input field (destination or location)
document.getElementById("searchDestination").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchDest(event);
    }
});

document.getElementById("searchLocation").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchDest(event);
    }
});