
    var fillHoles = function() {
        this.boundaries.map(function(boundarySeed) {
            var bound = boundarySeed;

            var numEdges = 0;
            boundarySeed.loopEdges(function(edge, initial){
                numEdges++;
            });

            while (numEdges > 3) {
                bound = encloseTriangle(bound);
                numEdges--;
            }
            plugHole(bound);
        });
    };

    // assumes the passed edge and edge.prev form an angle <180 (always true if hole is convex)
    var encloseTriangle = function(edge) {
        var pSource = edge.vert;
        var pNext = edge.next.vert;
        var pPrev = edge.prev.vert;

        var boundaryPrev = edge.prev.prev;
        var boundaryNext = edge.next;
        
        var inner = heEdge.create({
            id: pNext.id+"::"+pPrev.id,
            vert: pNext,
            next: edge.prev,
            prev: edge
        });
        edge.prev.prev = inner;
        edge.next = inner;
        var newFace = heFace.create({edge: inner});

        var outer = heEdge.addBoundaryEdge(inner)
        outer.next = boundaryNext;
        boundaryNext.prev = outer;
        boundaryPrev.next = outer;
        outer.prev = boundaryPrev;

        edge.loopEdges(function(edge, initial){
            edge.face = newFace;
            delete edge.isBoundary;
        });
        return boundaryNext;
    };
    var plugHole = function(seedEdge) {
        var newFace = heFace.create({edge: seedEdge});
        seedEdge.loopEdges(function(edge){
            edge.face = newFace;
            delete edge.isBoundary;
        });
    };

