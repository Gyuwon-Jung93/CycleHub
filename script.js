document.addEventListener('DOMContentLoaded', function () {
    initMap();
});

async function initMap() {
    let map;
    let markers = [];
    let locations = [
        { lat: 53.349562, lng: -6.278198 },
        { lat: 53.3537415547453, lng: -6.26530144781526 },
        { lat: 53.336021, lng: -6.26298 },
        { lat: 53.359405, lng: -6.276142 },
        { lat: 53.336597, lng: -6.248109 },
        { lat: 53.33796, lng: -6.24153 },
        { lat: 53.343368, lng: -6.27012 },
        { lat: 53.334123, lng: -6.265436 },
        { lat: 53.344304, lng: -6.250427 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.338755, lng: -6.262003 },
        { lat: 53.347777, lng: -6.244239 },
        { lat: 53.336074, lng: -6.252825 },
        { lat: 53.330091, lng: -6.268044 },
        { lat: 53.350929, lng: -6.265125 },
        { lat: 53.341515, lng: -6.256853 },
        { lat: 53.344603, lng: -6.263371 },
        { lat: 53.340927, lng: -6.262501 },
        { lat: 53.348279, lng: -6.254662 },
        { lat: 53.35893, lng: -6.280337 },
        { lat: 53.357841, lng: -6.251557 },
        { lat: 53.344115, lng: -6.237153 },
        { lat: 53.343893, lng: -6.280531 },
        { lat: 53.347477, lng: -6.28525 },
    ];

    //Googlemaps loading
    const mapDiv = document.getElementById('map');
    const mapCenter = { lat: 53.3053398, lng: -6.2311915 };
    if (mapDiv) {
        map = new google.maps.Map(mapDiv, {
            center: mapCenter,
            zoom: 13,
        });
    }
    // Add some markers to the map.
    for (var i = 0; i < locations.length; i++) {
        var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
        });
        markers.push(marker);
    }
    //marker cluster
    let markerCluster = new MarkerClusterer(map, markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        gridSize: 70,
    });
}
