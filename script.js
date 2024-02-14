// import config from "/config/apiKey.js";
document.addEventListener('DOMContentLoaded', function() {
    loadWeather();
    // initMap();
});
const {WEATHER_API_KEY} = config;

function loadWeather() {
    const WEATHER_API_KEY="6def6f5458e3226a4a33490f6635e269"
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Dublin&appid=${WEATHER_API_KEY}&units=metric&lang=en`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.getElementById('weather').innerHTML = `Dublin's Weather: ${data.weather[0].description}, Temperature: ${data.main.temp}°C`;
        
    })
    .catch(error => console.log('Error:', error));
}

// function initMap() {
//     var mapCenter = {lat: 37.5665, lng: 126.9780}; // 서울의 위도와 경도
//     var map = new google.maps.Map(document.getElementById('map'), {
//         zoom: 12,
//         center: mapCenter
//     });
// }
