
var ThreeBSP = require("three-bsp");

function combineMeshes(mesh1, mesh2) {
    var bsp1 = new ThreeBSP( mesh1 );
    var bsp2 = new ThreeBSP( mesh2 );

    var unionBSP = bsp1.union( bsp2 );
    var unionMesh = unionBSP.toMesh( mesh1.material );
    unionMesh.geometry.computeVertexNormals();
    return unionMesh;
}

module.exports = { combineMeshes };
