
module.exports = (function() {
    var that = {};

    // callback(currentEdge, initialEdge)
    var loopEdges = function(callback) {
        var currEdge = this;
        do {
            callback(currEdge, this);
            currEdge = currEdge.next;
            if (!currEdge) {
                console.warn("Broken edge loop around a face or boundary.");
                return;
            }
        } while (currEdge != this);
    };

    var create = function(spec) {
        var edge = {};
        edge.id = spec.id;
        edge.vert = spec.vert; // vertex at the end of the half-edge
        edge.twin = spec.twin; // oppositely oriented adjacent half-edge
        edge.face = spec.face; // face the half-edge borders
        edge.next = spec.next; // next half-edge around the face
        edge.prev = spec.prev; // next half-edge around the face

        edge.loopEdges = loopEdges;
        return edge;
    };

    // the passed seed edge must be a valid and consistent interior edge
    // doesn't take care of prev/next refs in new boundary edge
    var addBoundaryEdge = function(seedEdge) {
        var vert = seedEdge.next.vert;
        var points = seedEdge.id.split("::");
        var boundaryEdge = create({
            id: points[1]+"::"+points[0],
            vert: vert,
            twin: seedEdge
        });

        boundaryEdge.isBoundary = true;
        seedEdge.twin = boundaryEdge;
        delete seedEdge.isBoundary;
        return boundaryEdge;
    };

    var edgeColors = {
        interior: 0xff0000,
        frontier: 0x00ff00,
        boundary: 0x0000ff
    }

    that.colors = edgeColors;
    that.create = create;
    that.toString = toString;
    that.addBoundaryEdge = addBoundaryEdge;
    return that;
})();
