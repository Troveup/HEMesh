
var THREE = require("three");

module.exports = (function(){
    var that = {};

    // for every defined face iterate its local vertices and add them to the mesh as an independent face
    // intended for debugging, a non-manifold isn't suitable for our purposes
    var dumpToThree = function(mesh) {
        var geometry = new THREE.Geometry();
        mesh.faces.map(function(face) {
            catFaceGeo(face, geometry);
        });
        geometry.computeBoundingSphere();

        var material = new THREE.MeshNormalMaterial();
        return new THREE.Mesh( geometry, material );
    };

    var catFaceGeo = function(heface, geo) {
        var index = geo.vertices.length;
        heface.forEdges(function(edge, initial){
            geo.vertices.push(edge.vert.position);
        });

        var a = index++;
        var b = index++;
        var c = index++;
        geo.faces.push( new THREE.Face3(a,b,c) );
    };

    that.catFaceGeo = catFaceGeo;
    that.dumpToThree = dumpToThree;
    return that;
})();
