{
    var AUDIO_TRACK_NAME = 'Voiceover';
    var comp = app.project.activeItem;
    var voiceoverLayer = comp.layer(AUDIO_TRACK_NAME);
    var voiceMarkerIndex = 1;

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

    function alignLayerByFirstMatchingMarker(layer) {
        var markers = layer.marker;
        for (var i = 1; i <= markers.numKeys; i++) {
            var markerComment = markers.keyValue(i).comment;
            var markerTime = markers.keyTime(i);
            var timeDiff = secondsFromMatchingMarker(markerComment, markerTime);
            if (timeDiff === -1) continue;

            layer.startTime += timeDiff;
            return i;
        }

        return -1;
    }

    /**
     * Returns the number of seconds from the supplied marker to the first matching marker
     * of the voiceover layer. If none is found, returns -1.
     */
    function secondsFromMatchingMarker(markerComment, markerTime) {
        if (markerComment.length === 0) return -1;

        var voiceMarkers = voiceoverLayer.marker;
        for (var i = 1; i <= voiceMarkers.numKeys; i++) {
            var voiceMarker = voiceMarkers.keyValue(i);
            if (voiceMarker.comment === markerComment) {
                return voiceMarkers.keyTime(i) - markerTime;
            }
        }

        return -1;
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

        app.executeCommand(app.findMenuCommandId("Cut"));   // Cut
        comp.time = earliestKeyTime + shiftBySeconds;       // Move playhead
        app.executeCommand(app.findMenuCommandId("Paste")); // Paste
    }

    /**
     * Main function that does the work
     */
    function timeWithAudio(layer) {
        // The first alignment happens by moving the entire layer
        var marker = alignLayerByFirstMatchingMarker(layer);
        if (marker === -1) return;

        // Now we check the markers after that
        marker++;
        var markerKeys = layer.marker.numKeys // Important to lock down this number as we modify the array later
        while (marker <= markerKeys) {
            // Find out the time difference between the marker and the matching voice marker
            var markerTime = layer.marker.keyTime(marker);
            var markerComment = layer.marker.keyValue(marker).comment;
            var timeDiff = secondsFromMatchingMarker(markerComment, markerTime);
            if (timeDiff === -1) { // If timeDiff is -1, the voice layer doesnt have a matching marker
                marker++;
                continue;
            }

            // Shift the keys 
            shiftLayerKeysFromTime(layer, markerTime, timeDiff);

            // Move markers accordingly
            for (var i = marker; i <= markerKeys; i++) {
                var marker = layer.marker.keyValue(i);
                var newMarkerStart = layer.marker.keyTime(i) + timeDiff;
                layer.marker.removeKey(i);
                layer.marker.setValueAtTime(newMarkerStart, marker);
            }
            marker++;
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
        for (var i = layers.length-1; i >= 1; i--) {
            var layer = layers[i];
            var isPrecomp = layer.source instanceof CompItem;
            if (!isPrecomp) continue;

            // Adjust timing of the layer by first moving it, and shifting any necessary keyframes
            // Keep track of how much the layer moved, and move the layers on top as well
            var originalLayerStart = layer.startTime;
            timeWithAudio(layer);
            var timeDifference = layer.startTime - originalLayerStart;
            for (var j = i-1; j >= 1; j--) {
                layers[j].startTime += timeDifference;
            }

        }
        app.endUndoGroup();
    }

    main();
}
