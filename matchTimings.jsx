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
        var newMarkerStart = markerProperty.keyTime(markerIndx) + shiftBySeconds;
        markerProperty.removeKey(markerIndx);
        markerProperty.setValueAtTime(newMarkerStart, marker);
    }

    function moveKeyframesPair(property, key1Indx, key2Indx, shiftBySeconds) {
        var key1 = property.keyValue(key1Indx);
        var key2 = property.keyValue(key2Indx);
        var key1Start = property.keyTime(key1Indx);
        var key2Start = property.keyTime(key2Indx);

        // Remember the interpolation types
        var key1InInterpolation = property.keyInInterpolationType(key1Indx)
        var key1OutInterpolation = property.keyOutInterpolationType(key1Indx)
        var key2InInterpolation = property.keyInInterpolationType(key2Indx)
        var key2OutInterpolation = property.keyOutInterpolationType(key2Indx)

        // Shift the keyframes
        property.removeKey(key1Indx);
        property.removeKey(key1Indx); 
        property.setValueAtTime(key1Start + shiftBySeconds, key1);
        property.setValueAtTime(key2Start + shiftBySeconds, key2);

        // Set the interpolation types
        property.setInterpolationTypeAtKey(key1Indx, key1InInterpolation, key1OutInterpolation)
        property.setInterpolationTypeAtKey(key2Indx, key2InInterpolation, key2OutInterpolation)
    }

    function alignKeyedAnimations(layer) {
        var layerMarkers = layer.marker;
        var voiceMarkers = voiceoverLayer.marker;
        var timeRemap = layer.property('ADBE Time Remapping');

        for (var i = 1; i <= layerMarkers.numKeys; i++) {
            var marker = layerMarkers.keyValue(i);
            var markerTime = layerMarkers.keyTime(i);

            var animStartTime = timeRemap.keyTime(i * 2 - 1);

            if (markerTime !== animStartTime) {
                alertMarkerDoesNotStartAnimation(marker);
                return;
            }

            for (var j = 1; j <= voiceMarkers.numKeys; j++) {
                var voiceMarker = voiceMarkers.keyValue(j);
                if (voiceMarker.comment !== marker.comment) continue;

                var voiceMarkerStart = voiceMarkers.keyTime(j);
                var timeDiffBetweenMarkers = voiceMarkerStart - markerTime;

                // If its the very first animation, align by moving the layer
                if (i === 1) {
                    layer.startTime += timeDiffBetweenMarkers;
                    break;
                }
                // Otherwise, move the keyframes
                var key1Indx = i * 2 - 1;
                var key2Indx = i * 2;
                moveKeyframesPair(timeRemap, key1Indx, key2Indx, timeDiffBetweenMarkers);
                moveMarker(layerMarkers, i, timeDiffBetweenMarkers);
                break;
            }
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
                alignKeyedAnimations(layer);
            } else {
                alignAnimations(layer);
            }
        }
        app.endUndoGroup();
    }

    main();
}
