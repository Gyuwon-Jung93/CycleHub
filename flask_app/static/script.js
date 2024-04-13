document.addEventListener('DOMContentLoaded', function () {
    initMap();
    getWeather();
    // dateTimeSelected();
    getTodayDate();

    /* AutoComplete letiable */
    const searchLocationInput = document.getElementById('searchLocation');
    const searchDestinationInput = document.getElementById('searchDestination');
    initializeAutocomplete(searchLocationInput);
    initializeAutocomplete(searchDestinationInput);

    // Toggles the open sidebar icon and the chart visibility
    let toggleButton = document.getElementById('openToggle');

    // Initially set the correct display based on the sidebar state
    // Assuming the sidebar starts open, we hide the chart initially

    toggleButton.addEventListener('click', function () {
        if (toggleButton.classList.contains('bx-chevron-right')) {
            // If it contains "bx-chevron-right", replace it with "bx-chevron-left"
            toggleButton.classList.remove('bx-chevron-right');
            toggleButton.classList.add('bx-chevron-left');

            // Show the chart container because the sidebar is now open
        } else {
            // If it contains "bx-chevron-left", replace it with "bx-chevron-right"
            toggleButton.classList.remove('bx-chevron-left');
            toggleButton.classList.add('bx-chevron-right');

            // Hide the chart container because the sidebar is now closed
        }
    });

    // Journey reverse function
    document.getElementById('changeButton').addEventListener('click', function () {
        // Get the input elements
        let searchLocation = document.getElementById('searchLocation');
        let searchDestination = document.getElementById('searchDestination');

        // Swap their values
        let temp = searchLocation.value;
        searchLocation.value = searchDestination.value;
        searchDestination.value = temp;
    });
});

// ********** Addlistener && Common letiables **********

//Journey reset listener
// Add a click event listener for the reset button
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('journeyReset')) {
        resetRoute();
    }
});

const body = document.querySelector('body'),
    sidebar = body.querySelector('.sidebar'),
    toggle = body.querySelector('.toggle'),
    searchBtn = body.querySelector('.search-box'),
    modeSwitch = body.querySelector('.toggle-switch'),
    modeText = body.querySelector('.mode-text');

let darkModeFlag = true;
let map;
let markers = [];
let markerCluster;
let currLatLng;
// **** time letiable ****
// let dateInput = document.getElementById('dateinput');
let day;
let hour;

// Date Time change function that changes to predictions to specified hour and day of the week

// theres a weird bug where you need to press the button twice for this to work, will fix later!

function updateDateTime() {
    console.log(day, hour);
    // Get the date and time input elements
    let dateInput = document.getElementById('dateinput');
    let timeInput = document.getElementById('timeinput');

    // Get the selected date and time values
    day = dateInput.value;
    hour = timeInput.value;

    const dateTimeSelection = document.getElementById('DateTimeSelection');
    dateTimeSelection.innerHTML = 'Day and Time Updated!';

    // Set a timeout to revert the text after 3 seconds
    setTimeout(function () {
        dateTimeSelection.innerHTML = 'Pick a date and time';
    }, 3000);
}

// window counter
let allInfoWindows = [];

//AutoCompletion
let searchLocationInput;
let searchDestinationInput;
let autocompleteObj;
let currentOpenInfoWindow = null;

let currentInfoWindow;

// Create an info window
let infoWindow;

//Reuse same flask call
document.getElementById('station-searcher').addEventListener('input', async function (e) {
    const input = this.value;
    const resultsDiv = document.getElementById('search-results-stations');

    if (input.length >= 3) {
        const response = await fetch('/stationSearch');
        const stations = await response.json();
        resultsDiv.innerHTML = ''; // Clear previous results

        stations
            .filter((station) => station.name.toLowerCase().includes(input.toLowerCase()))
            .forEach((station) => {
                // Make div for searching result
                const div = document.createElement('div');
                div.innerHTML = station.name; // Display station name
                div.className = 'station-result';
                // Move zoom to the target station the user clicked
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
                        map.setZoom(16);
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
// **** mode change ****
modeSwitch.addEventListener('click', () => {
    body.classList.toggle('dark');
    darkModeFlag = !darkModeFlag;

    if (darkModeFlag) {
        map.setOptions({ styles: darkStyleArray });
        document.getElementById('logo2').src = '/static/image/LogoBlack.png';
        document.getElementById('logo').src = '/static/image/DarkLogo.png';
    } else {
        map.setOptions({ styles: brightStyleArray });
        document.getElementById('logo2').src = '/static/image/LogoWhite.png';
        document.getElementById('logo').src = '/static/image/White.png';

        //document.getElementById('logo').setAttribute.src = 'static/image/LogoWhite.png';
    }
});

// Trigger search function when Enter key is pressed in the input field (destination or location)
document.getElementById('searchLocation').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchDest(event);
    }
});
document.getElementById('searchDestination').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        searchDest(event);
    }
});

// ********************** Function Statement **********************

/*** Main map Defintion ***/
async function initMap() {
    try {
        let locations = [];
        let { Map } = await google.maps.importLibrary('maps');
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
        }

        //Googlemaps loading
        const mapDiv = document.getElementById('map');
        const mapCenter = { lat: 53.344979, lng: -6.27209 };

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
                zoom: 14.3,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM,
                },
                fullscreenControl: false,

                styles: customStyle,
            });
        }
        map.addListener('click', () => {
            if (infoWindow) {
                infoWindow.close();
            }
        });

        async function generateChart(stationId) {
            let response;
            // Make a POST request to the /predict endpoint
            if (day && hour) {
                response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `station_id=${stationId}&day=${day}&hour=${hour}`,
                });
            } else {
                response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `station_id=${stationId}`,
                });
            }

            // Parse the HTML response
            let htmlContent = await response.text();
            document.getElementById('predictionChart').innerHTML = htmlContent;
        }

        // Add some markers to the map
        stations_info.forEach((station) => {
            let markerImg = document.createElement('img');
            markerImg.src = '/static/image/redMarker.png';
            let bikeAvailability = ((station.available_bikes / station.bike_stands) * 100).toFixed();
            if (bikeAvailability == 0) {
                markerImg.src = './static/image/redMarker.png';
            } else if (bikeAvailability > 0 && bikeAvailability < 40) {
                markerImg.src = './static/image/orangeMarker.png';
            } else {
                markerImg.src = './static/image/greenMarker.png';
            }
            const marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(station.position.lat, station.position.lng),
                title: station.name, // Optional: add a title
                icon: { url: markerImg.src, scaledSize: new google.maps.Size(25, 25) },
            });

            // Create an info window
            marker.addListener('click', () => {
                // if infoWindow is already exist, close the current window.
                if (infoWindow) {
                    infoWindow.close();
                }

                infoWindow = new google.maps.InfoWindow({
                    content: `
            <h3 class="stationdetails">${station.name}</h3>
            <p class="stationdetails">Bikes_stands: ${station.available_bike_stands} / ${station.bike_stands}</p>
            <p class="stationdetails">Available bikes: ${station.available_bikes} / ${station.bike_stands}</p>
            <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
            <p class="stationdetails">Status: ${station.status}</p>
            <p class="stationdetails">Station: ${station.number}</p>
            <div id="predictionChart"></div>`,
                    // You can add more station details here
                });
                infoWindow.open(map, marker);
                // Call a function to generate and render the chart
                generateChart(station.number);
            });

            markers.push(marker);
        });

        // Function to generate and render the chart for a specific station

        //marker cluster
        markerCluster = new MarkerClusterer(map, markers, {
            minimumClusterSize: 4,
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
            zoomOnClick: false,
        });
        //Cluster click listener
        google.maps.event.addListener(markerCluster, 'click', (markerCluster) => {
            map.setCenter(cluster.getCenter());
            map.setZoom(map.getZoom() + 3);
        });
    } catch (error) {
        console.error('InitMap Error:', error);

        // If mapDiv exists and an error occurred during map initialization, show an alert
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.innerHTML = '<div class="map-error-alert">Google maps failed to load.</div>';
            mapDiv.style.display = 'flex';
            mapDiv.style.justifyContent = 'center';
            mapDiv.style.alignItems = 'center';
            mapDiv.style.height = '100%'; // Make sure your map container has a height, so the message will be visible
        }
    }
}

function getTodayDate() {
    try {
        const options = {
            timeZone: 'Europe/London',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        };
        let todayDate = new Date().toLocaleDateString('en-GB', options);
        todayDate = todayDate.replace(/\//g, '-');
        // dateInput.min = todayDate;
    } catch (error) {
        console.error('GetTodayDate error:', error);
    }
}

// Fix weather
async function getWeather() {
    fetch(`/weather?city=dublin`)
        .then((response) => response.json())
        .then((data) => {
            // console.log(data);
            let currentDate = new Date();
            let dayOfWeek = currentDate.getDay();
            let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let currentDay = daysOfWeek[dayOfWeek];
            const temperature = document.getElementById('weatherText');
            temperature.innerHTML =
                data.weather[0].description +
                ' ' +
                data.main.temp.toFixed() +
                '°C ' +
                '</br>' +
                'High: ' +
                data.main.temp_max.toFixed() +
                '°C ' +
                '   Low: ' +
                data.main.temp_min.toFixed() +
                '°C ';
        })
        .catch((error) => console.log('Error:', error));
}

// when user clicks on specific date, statistics returns
// to be finished later using ML model

// async function dateTimeSelected(inputType) {
//     try {
//         let selectedValue;
//         if (inputType === 'date') {
//             selectedValue = document.getElementById('dateInput').value;
//         } else if (inputType === 'time') {
//             selectedValue = document.getElementById('timeInput').value;
//         }
//     } catch (e) {
//         console.error('There is an issue on dateTimeSelected function', e);
//     }

//     // more to come
// }

function displayResults(stations) {
    try {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = ''; // Clear previous results

        stations.forEach((station) => {
            const div = document.createElement('div');
            div.className = 'station-result';
            div.textContent = station.name;
            resultsContainer.appendChild(div);
        });
    } catch (e) {
        console.error('Fail to load station Data', e);
    }
}

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
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
    const destinations = stations_info_stat.map((station) => ({
        lat: station.position.lat,
        lng: station.position.lng,
    }));
    try {
        const location = await geocodeAddress(loca);
        destinations.forEach((destination) => {
            const distance = getDistanceFromLatLonInKm(
                location.lat(),
                location.lng(),
                destination.lat,
                destination.lng
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestDestination = destination;
            }
        });
        return closestDestination;
    } catch (error) {
        console.error('Error finding nearest station:', error);
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
}
function geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                resolve(location);
            } else {
                reject('Geocode was not successful for the following reason: ' + status);
                errorResult.innerHTML = 'Directions request failed. Try again';
            }
        });
    });
}
// Google Directions API
let previousDirectionsRenderer = null;
async function calculateAndDisplayRoute(loc, dest) {
    const errorResult = document.getElementById('errorResult');
    errorResult.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours(); 

    if (currentHour >= 1 && currentHour <= 5) {
        errorResult.innerHTML = 'Bikes unavailable at this time (1 AM - 5 AM).';
        setTimeout(() => {
            errorResult.innerHTML = '';
        }, 10000);
        return; 
    }

    try {
        const dest1 = await findNearestStation(loc);
        const dest2 = await findNearestStation(dest);
        console.log(dest1, dest2);

        clearMarkersAndCluster();

        let directionsService = new google.maps.DirectionsService();
        let directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        if (previousDirectionsRenderer) {
            previousDirectionsRenderer.setMap(null); // Remove previous renderer from the map
        }
        previousDirectionsRenderer = directionsRenderer; // Update previous renderer reference

        directionsService.route(
            {
                origin: loc,
                destination: dest,
                waypoints: [
                    {
                        location: dest1,
                        stopover: true,
                    },
                    {
                        location: dest2,
                        stopover: true,
                    },
                ],
                provideRouteAlternatives: false,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === 'OK') {
                    console.log(response);
                    console.log('결과');
                    directionsRenderer.setDirections(response);
                    showInfoWindowsForStops([dest1, dest2]);
                } else {
                    console.error('Directions request failed:', status);
                    errorResult.innerHTML = 'Directions request failed. Try again';
                    setTimeout(() => {
                        errorResult.innerHTML = ''; // Remove the error message
                    }, 3000);
                }
            }
        );
    } catch (error) {
        console.error('Error calculating and displaying route:', error);
    }
}


function initializeAutocomplete(inputElement) {
    try {
        //Addlistener for input
        inputElement.addEventListener('input', function () {
            const value = this.value;
            if (value.length >= 2) {
                //The length of character is over 3 words, activate Autocomplete
                if (!autocompleteObj) {
                    autocompleteObj = new google.maps.places.Autocomplete(this, { types: ['geocode'] });
                }
            } else {
                autocompleteObj = null;
            }
        });
    } catch (e) {
        console.error('Fail to initialise Autocomplete', error);
    }
}
async function showInfoWindowsForStops(locations) {
    try {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar.classList.contains('close')) {
            sidebar.classList.add('close');
        }

        if (locations.length !== 2) {
            console.error('This function expects exactly two locations to properly center the map.');
            return;
        }

        // Calculate the midpoint between the two locations
        const midpoint = {
            lat: (locations[0].lat + locations[1].lat) / 2,
            lng: (locations[0].lng + locations[1].lng) / 2,
        };

        // Set the center of the map to the midpoint
        map.setCenter(midpoint);

        // Optionally adjust the zoom level here if needed
        // map.setZoom(desiredZoomLevel);

        // Display the info windows for each location
        for (let location of locations) {
            const stationInfo = await getStationInfoByLatLng(location);
            if (stationInfo) {
                // Close the previous infoWindow if it exists

                // Create the new info window
                const infoWindow = new google.maps.InfoWindow({
                    content: generateInfoWindowContent(stationInfo),
                });
                allInfoWindows.push(infoWindow);
                // Create the marker for this location
                const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                });

                // Open the info window
                infoWindow.open(map, marker);

                // Update the reference to the current open info window
                currentOpenInfoWindow = infoWindow;

                // Add a 'closeclick' event listener to set the currentOpenInfoWindow to null when the info window is closed
                google.maps.event.addListener(infoWindow, 'closeclick', function () {
                    currentOpenInfoWindow = null;
                });
            }
        }

        // Fit the map to the bounds that include both locations
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(locations[0]);
        bounds.extend(locations[1]);
        map.fitBounds(bounds);
    } catch (e) {
        console.error('There is an issue in showInfoWindowsForStops', e);
    }
}

async function getStationInfoByLatLng(latlng) {
    try {
        responseFind = await fetch('/stations');
        if (!responseFind.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stations = await responseFind.json();
        // Find the station closest to the given latlng
        let closestStation = null;
        let closestDistance = Infinity;

        for (const station of stations) {
            const distance = getDistanceFromLatLonInKm(
                latlng.lat,
                latlng.lng,
                station.position.lat,
                station.position.lng
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestStation = station;
            }
        }
        return closestStation;
    } catch (error) {
        console.error('Could not get station information:', error);
        return null;
    }
}

function generateInfoWindowContent(station) {
    try {
        return `
        <h3 class="stationdetails">${station.name}</h3>
        <p class="stationdetails">Address: ${station.address}</p>
        <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
        <p class="stationdetails">Available bikes: ${station.available_bikes}</p>
        <p class="stationdetails">Available bike stands: ${station.available_bike_stands}</p>
        <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
        <p class="stationdetails">Status: ${station.status}</p>
        <div id="predictionChart"></div>
        <button class="journeyReset">Reset Route</button>`;
    } catch (e) {
        console.error('Fail to load station Data', e);
    }
}

function resetRoute() {
    try {
        allInfoWindows.forEach(function (infowindow) {
            infowindow.close();
        });

        // Close the current open InfoWindow if it exists
        if (currentOpenInfoWindow) {
            currentOpenInfoWindow.close();
        }

        // Remove the current directions from the map
        if (previousDirectionsRenderer) {
            previousDirectionsRenderer.setMap(null);
        }

        // Reset the search input fields
        let locationInput = document.getElementById('searchLocation');
        let destInput = document.getElementById('searchDestination');
        locationInput.value = '';
        destInput.value = '';
        let openToggleButton = document.getElementById('openToggle');
        if (openToggleButton) {
            // Remove existing classes if necessary
            openToggleButton.classList.remove('bx-chevron-left');

            // Add the new classes
            openToggleButton.classList.add('bx');
            openToggleButton.classList.add('toggle');
            openToggleButton.classList.add('bx-chevron-right');
        }
        initMap();
    } catch (e) {
        console.error('There is an issue on resetRoute', e);
    }
}
function clearMarkersAndCluster() {
    try {
        // Clear out the markers array
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];

        // Clear cluster
        if (markerCluster) {
            markerCluster.clearMarkers();
        }
    } catch (e) {
        console.error('There is an issue on clearMarkersAndCluster', e);
    }
}
