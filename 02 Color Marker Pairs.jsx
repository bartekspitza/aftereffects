var activeComp = app.project.activeItem;
var color1Index = 1; // This is the index of the label to choose from. It is based on the label colors one has defined in Preferences
var color2Index = 7;

if (activeComp && activeComp instanceof CompItem) {
    app.beginUndoGroup("Color Marker Pairs");

    // Get the markers from the composition
    var markers = activeComp.markerProperty;

    // Iterate through the markers and color them
    for (var i = 1; i <= markers.numKeys; i++) {
        var marker = markers.keyValue(i);

        var isEvenPair = Math.floor((i - 1) / 2) % 2 === 0;
        var markerNumber = Math.floor((i+1)/2);

        // Replace marker with a coloured one
        var newMarker = new MarkerValue(markerNumber);
        newMarker.label = isEvenPair ? color1Index : color2Index;
        newMarker.comment = marker.comment.length > 0 ? marker.comment : markerNumber;
        markers.setValueAtKey(i, newMarker);
    }

    app.endUndoGroup();
} else {
    alert("Please select an active composition.");
}
