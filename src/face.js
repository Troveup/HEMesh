
var THREE = require("three");
var heEdge = require("./edge");

module.exports = (function() {
    var that = {};

    // callback(current, initial, 
    function forEdges(callback) {
        if (!this.edge) {
            console.warn("Edgeless face detected.");
            return [];
        }
        this.edge.loopEdges(callback);
    };

    var debugMaterial = new THREE.MeshPhongMaterial();

    function dumpMeshTri() {
        var geo = new THREE.Geometry();
        this.edge.loopEdges(function(edge, initial){
            geo.vertices.push(edge.vert.position);
        });
        geo.faces.push( new THREE.Face3(0,1,2) );
        geo.computeBoundingSphere();

        return new THREE.Mesh( geo, debugMaterial );
    };

    var create = function (spec) {
        var face = {},
            spec = spec || {};

        face.edge = spec.edge;
        face.id = spec.originalIndex || null;

        face.forEdges = forEdges;
        face.dumpMeshTri = dumpMeshTri;
        face.generateDebugEdges = generateDebugEdges;
        return face;
    }

    var generateDebugEdges = function(){
        var p = [];
        this.forEdges(function(edge){
            p.push(edge.vert.position);
        });

        if (p.length != 3) {
            console.warn("non-triangular poly");
        }

        var sideVectors = [];
        for (var i = 0; i < p.length; i++) {
            var nextIndex = (i+1)%p.length;
            sideVectors[i] = new THREE.Vector3().subVectors(p[nextIndex], p[i]);
        }

        var arrows = [];
        for (var i = 0; i < p.length; i++) {
            var dir = sideVectors[i];
            var len = dir.length();
            dir.divideScalar(len);
            var origin = p[i].clone();

            // necessary to clone?
            var parallelOffset = sideVectors[i].clone();
            var perpendicularOffset = sideVectors[(i+2)%sideVectors.length].clone();
            var offset = new THREE.Vector3().subVectors(parallelOffset, perpendicularOffset).multiplyScalar(0.1);
            origin.add(offset)

            arrows.push( new THREE.ArrowHelper( dir, origin, len *.4, heEdge.colors.interior ));
        }

        var i = 0;
        this.forEdges(function(edge){
            edge.arrow = arrows[i++];
        });

        return arrows;
    };

    that.create = create;
    return that;
})();
