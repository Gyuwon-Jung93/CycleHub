function initMap() {
    // Custom map style JSON
    var customMapType = new google.maps.StyledMapType(YOUR_JSON_STYLE_HERE, { name: 'Custom Style' });

    // Map options
    var mapOptions = {
        center: { lat: YOUR_LATITUDE, lng: YOUR_LONGITUDE }, // Set your desired center
        zoom: YOUR_ZOOM_LEVEL, // Set your desired zoom level
        mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain', 'custom_style'],
        },
    };

    // Create the map
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // Associate the styled map with the MapTypeId and set it to display.
    map.mapTypes.set('custom_style', customMapType);
    map.setMapTypeId('custom_style');
}
