
var THREE = require("three");
var HEVertex = require("./vertex");
var HEFace = require("./face");
var HEEdge = require("./edge");
var EdgeMap = require("./edge-map.js");

class HEMesh {

    constructor() {
        this.faces = [];
        this.vertices = [];
        this.edgeMap = new EdgeMap();
        //this.boundaries = [];
    }

    parseGeometry(geo) {
        this.vertices = geo.vertices.map(function(position) {
            return new HEVertex({ position: position.clone() }); // clone might not be necessary
        });

        // generate all the half-edges and faces, doesn't link twins
        for (var i = 0, nFaces = geo.faces.length; i < nFaces; i++) {
            var f = geo.faces[i];
            var newFace = new HEFace();

            var verts = [
                this.vertices[f.a],
                this.vertices[f.b],
                this.vertices[f.c]
            ];
            var newEdges = verts.map(function(faceVertex) {
                var newEdge = new HEEdge({ vert: faceVertex, face: newFace });
                faceVertex.edge = newEdge;
                return newEdge;
            });
            newFace.edge = newEdges.length > 0 ? newEdges[0] : null;
            this.faces.push(newFace);

            for (var j = 0, nEdges = newEdges.length; j < nEdges; j++) {
                newEdges[j].next = newEdges[(j+1)%nEdges];
                newEdges[j].prev = newEdges[(j+nEdges-1)%nEdges];
            }

            this.edgeMap.addEdge(f.a, f.b, newEdges[0]);
            this.edgeMap.addEdge(f.b, f.c, newEdges[1]);
            this.edgeMap.addEdge(f.c, f.a, newEdges[2]);
        }

        // do linking after to simplify logic
        for (i = 0, nFaces = geo.faces.length; i < nFaces; i++) {
            var f = geo.faces[i];

            this.edgeMap.linkEdgesBetween(f.a, f.b);
            this.edgeMap.linkEdgesBetween(f.b, f.c);
            this.edgeMap.linkEdgesBetween(f.c, f.a);
        }
    }

    generateFaceArrows(scene, faceCount) {
        this.faces.map(function(face, i) {
            if (faceCount && i >= faceCount) {
                return;
            }

            face.generateDebugArrows().map(function(newArrow){
                scene.add( newArrow );
            });
        });
    }

    // TODO: revisit this logic and integrate with updated format when addressing meshes with boundaries
    /*handleBoundaries() {
        var boundaryEdges = {};
        Object.keys(that.frontier).map(function(edgeID) {
            var edge = that.frontier[edgeID];
            var newBoundEdge = heEdge.addBoundaryEdge(edge);
            boundaryEdges[newBoundEdge.id] = newBoundEdge;
            that.removeFrontier(edge);
        });

        // each iteration will detect one boundary and delete those edges from the hash
        Object.keys(boundaryEdges).map(function(edgeID) {
            var initial = boundaryEdges[edgeID];
            var active = initial;
            delete boundaryEdges[initial.id];

            do { // loop around boundary connecting next and prev, deleting from boundaryEdges
                var current = active.twin;
                do { // pivot around the vertex the active half edge is pointed at
                    current = current.prev.twin;
                } while (!current.isBoundary);
                active.next = current;
                current.prev = active;

                delete boundaryEdges[active.id];
                active = current;
            } while (active.next != initial);

            that.boundaries.push(initial);
        });
    }*/

    // the twin of the passed heEdge points to a face outside of the frontier or boundary
    /*expandFrontier(seedEdge) {
        var that = this;
        var twin = seedEdge.twin;
        var newIDs = [];
        twin.loopEdges(function(edge, initial){
            if (edge == initial) return;

            // if we've run up against a face within the boundary, prune the edge that would cancel
            // the edge we were about to add, plus the far vertex is already on the boundary
            if (that.frontier[edge.twin.id]) {
                that.removeFrontier(edge.twin);
            } else { // otherwise, this edge on the absorbed face is 
                newIDs.push(edge.id);
                that.frontier[edge.id] = edge;
            }
        });

        that.removeFrontier(seedEdge);
        return {
            newEdgeIDs: newIDs,
            faceEdge: twin
        }
    }*/

    /*
    iterateFrontier(callback) {
        var that = this;

        var newEdgeIDs = [];
        that.frontier = Object.create(null);
        that.faces[0].forEdges(function(edge) {
            that.frontier[edge.id] = edge;
            newEdgeIDs.push(edge.id);
        });

        var expansion = {
            newEdgeIDs: newEdgeIDs,
            faceEdge: that.faces[0].edge
        };
        callback(expansion);

        var counter = 1;
        var cutoff = that.faces * 3; // number of half edges
        while (!extractProperty(that.frontier)) {
            if (counter++ >= cutoff) {
                console.warn("Hit halfedge traversal iteration depth limit.");
                break;
            }

            var edge = that.getFrontierEdge();
            expansion = that.expandFrontier(edge);
            callback(expansion);
        }

    var removeFrontier = function(edge) {
        if (!this.frontier[edge.id]) return; // check shouldn't be necessary if invariants hold
        if (edge.arrow) {
            edge.arrow.setColor( heEdge.colors.interior );
        }
        delete this.frontier[edge.id];
    }

    }*/
}

module.exports = HEMesh;

