{
    var AUDIO_TRACK_NAME = 'Voiceover';
    var comp = app.project.activeItem;
    var voiceoverLayer = comp.layer(AUDIO_TRACK_NAME);

    /**
     * Returns the number of seconds from the supplied marker to the first matching marker
     * of the voiceover layer. If none is found, returns -1.
     */
    function secondsFromMatchingMarker(markerIndex, markerComment, markerTime) {
        var voiceMarkers = voiceoverLayer.marker;

        if (markerIndex === 0) return -1;
        if (markerIndex > voiceMarkers.numKeys) return -1;
        var voiceMarker = voiceMarkers.keyValue(markerIndex);

        if (voiceMarker.comment !== markerComment) return -1;

        return voiceMarkers.keyTime(markerIndex) - markerTime;
    }

    function moveAnimation(fromLayer, toLayer, markerIndex, atTime) {
        var fromTimeRemap = fromLayer.property('ADBE Time Remapping');
        var toTimeRemap = toLayer.property('ADBE Time Remapping');
        var toMarkers = toLayer.marker;

        var timeRemapIndex = markerIndex*2 - 1;
        var animStartValue = fromTimeRemap.keyValue(timeRemapIndex);
        var animEndValue = fromTimeRemap.keyValue(timeRemapIndex+1);
        var animDuration = animEndValue - animStartValue;

        toTimeRemap.setValueAtTime(atTime, animStartValue);
        toTimeRemap.setValueAtTime(atTime + animDuration, animEndValue);

        // Coy the labels. Use nearestKeyIndex as a keyframe from enabling time remapping can linger
        toTimeRemap.setLabelAtKey(toTimeRemap.nearestKeyIndex(atTime), fromTimeRemap.keyLabel(timeRemapIndex));
        toTimeRemap.setLabelAtKey(toTimeRemap.nearestKeyIndex(atTime+animDuration), fromTimeRemap.keyLabel(timeRemapIndex+1));

        toMarkers.setValueAtTime(atTime, fromLayer.marker.keyValue(markerIndex));
    }

    /**
     * Resets the time remapping on the layer by turning it off and on again
     * Leaves the 0:0 keyframe intact
     */
    function resetTimeRemap(layer) {
        layer.timeRemapEnabled = false;
        layer.timeRemapEnabled = true;
        layer.property('ADBE Time Remapping').removeKey(2);
    }

    function clearMarkers(layer) {
        while (layer.marker.numKeys > 0) {
            layer.marker.removeKey(1);
        }
    }

    /**
     * Main function that does the work
     */
    function timeWithAudio(layer) {
        if (layer.inPoint !== 0) {
            alert('The layer must start at time 0');
            return;
        }

        // Do all the work on a new layer
        var duplicated = layer.duplicate();
        resetTimeRemap(duplicated);
        clearMarkers(duplicated);

        // Start at the first marker and match one by one
        var markerIndex = 1;
        while (markerIndex <= layer.marker.numKeys) {
            var markerTime = layer.marker.keyTime(markerIndex);
            var markerComment = layer.marker.keyValue(markerIndex).comment;

            // Find out the time difference between the marker and the matching voice marker
            var timeDiff = secondsFromMatchingMarker(markerIndex, markerComment, markerTime);
            if (timeDiff === -1) {
                alert('"' + markerComment + '" is not matched to any voiceover marker');
                return;
            }

            // Shift the keys
            moveAnimation(layer, duplicated, markerIndex, markerTime+timeDiff);
            markerIndex++;
        }

        var originalName = layer.name;
        layer.remove();
        duplicated.name = originalName;
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
