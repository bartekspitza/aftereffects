/**
 * This script deletes all markers AFTER the playhead. If no layers are selected, it deletes the composition's marker.
 * If layers are selected, it deletes the markers of the selected layers.
 */
{
    var activeComp = app.project.activeItem;

    function main(seconds) {
        if (activeComp && activeComp instanceof CompItem) {
            app.beginUndoGroup('Delete Markers at Playhead');

            var playhead = activeComp.time;

            // Move layers
            for (var i = 0; i < activeComp.selectedLayers.length; i++) {
                var selectedLayer = activeComp.selectedLayers[i];
                selectedLayer.startTime += seconds;
            }

            // Move markers
            var markerIndx = activeComp.markerProperty.numKeys; // Start at the end and move backwards
            while (activeComp.markerProperty.keyTime(markerIndx) > playhead) {
                var markerToMove = activeComp.markerProperty.keyValue(markerIndx);
                var markerTime = activeComp.markerProperty.keyTime(markerIndx);
                activeComp.markerProperty.removeKey(markerIndx);
                activeComp.markerProperty.setValueAtTime(markerTime + seconds, markerToMove);
                markerIndx--;
            }

            app.endUndoGroup();
        } else {
            alert('Please select a composition.');
        }
    }

    // Create a window that asks for the number of seconds to move the layers forward
    var window = new Window('dialog', 'Move Layers Forward');
    var instructions = window.add("statictext", undefined, "Move selected layers and markers after playhead forward by x seconds");
    var input = window.add('edittext', undefined, '');
    input.characters = 10;
    var submitButton = window.add('button', undefined, 'Submit');

    // On Click
    submitButton.onClick = function () {
        var seconds = parseFloat(input.text);
        window.close();
        main(seconds);
    };

    // Go!
    window.show();
}
