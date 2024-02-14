// import config from "/config/apiKey.js";
document.addEventListener('DOMContentLoaded', function() {

    initMap();
});


function initMap() {
    var mapCenter = {lat:53.3085688, lng:-6.2910119}; // 서울의 위도와 경도
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: mapCenter
    });
}
