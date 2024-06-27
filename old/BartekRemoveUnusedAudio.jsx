app.beginUndoGroup('Remove Unused Audio Files');

var project = app.project;
var unusedAudioFiles = [];

// Function to recursively check if an item is used in any composition
function isItemUsed(item) {
    for (var i = 1; i <= project.numItems; i++) {
        var comp = project.item(i);
        if (comp instanceof CompItem) {
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);
                if (layer.source === item) return true;
            }
        }
    }
    return false;
}

// Function to recursively search for unused audio files in a given folder
function searchFolder(folder) {
    for (var i = 1; i <= folder.numItems; i++) {
        var item = folder.item(i);
        if (item instanceof FolderItem) {
            searchFolder(item); // Recursive call for subfolders
        } else if (item instanceof FootageItem && item.hasAudio && !isItemUsed(item)) {
            unusedAudioFiles.push(item);
        }
    }
}


// Main script
searchFolder(project.rootFolder);
for (var i = 0; i < unusedAudioFiles.length; i++) {
    unusedAudioFiles[i].remove();
}

app.endUndoGroup();
