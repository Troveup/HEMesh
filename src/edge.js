
class HEEdge {
    constructor(spec) {
        //this.mapKey = spec.mapKey;
        this.vert = spec.vert; // vertex at the end of the half-edge
        this.twin = spec.twin; // oppositely oriented adjacent half-edge
        this.face = spec.face; // face the half-edge borders
        this.next = spec.next; // next half-edge around the face
        this.prev = spec.prev; // next half-edge around the face
    }

    // precondition: all edge.twin and edge.vert references in mesh are valid
    calcKey() {
        return this.vert.index + "::" + this.twin.vert.index;
    }

    // callback(currentEdge, initialEdge)
    loopEdges(callback) {
        var currEdge = this;
        var results = [];
        do {
            results.push(callback(currEdge, this));
            currEdge = currEdge.next;
            if (!currEdge) {
                console.warn("Broken edge loop around a face or boundary.");
                return results;
            }
        } while (currEdge != this);
        return results;
    }

    generateBoundary() {
        var vert = this.next.vert;
        //var points = this.mapKey.split("::");
        var boundaryEdge = create({
            //mapKey: points[1]+"::"+points[0],
            vert: vert,
            twin: this
        });

        boundaryEdge.isBoundary = true;
        this.twin = boundaryEdge;
        delete this.isBoundary;
        return boundaryEdge;
    }
}

module.exports = HEEdge;

