{
    var AUDIO_TRACK_NAME = 'Voiceover';
    var comp = app.project.activeItem;
    var voiceoverLayer = comp.layer(AUDIO_TRACK_NAME);

    // Aligns a layer without time remap such that its first marker that has a matching marker in the voiceover layer
    // aligns with the matching marker
    function alignAnimations(layer) {
        var layerMarkers = layer.marker;
        var voiceMarkers = voiceoverLayer.marker;

        for (var i = 1; i <= layerMarkers.numKeys; i++) {
            var marker = layerMarkers.keyValue(i);

            for (var j = 1; j <= voiceMarkers.numKeys; j++) {
                var voiceMarker = voiceMarkers.keyValue(j);

                // If we find a matching marker in the audio
                // Adjust the layer's startTime such that the markers will align
                if (voiceMarker.comment === marker.comment) {
                    var voiceStart = voiceMarkers.keyTime(j);
                    var layerStart = layerMarkers.keyTime(i);

                    var timeDiff = voiceStart - layerStart;

                    layer.startTime += timeDiff;
                    break;
                }
            }
        }
    }

    function alertMarkerDoesNotStartAnimation(marker) {
        alert("Marker '" + marker.comment + "' does not start an animation");
    }

    function moveMarker(markerProperty, markerIndx, shiftBySeconds) {
        var marker = markerProperty.keyValue(markerIndx);
        var newMarkerStart =
            markerProperty.keyTime(markerIndx) + shiftBySeconds;
        markerProperty.removeKey(markerIndx);
        markerProperty.setValueAtTime(newMarkerStart, marker);
    }

    function moveKeyframesPair(property, key1Indx, key2Indx, shiftBySeconds) {
        var key1 = property.keyValue(key1Indx);
        var key2 = property.keyValue(key2Indx);
        var key1Start = property.keyTime(key1Indx);
        var key2Start = property.keyTime(key2Indx);

        // Remember the interpolation types
        var key1InInterpolation = property.keyInInterpolationType(key1Indx);
        var key1OutInterpolation = property.keyOutInterpolationType(key1Indx);
        var key2InInterpolation = property.keyInInterpolationType(key2Indx);
        var key2OutInterpolation = property.keyOutInterpolationType(key2Indx);

        // Shift the keyframes
        property.removeKey(key1Indx);
        property.removeKey(key1Indx);
        property.setValueAtTime(key1Start + shiftBySeconds, key1);
        property.setValueAtTime(key2Start + shiftBySeconds, key2);

        // Set the interpolation types
        property.setInterpolationTypeAtKey(
            key1Indx,
            key1InInterpolation,
            key1OutInterpolation
        );
        property.setInterpolationTypeAtKey(
            key2Indx,
            key2InInterpolation,
            key2OutInterpolation
        );
    }

    function checkAllLayerMarkersStartAnAnimation(layer) {
        // Check if all markers start an animation
        var markers = layer.marker;
        var timeRemap = layer.property('ADBE Time Remapping');
        for (var i = 1; i <= markers.numKeys; i++) {
            var markerTime = markers.keyTime(i);
            var timeRemapKeyTime = timeRemap.keyTime(i * 2 - 1);

            if (markerTime !== timeRemapKeyTime) {
                throw new Error(
                    layer.name +
                        ': Marker at index ' +
                        i +
                        ' does not start an animation'
                );
            }
        }
    }

    function movelayer(layer) {
        for (var i = 1; i <= layer.marker.numKeys; i++) {
            var timeDiff = secondsFromMatchingMarker(layer.marker, i);
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
    function secondsFromMatchingMarker(markers, markerIndx) {
        var markerTime = markers.keyTime(markerIndx);
        var marker = markers.keyValue(markerIndx);
        if (marker.comment.length === 0) return -1;

        var voiceMarkers = voiceoverLayer.marker;
        for (var i = 1; i <= voiceMarkers.numKeys; i++) {
            var voiceMarker = voiceMarkers.keyValue(i);
            if (voiceMarker.comment === marker.comment) {
                return voiceMarkers.keyTime(i) - markerTime;
            }
        }

        return -1;
    }

    /**
     * Returns the index range, i.e. [1, 4], of the time remap keys that are in the interval [startTime, endTime].
     */
    function timeRemapIndexRangeInInterval(timeRemap, startTime, endTime) {
        var min = -1;
        var max = -1;

        for (var i = 1; i <= timeRemap.numKeys; i++) {
            var timeRemapKeyTime = timeRemap.keyTime(i);
            if (timeRemapKeyTime < startTime) continue;
            if (timeRemapKeyTime > endTime) continue;

            if (min === -1) {
                min = i;
            }
            max = i;
        }

        if (min === -1) return [-1, -1];

        return [min, max];
    }

    function moveKeysFromIndex(timeRemap, keyIndx, shiftBySeconds) {
        // deselect all layers
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).selected = false;
        }

        for (var i = keyIndx; i <= timeRemap.numKeys; i++) {
            timeRemap.setSelectedAtKey(i,true);  // select first keyframe
        }

        comp.time = timeRemap.keyTime(keyIndx) + shiftBySeconds;
        app.executeCommand(app.findMenuCommandId("Cut"));
        app.executeCommand(app.findMenuCommandId("Paste"));
    }

    function alignKeyedAnimations(layer) {
        var timeRemap = layer.property('ADBE Time Remapping');

        var markerIndx = movelayer(layer);
        if (markerIndx === -1) return;

        markerIndx++;
        var markerKeys = layer.marker.numKeys
        while (markerIndx <= markerKeys) {
            var timeDiff = secondsFromMatchingMarker(layer.marker, markerIndx);
            if (timeDiff === -1) {
                markerIndx++;
                continue;
            }

            var markerTime = layer.marker.keyTime(markerIndx);
            var keyIndx = timeRemap.nearestKeyIndex(markerTime)
            if (timeRemap.keyTime(keyIndx) < markerTime) {
                markerIndx++;
                continue;
            }

            moveKeysFromIndex(timeRemap, keyIndx, timeDiff);

            for (var i = markerIndx; i <= markerKeys; i++) {
                var marker = layer.marker.keyValue(i);
                var newMarkerStart = layer.marker.keyTime(i) + timeDiff;
                layer.marker.removeKey(i);
                layer.marker.setValueAtTime(newMarkerStart, marker);
            }

            markerIndx++;
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
        for (var i = 1; i <= layers.length; i++) {
            var layer = layers[i];
            var isPrecomp = layer.source instanceof CompItem;
            if (!isPrecomp) continue;

            if (layer.timeRemapEnabled) {
                //checkAllLayerMarkersStartAnAnimation(layer);
                alignKeyedAnimations(layer);
            } else {
                alignAnimations(layer);
            }
        }
        app.endUndoGroup();
    }

    main();
}
