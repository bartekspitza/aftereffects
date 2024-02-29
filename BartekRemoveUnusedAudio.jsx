app.beginUndoGroup('Remove Unused Audio Files');

var project = app.project;
var unusedAudioFiles = [];

// Function to check if an item is used in any composition
function isItemUsed(item) {
    for (var i = 1; i <= project.rootFolder.numItems; i++) {
        var comp = project.rootFolder.item(i);
        if (comp instanceof CompItem) {
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);
                if (layer.source === item) return true;
            }
        }
    }
    return false;
}

// Main script
if (project) {
    for (var i = 1; i <= project.rootFolder.numItems; i++) {
        var item = project.rootFolder.item(i);
        if (item instanceof FootageItem && item.hasAudio && !isItemUsed(item)) {
            unusedAudioFiles.push(item);
        }
    }

    // Remove unused audio files
    for (var i = 0; i < unusedAudioFiles.length; i++) {
        unusedAudioFiles[i].remove();
    }

    alert(unusedAudioFiles.length + ' unused audio files were removed.');
} else {
    alert('No project found.');
}

app.endUndoGroup();