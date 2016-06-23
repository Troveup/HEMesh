
class EdgeMap {
    constructor() {
        this.edges = Object.create(null);
    }
 
    addEdge(u, v, edge) {
        var key = u+"::"+v;
        edge.id = key; // ?
        this.edges[key] = edge;
    };

    // "<indexU>::<indexV>" => half edge from vertex U to vertex V
    getEdge(u, v) {
        var key = u+"::"+v;
        return this.edges[key];
    };

    removeEdge(u, v) {
        var key = u+"::"+v;
        delete this.edges[key]
    }

    // TODO: set edge as boundary if twin doesn't exist (or create boundary edge to be connected later
    linkEdgesBetween(u, v) {
        var edge0 = this.getEdge(u, v);
        var edge1 = this.getEdge(v, u);

        edge0.twin = edge1;
        edge1.twin = edge0;
    }

    pickEdge() {
        var keys = Object.keys(this.edges);
        if (keys.length) {
            return this.edges[keys[0]];
        }

        return null;
    }

}

module.exports = EdgeMap;
