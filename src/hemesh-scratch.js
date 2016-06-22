
module.exports = (function(){
    var heMesh = {};

    // generate a vertex from a THREE.Vector3 and an edge reference
    var createVertex = function (pos, edge) {
        var vertex = {};
        vertex.position = pos;
        vertex.edge = edge;
        return vertex;
    }
    var createFace = function (edge, originalIndex) {
        var face = {};
        face.edge = edge;
        face.originalIndex = originalIndex;
        return face;
    }
    var createEdge = function(vert, twin, face, next) {
        var edge = {};
        edge.vert = vert; // vertex at the end of the half-edge
        edge.twin = twin; // oppositely oriented adjacent half-edge
        edge.face = face; // face the half-edge borders
        edge.next = next; // next half-edge around the face
        return edge;
    }

    // todo
    // render mesh with wireframe
    // test with a 6 sided cube, triangulate to make 12 sides
    // convert heMesh to threeMesh
    
    var triangulate = function(heMesh) {
    };

    var parse = function(threeMesh) {
        var geo = threeMesh.geometry;

        var halfedges = {};

        debugger;
        var heVertices = geo.vertices.map(function(v) {
            return createVertex(v.clone(), null);
        });

        for (var i = 0, nFaces = geo.faces.length; i < nFaces; i++) {

            // package the 3 heVertices referenced in the THREE.Face in an array to keep number of sides general
            var f = geo.faces[i];
            var heVerts = [];
            heVerts.push(heVertices[f.a]);
            heVerts.push(heVertices[f.b]);
            heVerts.push(heVertices[f.c]);

            // create an edge for each vertex, and bidirectional refs between the face and the edges
            var newFace = createFace(null, i);
            var newEdges = heVerts.map(function(v) {
                var newEdge = createEdge(v, null, newFace, null);
                v.edge = newEdge;
                return newEdge;
            });
            newFace.edge = newEdges.length > 0 ? newEdges[0] : null;

            // save the new edges in the global list
            setEdge(halfedges, f.a, f.b, newEdges[0]);
            setEdge(halfedges, f.b, f.c, newEdges[1]);
            setEdge(halfedges, f.c, f.a, newEdges[2]);

            // check for existing twin edges, attach pairs
            var twinA = getEdge(halfedges, f.b, f.a);
            var twinB = getEdge(halfedges, f.c, f.b);
            var twinC = getEdge(halfedges, f.a, f.c);
            if (twinA) {
                twinA.twin = newEdges[0];
                newEdges[0].twin = twinA;
            }
            if (twinB) {
                twinB.twin = newEdges[1];
                newEdges[1].twin = twinB;
            }
            if (twinC) {
                twinC.twin = newEdges[2];
                newEdges[2].twin = twinC;
            }

            // set pointers to the next 
            for (var j = 0, nEdges = newEdges.length; j < nEdges; j++) {
                newEdges[j].next = newEdges[(j+1)%nEdges];
                // newEdges[j].prev = newEdges[(j+nEdges-1)%nEdges];
            }
        }

        // have built halfedges now, but don't have a good way to verify data structure
        return halfedges;
    }

    // "<indexU>::<indexV>" => half edge from vertex U to vertex V
    var getEdge = function(edgeSet, u, v) {
        var key = u+"::"+v;
        return edgeSet[key];
    };

    var setEdge = function(edgeSet, u, v, edge) {
        var key = u+"::"+v;
        edgeSet[key] = edge;
    }

    heMesh.parse = parse;
    //heMesh.createVertex = createVertex;
    //heMesh.createFace = createFace;
    //heMesh.createEdge = createEdge;
    return heMesh;
})();
