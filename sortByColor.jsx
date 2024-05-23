{
    // Check if a composition is active
    var activeComp = app.project.activeItem;
    if (activeComp && activeComp instanceof CompItem) {
        // Begin undo group
        app.beginUndoGroup("Sort Layers by Label Color");

        // Get the layers in the composition
        var layers = [];
        for (var i = 1; i <= activeComp.numLayers; i++) {
            layers.push(activeComp.layer(i));
        }

        // Sort the layers based on their label color
        layers.sort(function(a, b) {
            return a.label - b.label;
        });

        // Move layers to new order
        for (var j = 0; j < layers.length; j++) {
            layers[j].moveToEnd();
        }

        // End undo group
        app.endUndoGroup();
    } else {
        alert("Please select a composition.");
    }
}
