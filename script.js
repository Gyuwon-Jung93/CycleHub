// import config from "/config/apiKey.js";
document.addEventListener('DOMContentLoaded', function() {

    initMap();
});


function initMap() {
    const mapDiv = document.getElementById('map');
    const mapCenter = {lat:53.3053398, lng:-6.2311915}; 
    if (mapDiv) {
        var map = new google.maps.Map(mapDiv, {
            center: mapCenter,
            zoom: 13
        });
    }
}

