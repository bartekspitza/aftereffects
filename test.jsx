var project = app.project;
var sequence = project.activeSequence;
var track = sequence.audioTracks[0]; // Assuming first audio track

// Delete previous markers
var markers = sequence.markers;
var marker = markers.getFirstMarker();
var count = markers.numMarkers;
while (marker) {
    markers.deleteMarker(marker);
    marker = markers.getFirstMarker();
}

for (var i = 0; i < track.clips.numItems; i++) {
    var clip = track.clips[i];
    var clipMarker = markers.createMarker(clip.start.seconds);
    clipMarker.name = clip.name;
}
