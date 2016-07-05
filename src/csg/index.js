

// currently using this lib, purportedly a wrapper around the evanw/csg.js functionality
// however the code looks pretty different, probably forked a while ago
// https://github.com/chandlerprall/ThreeCSG
var ThreeBSP = require("three-bsp");

// candidate for further testing, this is the model js implementation
// https://github.com/evanw/csg.js
//var CSG = require();

function combineMeshes(mesh1, mesh2) {
    var bsp1 = new ThreeBSP( mesh1 );
    var bsp2 = new ThreeBSP( mesh2 );

    var unionBSP = bsp1.union( bsp2 );
    var unionMesh = unionBSP.toMesh( mesh1.material );
    unionMesh.geometry.computeVertexNormals();
    return unionMesh;
}

module.exports = { combineMeshes };
