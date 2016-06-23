
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

    pickEdge() {
        var keys = Object.keys(this.edges);
        if (keys.length) {
            return this.edges[keys[0]];
        }

        return null;
    }
}

module.exports = EdgeMap;
