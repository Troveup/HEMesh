
module.exports = (function(){
    var that = {};

    // generate a vertex from a THREE.Vector3 and an edge reference
    var create = function (pos, edge) {
        var vertex = {};
        vertex.position = pos;
        vertex.edge = edge;
        return vertex;
    }

    that.create = create;
    return that;
})();
