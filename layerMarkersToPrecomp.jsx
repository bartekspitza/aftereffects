{
    function transferMarkers() {
        var activeItem = app.project.activeItem;

        if (activeItem == null || !(activeItem instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var selectedLayers = activeItem.selectedLayers;

        if (selectedLayers.length != 1 || !(selectedLayers[0] instanceof AVLayer) || !(selectedLayers[0].source instanceof CompItem)) {
            alert("Please select a single precomp layer.");
            return;
        }

        var precompLayer = selectedLayers[0];
        var precomp = precompLayer.source;

        app.beginUndoGroup("Transfer Markers");

        // Remove existing markers in the precomp
        var precompMarkers = precomp.markerProperty;
        for (var i = precompMarkers.numKeys; i >= 1; i--) {
            precompMarkers.removeKey(i);
        }

        // Transfer markers from the precomp layer to the precomp
        var layerMarkers = precompLayer.property("Marker");

        for (var i = 1; i <= layerMarkers.numKeys; i++) {
            var markerValue = layerMarkers.keyValue(i);
            var markerTime = layerMarkers.keyTime(i);

            // Create a new marker in the precomp at the corresponding time
            precomp.markerProperty.setValueAtTime(markerTime - precompLayer.inPoint, markerValue);
        }

        app.endUndoGroup();
    }

    transferMarkers();
}
