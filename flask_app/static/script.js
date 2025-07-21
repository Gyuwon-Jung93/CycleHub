document.addEventListener('DOMContentLoaded', function () {
    initMap();
    getWeather();
    getTodayDate();

    /*Check */
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

    // Calls function for creating, dynamically, the select options
    function generateDateTimeSelect() {
        let html = '<label>';
        html += '<select id="dateinput">';
        html += '<option selected disabled>Pick a day</option>';
        const londonTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
        const today = new Date(londonTime);
        const currentDayOfWeek = today.getDay() || 7;
        // Generate options for the next 5 days
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay() || 7;
            const dayOfWeekNumber =
                dayOfWeek === 1
                    ? 'Monday'
                    : dayOfWeek === 2
                    ? 'Tuesday'
                    : dayOfWeek === 3
                    ? 'Wednesday'
                    : dayOfWeek === 4
                    ? 'Thursday'
                    : dayOfWeek === 5
                    ? 'Friday'
                    : dayOfWeek === 6
                    ? 'Saturday'
                    : 'Sunday';
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const dayOfMonth = date.getDate();
            html += `<option value="${dayOfWeek}">${dayOfWeekNumber} ${month} ${dayOfMonth}</option>`;
        }

        html += '</select>';

        // for time
        html += '<select id="timeinput">';
        html += '<option selected disabled>Time</option>';
        const currentHour = today.getHours();
        for (let hour = 5; hour < 24; hour++) {
            if (hour <= currentHour) {
                html += `<option class="hide" value="${hour}">${hour}:00</option>`;
            } else {
                html += `<option value="${hour}">${hour}:00</option>`;
            }
        }
        html += '</select>';

        html += '</label>';

        return html;
    }

    const form = document.getElementById('day-time-selection');
    const dateTimeSelectHTML = generateDateTimeSelect();
    form.innerHTML += dateTimeSelectHTML;
    // For changing hour and day
    document.getElementById('timeinput').addEventListener('change', handleTimeInputChange);
    document.getElementById('dateinput').addEventListener('change', handleTimeInputChange);

    // Journey reverse function
    document.getElementById('changeButton').addEventListener('click', function () {
        let searchLocation = document.getElementById('searchLocation');
        let searchDestination = document.getElementById('searchDestination');
        let errorResult = document.getElementById('errorResult');

        if (searchLocation.value.trim() !== '' || searchDestination.value.trim() !== '') {
            let temp = searchLocation.value;
            searchLocation.value = searchDestination.value;
            searchDestination.value = temp;
        } else {
            // If either field is empty, display the error message
            searchLocation.focus();
            alert('Please fill out either location');
        }
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
let cluster;
// **** time variable ****
let station;
let day = 0;
let hour = 0;

function handleTimeInputChange() {
    const londonTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
    const today = new Date(londonTime);
    const currentDayOfWeek = today.getDay() || 7;
    let timeInput = parseInt(document.getElementById('timeinput').value);
    let dayInput = parseInt(document.getElementById('dateinput').value);
    let rightNow = new Date().toLocaleString('en-US', { timeZone: 'Europe/London', hour: 'numeric', hour12: false });
    rightNow = parseInt(rightNow);
    let timeSelect = document.getElementsByClassName('hide');

    if (timeInput == 0 || dayInput == 0) {
        hour = 0;
        day = 0;
    } else {
        hour = timeInput;
        day = dayInput;
    }

    // Check if the selected time is earlier than the current time
    if (dayInput != currentDayOfWeek) {
        for (let i = 0; i < timeSelect.length; i++) {
            timeSelect[i].style.display = 'inline';
        }
    } else if (dayInput === currentDayOfWeek) {
        for (let i = 0; i < timeSelect.length; i++) {
            timeSelect[i].style.display = 'none';
        }
    }
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
let infoWindowNew;

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
                div.style.cursor = 'pointer'; // Set cursor to pointer
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
                        if (station.available_bikes <= 5) {
                            infoWindowNew = new google.maps.InfoWindow({
                                content: `
                                    <h4 class="stationdetails" style="color:Tomato;">Bikes may not be Available for time chosen<h4>
                                    <h3 class="stationdetails">${station.name}</h3>
                                    <p class="stationdetails">Address: ${station.address}</p>
                                    <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
                                    <p class="stationdetails">Available bikes: ${station.available_bikes}</p>
                                    <p class="stationdetails">Available bike stands: ${
                                        station.available_bike_stands
                                    }</p>
                                    <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
                                    <p class="stationdetails">Status: ${station.status}</p>
                                `,
                            });
                        } else {
                            infoWindowNew = new google.maps.InfoWindow({
                                content: `
                                    <h3 class="stationdetails">${station.name}</h3>
                                    <p class="stationdetails">Address: ${station.address}</p>
                                    <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
                                    <p class="stationdetails">Available bikes: ${station.available_bikes}</p>
                                    <p class="stationdetails">Available bike stands: ${
                                        station.available_bike_stands
                                    }</p>
                                    <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
                                    <p class="stationdetails">Status: ${station.status}</p>
                                `,
                            });
                        }

                        // Open the InfoWindow on the map at the marker's location
                        infoWindowNew.open(map, markerObj);
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
        document.getElementById('logo').src = '/static/image/LogoWhite.png';

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
        const { Map } = await google.maps.importLibrary('maps');
        const { Marker } = await google.maps.importLibrary('marker'); // 레거시 Marker 지원

        //fetch station information data from the flask Server
        //install pip3 flask-cors to fetch data
        const response = await fetch('/stations');
        if (!response.ok) {
            throw new Error('Failed to fetch stations data');
        }
        const stations_info = await response.json();
        console.log('Fetched stations:', stations_info); // 디버깅 로그: 데이터 확인

        if (stations_info.length === 0) {
            console.warn('No station data available');
        }
        locations = stations_info.map((station) => ({
            lat: station.position.lat,
            lng: station.position.lng,
        }));

        if (navigator.geolocation) {
            // Replace the original getCurrentPosition with the fake one
            navigator.geolocation.getCurrentPosition = (fn) => {
                setTimeout(() => {
                    fn({
                        coords: {
                            accuracy: 40,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            latitude: 53.3498114,
                            longitude: -6.2628274,
                            speed: null,
                        },
                        timestamp: Date.now(),
                    });
                }, 2912);
            };
            // Now call getCurrentPosition as usual
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currLatLng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    let markerImg = document.createElement('img');
                    markerImg.src = '/static/image/home_icon.png';
                    markerImg.width = 50;
                    markerImg.height = 50;

                    new google.maps.Marker({
                        position: currLatLng,
                        map: map,
                        title: 'Your Location',
                        icon: {
                            url: markerImg.src,
                            scaledSize: new google.maps.Size(50, 50),
                        },
                    });
                },
                (error) => {
                    console.error(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
        //Googlemaps loading
        const mapDiv = document.getElementById('map');
        const mapCenter = { lat: 53.344979, lng: -6.27209 };
        let customStyle = darkModeFlag ? darkStyleArray : brightStyleArray;

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
            if (infoWindow) infoWindow.close();
        }); // 마커 추가 루프
        stations_info.forEach((station) => {
            let markerImgSrc = '/static/image/redMarker.png'; // 경로 통일: /static/
            let bikeAvailability = ((station.available_bikes / station.bike_stands) * 100).toFixed();
            if (bikeAvailability == 0) {
                markerImgSrc = '/static/image/redMarker.png';
            } else if (bikeAvailability > 0 && bikeAvailability < 40) {
                markerImgSrc = '/static/image/orangeMarker.png';
            } else {
                markerImgSrc = '/static/image/greenMarker.png';
            }

            const marker = new Marker({
                // google.maps.Marker 대신 Marker 사용 (임포트된 것)
                map: map,
                position: new google.maps.LatLng(station.position.lat, station.position.lng),
                title: station.name,
                icon: { url: markerImgSrc, scaledSize: new google.maps.Size(25, 25) },
            });

            // 클릭 이벤트 (InfoWindow)
            marker.addListener('click', () => {
                if (infoWindow) infoWindow.close();

                let content = `
                    <h3 class="stationdetails">${station.name}</h3>
                    <p class="stationdetails">Bikes stands: ${station.available_bike_stands} / ${
                    station.bike_stands
                }</p>
                    <p class="stationdetails">Available bikes: ${station.available_bikes} / ${station.bike_stands}</p>
                    <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
                    <p class="stationdetails">Status: ${station.status}</p>
                    <p class="stationdetails">Station: ${station.number}</p>
                    <div id="predictionChart"></div>`;

                if (station.available_bikes <= 5) {
                    content =
                        `<h4 class="stationdetails" style="color:Tomato;">Bikes may not be Available for time chosen</h4>` +
                        content;
                }

                infoWindow = new google.maps.InfoWindow({ content });
                infoWindow.open(map, marker);
                generateChart(station.number);
            });

            markers.push(marker);
        });

        // MarkerClusterer (최신 버전 사용)
        if (markers.length > 0) {
            const markerCluster = new markerClusterer.MarkerClusterer({
                map,
                markers,
                minimumClusterSize: 4,
                // imagePath는 구버전; 최신 버전은 기본 클러스터 아이콘 사용 (커스텀 필요 시 renderer 옵션 추가)
            });

            google.maps.event.addListener(markerCluster, 'click', (cluster) => {
                map.setCenter(cluster.getCenter());
                map.setZoom(map.getZoom() + 3);
            });
        }
    } catch (error) {
        console.error('InitMap Error:', error);
        const mapDiv = document.getElementById('map');
        if (mapDiv) {
            mapDiv.innerHTML = '<div class="map-error-alert">Google maps failed to load.</div>';
            mapDiv.style.display = 'flex';
            mapDiv.style.justifyContent = 'center';
            mapDiv.style.alignItems = 'center';
            mapDiv.style.height = '100%';
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
            let currentDate = new Date();
            let dayOfWeek = currentDate.getDay();
            let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let currentDay = daysOfWeek[dayOfWeek];
            const temperature = document.getElementById('weatherText');
            let description = data.weather[0].description;
            let capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
            temperature.innerHTML =
                capitalizedDescription +
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
async function generateChart(stationId) {
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `station_id=${stationId}`,
        });
        const htmlContent = await response.text();
        document.getElementById('predictionChart').innerHTML = htmlContent;
    } catch (error) {
        console.error('Chart generation error:', error);
    }
}
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
        if (!address) {
            reject('Address is empty!');
            return;
        }
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
    var errorResult = document.getElementById('errorResult');
    errorResult.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour >= 1 && currentHour <= 5 && day === 0 && hour === 0) {
        errorResult.innerHTML = 'Bikes unavailable at this time (12 AM - 5 AM).';
        setTimeout(() => {
            errorResult.innerHTML = '';
        }, 10000);
        return;
    }

    try {
        const dest1 = await findNearestStation(loc);
        const dest2 = await findNearestStation(dest);

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
                    content: await generateInfoWindowContent(stationInfo),
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

async function predict_time_day(hour, day, station_id) {
    try {
        const response = await fetch('/process_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `station_id=${station_id}&day=${day}&hour=${hour}`,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data, possibly not enoguh data for that input');
        }

        const data = await response.text();
        const available_bikes = parseInt(data, 10); // Parse the response string as an integer
        return available_bikes;
    } catch (error) {
        console.error('Error fetching prediction data:', error);
        throw error;
    }
}

async function generateInfoWindowContent(station) {
    let available_bikes, available_bike_stands;
    if (hour != 0 && day != 0) {
        available_bikes = await predict_time_day(hour, day, station.number);
        available_bike_stands = station.bike_stands - available_bikes;

        if (available_bikes <= 5) {
            try {
                return `
                <h6 class=""stationdetails" style="color:Green; text-align:center;">Predicted availability<h6>
                <h4 class="stationdetails" style="color:Tomato;">Bikes may not be Available for time chosen<h4>
                <h3 class="stationdetails">${station.name}</h3>
                <p class="stationdetails">Address: ${station.address}</p>
                <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
                <p class="stationdetails">Available bikes: ${available_bikes}</p>
                <p class="stationdetails">Available bike stands: ${available_bike_stands}</p>
                <p class="stationdetails">Banking: ${
                    station.banking ? 'Yes' : 'No'
                }</p> <box-icon name='money-withdraw'></box-icon>
                <p class="stationdetails">Status: ${station.status}</p>
                <div id="predictionChart"></div>
                <button class="journeyReset">Reset Route</button>`;
            } catch (e) {
                console.error('Fail to load station Data', e);
            }
        } else {
            available_bikes = station.available_bikes; // 초기화 추가
            available_bike_stands = station.available_bike_stands;
            let content = `
                <h3 class="stationdetails">${station.name}</h3>
                <p class="stationdetails">Address: ${station.address}</p>
                <p class="stationdetails">Bikes stands: ${station.bike_stands}</p>
                <p class="stationdetails">Available bikes: ${available_bikes}</p>
                <p class="stationdetails">Available bike stands: ${available_bike_stands}</p>
                <p class="stationdetails">Banking: ${station.banking ? 'Yes' : 'No'}</p>
                <p class="stationdetails">Status: ${station.status}</p>
                <div id="predictionChart"></div>
                <button class="journeyReset">Reset Route</button>`;
            if (available_bikes <= 5) {
                content = `<h4 class="stationdetails" style="color:Tomato;">Bikes may not be Available</h4>` + content;
            }
            return content;
        }
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
