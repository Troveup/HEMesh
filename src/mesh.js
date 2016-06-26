
var THREE = require("three");
var HEVertex = require("./vertex");
var HEFace = require("./face");
var HEEdge = require("./edge");
var EdgeMap = require("./edge-map.js");

class HEMesh {

    constructor(spec) {
        this.faces = [];
        this.vertices = [];
        this.edges = [];
        //this.boundaries = [];

        if (spec.geometry) {
            this.parseGeometry(spec.geometry);
        }
    }

    parseGeometry(geo) {
        var unmatched = new EdgeMap();
        this.vertices = geo.vertices.map(function(position, i) {
            return new HEVertex({ position: position.clone(), index: i }); // clone might not be necessary
        });

        // generate all the half-edges and faces, doesn't link twins
        geo.faces.map(function(f, i) {
            var newFace = new HEFace();

            var verts = [
                this.vertices[f.a],
                this.vertices[f.b],
                this.vertices[f.c]
            ];

            var newEdges = verts.map(function(faceVertex) {
                var newEdge = new HEEdge({ vert: faceVertex, face: newFace });
                faceVertex.edge = newEdge;
                this.edges.push(newEdge);
                return newEdge;
            }.bind(this));

            newFace.edge = newEdges.length > 0 ? newEdges[0] : null;
            this.faces.push(newFace);

            for (var j = 0, nEdges = newEdges.length; j < nEdges; j++) {
                newEdges[j].next = newEdges[(j+1)%nEdges];
                newEdges[j].prev = newEdges[(j+nEdges-1)%nEdges];
            }

            unmatched.setEdge(f.a, f.b, newEdges[0]);
            unmatched.setEdge(f.b, f.c, newEdges[1]);
            unmatched.setEdge(f.c, f.a, newEdges[2]);
        }.bind(this));

        // do linking after to simplify logic
        geo.faces.map(function(f) {
            unmatched.linkEdgesBetween(f.a, f.b);
            unmatched.linkEdgesBetween(f.b, f.c);
            unmatched.linkEdgesBetween(f.c, f.a);
        });
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

    *iterateFrontier() {
        var that = this;

        var frontier = Object.create(null);

        function fetchFrontierCandidate() {
            var keys = Object.keys(frontier);
            if (keys.length) {
                return frontier[keys[0]];
            }
            return null;
        }

        // add edges from the initial seed face
        var newEdges = this.faces[0].edge.loopEdges(function(edge) {
            frontier[edge.id] = edge;
            return edge;
        });
        var closedEdges = [];

        yield {
            face: this.faces[0],
            newEdges: newEdges,
            closedEdges: closedEdges
        };

        var focusEdge = fetchFrontierCandidate();
        while (focusEdge) {
            newEdges = [];
            closedEdges = [];
            focusEdge.twin.loopEdges(function(edge, initial){
                if (edge == initial) return;
                
                // TODO: if an edge in an expansion face is adjacent to frontier,
                // then the frontier has folded in on itself and neither edge
                // should remain in it
                if (frontier[edge.twin.id]) {
                    closedEdges.push(frontier[edge.twin.id]);
                    delete frontier[edge.twin.id]
                    return;
                }

                frontier[edge.id] = edge;
                newEdges.push(edge);
            });
            closedEdges.push(frontier[focusEdge.id]);
            delete frontier[focusEdge.id]

            yield {
                face: focusEdge.twin.face,
                newEdges: newEdges,
                closedEdges: closedEdges
            };

            focusEdge = fetchFrontierCandidate();
        }
        return 'dummy terminal value for logic checking';
    }

    // TODO: revisit this logic and integrate with updated format when addressing meshes with boundaries
    handleBoundaries() {
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
    }
}

module.exports = HEMesh;

