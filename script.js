document.addEventListener('DOMContentLoaded', function() {
    loadWeather();
    // initMap();
});

function loadWeather() {
    const apiKey = "YOUR_OPENWEATHER_API_KEY";
    const url = `http://api.openweathermap.org/data/2.5/forecast?id=524901&appid=6def6f5458e3226a4a33490f6635e269`;

    fetch(url)
    .then(response => response.json())
    .then(data => {
        document.getElementById('weather').innerHTML = `Dublin's Weather: ${data.weather[0].description}, 온도: ${data.main.temp}°C`;
        console.log(data);
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
