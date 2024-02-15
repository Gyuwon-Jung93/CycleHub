document.addEventListener('DOMContentLoaded', function() {

    initMap();
});


async function initMap() {

    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
        "marker",
      );
      const { Map, InfoWindow } = await google.maps.importLibrary("maps");
    const mapDiv = document.getElementById('map');
    const mapCenter = {lat:53.3053398, lng:-6.2311915}; 
    if (mapDiv) {
        var map = new google.maps.Map(mapDiv, {
            center: mapCenter,
            zoom: 13
        });
    }
   
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

   
  // Add some markers to the map.
  const locations=[{ lat: 53.353227, lng: -6.2538856 },{ lat: 53.3419812, lng: -6.289286 },{ lat:53.3268839, lng: -6.2978491 }];
  
    const markers = locations.map((position, i) => {
    const label = labels[i % labels.length];
    const pinGlyph = new google.maps.marker.PinElement({
      glyph: label,
      glyphColor: "white",
    });
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      content: pinGlyph.element,
    });
// markers can only be keyboard focusable when they have click listeners
    // open info window when marker is clicked
    marker.addListener("click", () => {
        infoWindow.setContent(position.lat + ", " + position.lng);
        infoWindow.open(map, marker);
      });
      return marker;

      // Add a marker clusterer to manage the markers.

    
})
new MarkerClusterer({ markers, map });
}
