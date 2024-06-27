/**
 * This script deletes all markers AFTER the playhead. If no layers are selected, it deletes the composition's marker.
 * If layers are selected, it deletes the markers of the selected layers.
 */
{
    var activeComp = app.project.activeItem;

    function hasMarkerAfterPlayhead(markers) {
        for (var j = 1; j <= markers.numKeys; j++) {
            var marker = markers.keyValue(j);
            if (markers.keyTime(j) > playhead) {
                return true;
            }
        }
        return false;
    }

    function deleteMarkersAfterPlayhead(markers) {
        while (hasMarkerAfterPlayhead(markers)) {
            markers.removeKey(markers.numKeys);
        }
    }

    if (activeComp && activeComp instanceof CompItem) {
        app.beginUndoGroup('Delete Markers at Playhead');

        var playhead = activeComp.time;
        var hasSelectedLayers = activeComp.selectedLayers.length > 0;

        if (hasSelectedLayers) {
            for (var i = 0; i < activeComp.selectedLayers.length; i++) {
                deleteMarkersAfterPlayhead(activeComp.selectedLayers[i].marker);
            }
        } else {
            var markers = activeComp.markerProperty;
            deleteMarkersAfterPlayhead(markers);
        }

        app.endUndoGroup();
    } else {
        alert('Please select a composition.');
    }
}
