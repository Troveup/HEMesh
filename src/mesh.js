
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
        this.boundaryEdges = {};
        this.boundaries = [];

        if (spec.geometry) {
            this.parseGeometry(spec.geometry);
            this.handleBoundaries();
        }
    }

    closeHoles() {
        this.boundaries.map(function(boundarySeed) {
            this.triangleFanFill(boundarySeed);
        }.bind(this));
    }

    // creates edges from the seedEdge.vert to all the non-adjacent vertices
    // on the boundary 
    triangleFanFill(seedEdge) {
        var currentEdge = seedEdge;
        do {
            var isTriangle = currentEdge.next.next == currentEdge.prev;
            if (isTriangle) break;

            currentEdge = this.insertBoundaryTriangle(currentEdge);
        } while (!isTriangle);
        this.closeTriangleBound(currentEdge);
    }

    // TODO: maintain heuristic guided priority queue of edges for
    // inserting the boundary triangles
    // priorityFill(seedEdge) {}

    closeTriangleBound(curr) {
        var newFace = new HEFace({ edge: curr });
        curr.loopEdges(function(edge) {
            edge.face = newFace;
            edge.isBoundary = false;
        });
        this.faces.push(newFace);
    }

    /*
    * @param curr - this and the curr.next edges will be connected to form a triangle
    */
    insertBoundaryTriangle(curr) {
        var newFace = new HEFace();
        var newInterior = new HEEdge();
        var newBoundary = new HEEdge();

        var newBoundPrev = curr.prev;
        var newBoundNext = curr.next.next;

        // fix references involving the new interior edge
        newInterior.prev = curr.next;
        newInterior.next = curr;
        newInterior.vert = newBoundNext.vert
        curr.prev = newInterior;
        curr.next.next = newInterior;

        // fix references involving the new boundary edge
        newBoundary.prev = newBoundPrev;
        newBoundary.next = newBoundNext;
        newBoundary.vert = curr.vert;
        newBoundPrev.next = newBoundary;
        newBoundNext.prev = newBoundary;

        newInterior.twin = newBoundary;
        newBoundary.twin = newInterior;

        newFace.edge = curr;
        curr.loopEdges(function(edge) {
            edge.face = newFace;
        });

        newBoundary.isBoundary = true;
        delete curr.isBoundary;
        delete curr.next.isBoundary;
        this.edges.push(newInterior);
        this.edges.push(newBoundary);
        this.faces.push(newFace);
        return newBoundary;
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
            var b1 = unmatched.linkEdgesBetween(f.a, f.b, HEEdge);
            var b2 = unmatched.linkEdgesBetween(f.b, f.c, HEEdge);
            var b3 = unmatched.linkEdgesBetween(f.c, f.a, HEEdge);
            if (b1) {
                this.boundaryEdges[b1.id] = b1;
            }
            if (b2) {
                this.boundaryEdges[b2.id] = b2;
            }
            if (b3) {
                this.boundaryEdges[b3.id] = b3;
            }
        }.bind(this));
    }

    generateFaceArrows(scene) {
        this.faces.map(function(face, i) {
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
        var newEdges = [];
        this.faces[0].edge.loopEdges(function(edge) {
            if (edge.twin.isBoundary) {
                return;
            }
            frontier[edge.id] = edge;
            newEdges.push(edge);
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

                if (edge.twin.isBoundary) {
                    return;
                }
                
                // if an edge in an expansion face is adjacent to frontier,
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

    handleBoundaries() {
        Object.keys(this.boundaryEdges).map(function(edgeID) {
            var initial = this.boundaryEdges[edgeID];
            if (!initial) {
                return;
            }

            var active = initial;
            // loop around boundary connecting next and prev, deleting from boundaryEdges
            do {
                // pivot around the vertex the active half edge is pointed at
                var internal = active.twin.prev;
                while (!internal.twin.isBoundary) {
                    internal = internal.twin.prev;
                }
                active.next = internal.twin;
                internal.twin.prev = active;

                delete this.boundaryEdges[active.id];
                active = internal.twin;
            } while (active.next != initial);

            this.boundaries.push(initial);
        }.bind(this));
    }

}

module.exports = HEMesh;

