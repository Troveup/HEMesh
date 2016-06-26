
var THREE = require("three");
//var HEEdge = require("./edge");

var edgeColors = {
    interior: 0xff0000,
    frontier: 0x00ff00,
    boundary: 0x0000ff
};

class HEFace {
    constructor(spec = {}) {
        this.edge = spec.edge;
    }

    generateDebugArrows(){
        var p = [];
        this.edge.loopEdges(function(edge){
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
            var perpendicularOffset = sideVectors[(i+sideVectors.length-1)%sideVectors.length].clone();
            var offset = new THREE.Vector3().subVectors(parallelOffset, perpendicularOffset).multiplyScalar(0.1);
            origin.add(offset)

            arrows.push( new THREE.ArrowHelper( dir, origin, len *.4, edgeColors.interior ));
        }

        i = 0;
        this.edge.loopEdges(function(edge){
            edge.arrow = arrows[i++];
        });

        return arrows;
    };
}

module.exports = HEFace;

