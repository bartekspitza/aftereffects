var activeComp = app.project.activeItem;

if (activeComp && activeComp instanceof CompItem) {
    app.beginUndoGroup("Color Markers");

    // Get the markers from the composition
    var markers = activeComp.markerProperty;

    // Iterate through the markers and color them
    for (var i = 1; i <= markers.numKeys; i++) {
        var marker = markers.keyValue(i);

        var isEvenPair = Math.floor((i - 1) / 2) % 2 === 0

        // Replace marker with a coloured one
        var newMarker = new MarkerValue(marker.comment);
        newMarker.label = isEvenPair ? 1 : 2;
        markers.setValueAtKey(i, newMarker);
    }

    app.endUndoGroup();
} else {
    alert("Please select an active composition.");
}
