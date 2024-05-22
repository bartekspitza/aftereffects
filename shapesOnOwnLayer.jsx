{
  function arrayContains(array, string) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === string) {
        return true;
      }
    }
    return false;
  }

  function separateShapes() {
    var comp = app.project.activeItem; // Get the active composition

    if (comp === null || !(comp instanceof CompItem)) {
      alert("Please select a composition.");
      return;
    }

    var shapeLayer = comp.selectedLayers[0]; // Get the selected layer
    if (shapeLayer === null || !(shapeLayer instanceof ShapeLayer)) {
      alert("Please select a shape layer.");
      return;
    }

    app.beginUndoGroup("Separate Shapes");

    // Collect the shape names under the contents
    var shapeNames = [];
    var shapeNum = shapeLayer.content.numProperties;
    for (var i = 1; i <= shapeNum; i++) {
      var shape = shapeLayer.content.property(i).name;
      if (arrayContains(shapeNames, shape)) {
        alert("Found shapes with the same name: " + shape);
        return;
      }

      shapeNames.push(shape);
    }

    // For each shape, duplicate the original layer and remove the other shapes
    for (var i = 0; i < shapeNames.length; i++) {
      var shapeName = shapeNames[i];
      var newShapeLayer = shapeLayer.duplicate();
      newShapeLayer.name = shapeName;

      while (newShapeLayer.content.numProperties > 1) {
        for (var j = 1; j <= newShapeLayer.content.numProperties; j++) {
          var property = newShapeLayer.content.property(j);
          if (property.name !== shapeName) {
            newShapeLayer.content.property(j).remove();
            break;
          }
        }
      }
    }

    app.endUndoGroup();
  }

  separateShapes();
}
