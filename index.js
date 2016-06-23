
var THREE = require("three");
var heMesh = require("./src/mesh");
var heEdge = require("./src/edge");
var OrbitControls = require('three-orbit-controls')(THREE);
THREE.OrbitControls = OrbitControls;

module.exports = (function(){
    var that = {};

    var fromThreeMesh = function(threeMesh) {
        var geo = threeMesh.geometry;
        var mesh = heMesh.create();
        mesh.parseGeometry(geo);
        mesh.fillHoles();
        return mesh;
    }

    // starting from initial source face, spread from the initial point using topological information
    // init frontier, add 3 vertices
    var toThreeMesh = function(mesh, scene) {
        // frontier is the collection of half edges interior to the thus far processed surface
        var geo = new THREE.Geometry();

        var debugMaterial = new THREE.MeshPhongMaterial();
        debugMaterial.side = THREE.DoubleSide;

        mesh.iterateFrontier(function(expansion){

            addThreeTri(expansion, geo);

            var face = expansion.faceEdge.face;
            if (!face) {
                return;
            }

            face.generateDebugEdges();
            expansion.faceEdge.loopEdges(function(edge){
                if (expansion.newEdgeIDs.indexOf(edge.id) > -1) {
                    edge.arrow.setColor( heEdge.colors.frontier );
                }
                scene.add(edge.arrow);
            });
            //renderer.render(scene, camera);
        });

        geo.computeBoundingSphere();
        geo.computeFaceNormals();
        geo.computeVertexNormals();

        var threeMesh = new THREE.Mesh( geo, debugMaterial );
        debugMaterial.color.setHex( Math.random() * 0xffffff );
        debugMaterial.needsUpdate;
        return threeMesh;
    };

    // should be broken up into addThreeVerts and addThreeFace, and do the face
    // check in the parent func
    var addThreeTri = function(expansionData, geo) {
        var numNewEdges = expansionData.newEdgeIDs.length;
        var originalEdge = expansionData.faceEdge;

        // special case for the algo initialization
        if (numNewEdges == 3) {
            originalEdge.loopEdges(function(edge){
                geo.vertices[edge.vert.id] = edge.vert.position;
            });
        } else if (numNewEdges == 2) {
            var newVert = originalEdge.prev.vert;
            if (!geo.vertices[newVert.id]) {
                geo.vertices[newVert.id] = newVert.position;
            }
        }
        var face = originalEdge.face;
        if (!face) {
            return;
        }

        var vertIndices = [];
        originalEdge.loopEdges(function(edge){
            vertIndices.push(edge.vert.id);
        });
        var newFace = new THREE.Face3( vertIndices[0], vertIndices[1], vertIndices[2] );
        geo.faces.push( newFace );
    };

    that.fromThreeMesh = fromThreeMesh;
    that.toThreeMesh = toThreeMesh;
    return that;
})();

