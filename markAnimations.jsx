// This script looks at a precomp's markers and creates keyframes for each animation using time remapping
{
    var secondsBetweenAnims = 2;
    var keyLabel1 = 3;
    var keyLabel2 = 8;

    // Iterates over every time remap marker and sets HOLD on every other to make it easier to distinguish animation-starts
    // Colorizes the keyframes such that every other pair is a different label
    function colorizeKeys(property) {
        var pair = 0;
        for (var i = 1; i <= property.numKeys; i += 1) {
            if (i % 2 !== 0) pair += 1;
            property.setLabelAtKey(i, (pair % 2 === 0) ? keyLabel1 : keyLabel2);
        }
    }

    function setToggleHoldOnEveryOtherKey(property, fromIndex) {
        // For readability, set the interpolation type to hold on the animation end markers
        for (var i = fromIndex; i <= property.numKeys; i += 1) {
            property.setInterpolationTypeAtKey(
                i,
                KeyframeInterpolationType.LINEAR,
                i % 2 === 0
                    ? KeyframeInterpolationType.HOLD
                    : KeyframeInterpolationType.LINEAR
            );
        }
    }

    function createKeyframes(layer, markers) {
        var timeRemap = layer.property('ADBE Time Remapping');

        // Turn on time remapping
        var originalInPoint = layer.inPoint; // A layer can can have different in-points depending if time remapping is enabled
        layer.timeRemapEnabled = true;
        if (layer.inPoint !== originalInPoint) layer.inPoint = originalInPoint; // Reset the in-point to the original value
        timeRemap.removeKey(2); // Two keyframes are always generated by turning on time remapping, remove last one

        // Create keyframes for each pair of markers
        var lastEnd = layer.inPoint;
        for (var i = 1; i <= markers.numKeys; i += 2) {
            var markerStart = markers.keyTime(i); // The time of the marker that signals the start of the animation
            var markerEnd = markers.keyTime(i + 1); // The time of the marker that signals the end of the animation

            var duration = markerEnd - markerStart; // The duration of the animation

            timeRemap.setValueAtTime(lastEnd, markerStart);
            timeRemap.setValueAtTime(lastEnd + duration, markerEnd);

            lastEnd += secondsBetweenAnims;
            lastEnd += duration;
        }

        //setToggleHoldOnEveryOtherKey(timeRemap, 1);
        colorizeKeys(timeRemap);
    }

    function refreshKeyframes(layer, markers) {
        var timeRemap = layer.property('ADBE Time Remapping');
        var lastEnd = timeRemap.keyTime(timeRemap.numKeys);

        // Create keyframes for each pair of markers
        var startIndx = 1 + timeRemap.numKeys;
        for (var i = startIndx; i <= markers.numKeys; i += 2) {
            var markerStart = markers.keyTime(i); // The time of the marker that signals the start of the animation
            var markerEnd = markers.keyTime(i + 1); // The time of the marker that signals the end of the animation

            var duration = markerEnd - markerStart; // The duration of the animation
            lastEnd += secondsBetweenAnims;

            timeRemap.setValueAtTime(lastEnd, markerStart);
            timeRemap.setValueAtTime(lastEnd + duration, markerEnd);

            lastEnd += duration;
        }

        //setToggleHoldOnEveryOtherKey(timeRemap, startIndx);
        colorizeKeys(timeRemap);
    }

    // Main function
    function main() {
        var activeItem = app.project.activeItem;
        if (!activeItem instanceof CompItem) {
            alert('No opened composition.');
            return;
        }

        app.beginUndoGroup('Adjust Precomp Timings');

        // Create keyframes for each selected layer
        for (var i = 0; i < activeItem.selectedLayers.length; i++) {
            var selectedLayer = activeItem.selectedLayers[i];
            var precomp = selectedLayer.source;
            if (!(precomp instanceof CompItem)) continue;

            // Check markers
            var markers = precomp.markerProperty;
            if (markers.numKeys < 2 || markers.numKeys % 2 !== 0) {
                alert(
                    'The precomp must have at least two markers and an even number of markers.'
                );
                return;
            }

            // Create or refresh
            if (selectedLayer.timeRemapEnabled === true) {
                refreshKeyframes(selectedLayer, precomp.markerProperty);
            } else {
                createKeyframes(selectedLayer, precomp.markerProperty);
            }
        }

        app.endUndoGroup();
    }

    main();
}
