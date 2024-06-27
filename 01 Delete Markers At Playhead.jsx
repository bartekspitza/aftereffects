/**
 * This script deletes all markers at the playhead. If no layers are selected, it deletes the composition's marker.
 * If layers are selected, it deletes the markers of the selected layers.
 */
{
    var activeComp = app.project.activeItem;
    if (activeComp && activeComp instanceof CompItem) {
        app.beginUndoGroup('Delete Markers at Playhead');

        var playhead = activeComp.time;
        var hasSelectedLayers = activeComp.selectedLayers.length > 0;

        if (hasSelectedLayers) {
            for (var i = 0; i < activeComp.selectedLayers.length; i++) {
                var selectedLayer = activeComp.selectedLayers[i];
                var markers = selectedLayer.marker;
                if (markers.numKeys === 0) continue;

                var nearestIndex = markers.nearestKeyIndex(playhead);
                if (markers.keyTime(nearestIndex) !== playhead) continue;

                markers.removeKey(nearestIndex);
            }
        } else {
            var markers = activeComp.markerProperty;

            if (markers.numKeys > 0) {
                var nearestIndex = markers.nearestKeyIndex(playhead);
                if (markers.keyTime(nearestIndex) === playhead) {
                    markers.removeKey(nearestIndex);
                }
            }
        }

        app.endUndoGroup();
    } else {
        alert('Please select a composition.');
    }
}
