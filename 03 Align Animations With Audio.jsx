{
    var AUDIO_TRACK_NAME = 'Voiceover';
    var comp = app.project.activeItem;
    var voiceoverLayer = comp.layer(AUDIO_TRACK_NAME);

    function getProperties(layer) {
        var properties = [];
        if (layer.timeRemapEnabled) {
            properties.push(layer.property('ADBE Time Remapping'));
        }
        if (layer.transform.position.numKeys > 0) {
            properties.push(layer.transform.position);
        }
        if (layer.transform.scale.numKeys > 0) {
            properties.push(layer.transform.scale);
        }
        if (layer.transform.opacity.numKeys > 0) {
            properties.push(layer.transform.opacity);
        }
        if (layer.transform.rotation.numKeys > 0) {
            properties.push(layer.transform.rotation);
        }
        return properties;
    }

    /**
     * Returns the number of seconds from the supplied marker to the first matching marker
     * of the voiceover layer. If none is found, returns -1.
     */
    function secondsFromMatchingMarker(markerIndex, markerComment, markerTime) {
        var voiceMarkers = voiceoverLayer.marker;

        if (markerIndex > voiceMarkers.numKeys) return -1;
        var voiceMarker = voiceMarkers.keyValue(markerIndex);

        if (voiceMarker.comment !== markerComment) return -1;

        return voiceMarkers.keyTime(markerIndex) - markerTime;
    }

    /**
     * Moves all keys that comes after the supplied time by the specified amount of seconds
     */
    function shiftLayerKeysFromTime(layer, fromSeconds, shiftBySeconds) {
        // deselect all layers
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }

        // Select all keys at or after the time
        var properties = getProperties(layer);
        var earliestKeyTime = Number.MAX_VALUE; // If there's any gap between the marker and the first key, we make sure to keep this gap
        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];

            for (var j = property.numKeys; j >= 1; j--) {
                var keyTime = property.keyTime(j);
                if (keyTime < fromSeconds) break;

                if (keyTime < earliestKeyTime) earliestKeyTime = keyTime;
                property.setSelectedAtKey(j, true);
            }
        }
        if (earliestKeyTime === Number.MAX_VALUE) return;

        app.executeCommand(app.findMenuCommandId('Cut')); // Cut
        comp.time = earliestKeyTime + shiftBySeconds; // Move playhead
        app.executeCommand(app.findMenuCommandId('Paste')); // Paste
    }

    function shiftMarkers(markerProperty, fromIndex, shiftBySeconds) {
        // remove the markers we're going to move
        var markers = [];
        var markerTimes = [];
        while (markerProperty.numKeys > fromIndex - 1) {
            markers.push(markerProperty.keyValue(markerProperty.numKeys));
            markerTimes.push(markerProperty.keyTime(markerProperty.numKeys));
            markerProperty.removeKey(markerProperty.numKeys);
        }

        // move the markers
        for (var i = 0; i < markers.length; i++) {
            markerProperty.setValueAtTime(markerTimes[i] + shiftBySeconds, markers[i]);
        }
    }

    /**
     * Main function that does the work
     */
    function timeWithAudio(layer) {
        // Now we check the markers after that

        var marker = 1;
        var numLayerMarkers = layer.marker.numKeys; // Important to lock down this number as we modify the array later
        while (marker <= numLayerMarkers) {
            var markerTime = layer.marker.keyTime(marker);
            var markerComment = layer.marker.keyValue(marker).comment;

            // Find out the time difference between the marker and the matching voice marker
            var timeDiff = secondsFromMatchingMarker(marker, markerComment, markerTime);
            marker++;
            if (timeDiff === 0) continue;
            if (timeDiff === -1) {
                return;
            }

            // Shift the keys
            shiftLayerKeysFromTime(layer, markerTime, timeDiff);

            // Move markers accordingly
            shiftMarkers(layer.marker, marker - 1, timeDiff);
        }
    }

    function main() {
        if (voiceoverLayer === null) {
            alert('No audio track named ' + AUDIO_TRACK_NAME + ' found');
            return;
        }
        app.beginUndoGroup('Update Markers and Align Animations');

        // Process all layers
        var layers = comp.layers;
        for (var i = layers.length - 1; i >= 1; i--) {
            var layer = layers[i];
            var isPrecomp = layer.source instanceof CompItem;
            if (!isPrecomp) continue;

            timeWithAudio(layer);
        }
        app.endUndoGroup();
    }

    main();
}
