var HEMesh =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	var THREE = __webpack_require__(1);
	var heMesh = __webpack_require__(2);
	var heEdge = __webpack_require__(5);

	module.exports = (function(){
	    var that = {};

	    var fromThreeMesh = function(threeMesh) {
	        var geo = threeMesh.geometry;
	        var mesh = heMesh.create();
	        mesh.parseGeometry(geo);
	        mesh.fillHoles();
	        return mesh;
	    }

	    // starting from initial source face, spread from the initial point using topological information
	    // init frontier, add 3 vertices
	    var toThreeMesh = function(mesh, scene) {
	        // frontier is the collection of half edges interior to the thus far processed surface
	        var geo = new THREE.Geometry();

	        var debugMaterial = new THREE.MeshPhongMaterial();
	        debugMaterial.side = THREE.DoubleSide;

	        mesh.iterateFrontier(function(expansion){

	            addThreeTri(expansion, geo);

	            var face = expansion.faceEdge.face;
	            if (!face) {
	                return;
	            }

	            face.generateDebugEdges();
	            expansion.faceEdge.loopEdges(function(edge){
	                if (expansion.newEdgeIDs.indexOf(edge.id) > -1) {
	                    edge.arrow.setColor( heEdge.colors.frontier );
	                }
	                scene.add(edge.arrow);
	            });
	            FORGE.Scene.triggerRender();
	        });

	        geo.computeBoundingSphere();
	        geo.computeFaceNormals();
	        geo.computeVertexNormals();

	        var threeMesh = new THREE.Mesh( geo, debugMaterial );
	        debugMaterial.color.setHex( Math.random() * 0xffffff );
	        debugMaterial.needsUpdate;
	        return threeMesh;
	    };

	    // should be broken up into addThreeVerts and addThreeFace, and do the face
	    // check in the parent func
	    var addThreeTri = function(expansionData, geo) {
	        var numNewEdges = expansionData.newEdgeIDs.length;
	        var originalEdge = expansionData.faceEdge;

	        // special case for the algo initialization
	        if (numNewEdges == 3) {
	            originalEdge.loopEdges(function(edge){
	                geo.vertices[edge.vert.id] = edge.vert.position;
	            });
	        } else if (numNewEdges == 2) {
	            var newVert = originalEdge.prev.vert;
	            if (!geo.vertices[newVert.id]) {
	                geo.vertices[newVert.id] = newVert.position;
	            }
	        }
	        var face = originalEdge.face;
	        if (!face) {
	            return;
	        }

	        var vertIndices = [];
	        originalEdge.loopEdges(function(edge){
	            vertIndices.push(edge.vert.id);
	        });
	        var newFace = new THREE.Face3( vertIndices[0], vertIndices[1], vertIndices[2] );
	        geo.faces.push( newFace );
	    };

	    that.fromThreeMesh = fromThreeMesh;
	    that.toThreeMesh = toThreeMesh;
	    return that;
	})();



/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = THREE;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	var THREE = __webpack_require__(1);
	var heVertex = __webpack_require__(3);
	var heFace = __webpack_require__(4);
	var heEdge = __webpack_require__(5);

	var debug = __webpack_require__(6);

	module.exports = (function(){
	    var that = {};

	    var create = function(){
	        return {
	            frontier: {},
	            boundaries: [],
	            expandFrontier: expandFrontier,
	            iterateFrontier: iterateFrontier,
	            getFrontierEdge: getFrontierEdge,
	            parseGeometry: parseGeometry,
	            addEdge: addEdge,
	            setEdgeTwin: setEdgeTwin,
	            getEdge: getEdge,
	            removeFrontier: removeFrontier,
	            isManifold: isManifold,
	            fillHoles: fillHoles
	        };
	    };

	    var plugHole = function(seedEdge) {
	        var newFace = heFace.create({edge: seedEdge});
	        seedEdge.loopEdges(function(edge){
	            edge.face = newFace;
	            delete edge.isBoundary;
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

	    var measure = function(edge) {
	        var pSource = edge.vert;
	        var pNext = edge.next.vert;
	        var pPrev = edge.prev.vert;

	        // derive metric based on angle between pNext and pPrev off of the pSource
	    };

	    var parseGeometry = function(geo){
	        var that = this;

	        var genFaces = [];
	        var genVertices = geo.vertices.map(function(v) {
	            return heVertex.create(v.clone(), null);
	        });

	        for (var i = 0, nFaces = geo.faces.length; i < nFaces; i++) {

	            // package the 3 genVertices referenced in the THREE.Face in an array to keep number of sides general
	            var f = geo.faces[i];
	            var faceVertices = [];
	            faceVertices.push(genVertices[f.a]);
	            faceVertices.push(genVertices[f.b]);
	            faceVertices.push(genVertices[f.c]);

	            var newFace = heFace.create({originalIndex: i});
	            var newEdges = faceVertices.map(function(v) {
	                var newEdge = heEdge.create({
	                    vert: v,
	                    face: newFace
	                });
	                v.edge = newEdge;
	                return newEdge;
	            });
	            newFace.edge = newEdges.length > 0 ? newEdges[0] : null;
	            genFaces.push(newFace);

	            that.addEdge(f.a, f.b, newEdges[0]);
	            that.addEdge(f.b, f.c, newEdges[1]);
	            that.addEdge(f.c, f.a, newEdges[2]);

	            that.setEdgeTwin(f.b, f.a, newEdges[0]);
	            that.setEdgeTwin(f.c, f.b, newEdges[1]);
	            that.setEdgeTwin(f.a, f.c, newEdges[2]);

	            for (var j = 0, nEdges = newEdges.length; j < nEdges; j++) {
	                newEdges[j].next = newEdges[(j+1)%nEdges];
	                newEdges[j].prev = newEdges[(j+nEdges-1)%nEdges];
	            }
	        }
	        that.vertices = genVertices;
	        that.faces = genFaces;

	        // edges are addressed by their vertex indices from the original mesh
	        // leverage this to assign unique vertex identifiers and get similiar output mesh
	        genVertices.map(function(vert) {
	            var vertIndices = vert.edge.id.split("::");
	            vert.id = parseInt(vertIndices[0], 10);
	        });

	        var boundaryEdges = {};
	        Object.keys(that.frontier).map(function(edgeID) {
	            var edge = that.frontier[edgeID];
	            var newBoundEdge = heEdge.addBoundaryEdge(edge);
	            boundaryEdges[newBoundEdge.id] = newBoundEdge;
	            that.removeFrontier(edge);
	        });

	        // each iteration will detect one boundary and delete those edges from the hash
	        FORGE.Util.iterateObj(boundaryEdges, function(edgeID, initial) {
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
	    };

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

	    var isManifold = function() {
	        if (!this.vertices || !this.faces) { // hasn't hadk
	            return false;
	        }
	        if (FORGE.Util.getProperty(this.frontier)) { // non-empty frontier means open edges
	            return false;
	        }
	    };

	    var getFrontierEdge = function() {
	        var edgeID = FORGE.Util.getProperty(this.frontier);
	        if (!edgeID) return null;
	        return this.frontier[edgeID];
	    }

	    var iterateFrontier = function(callback) {
	        var that = this;

	        that.frontier = {};
	        var newEdgeIDs = [];
	        var firstFace = that.faces[0].forEdges(function(edge) {
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
	        while (!FORGE.Util.emptyObj(that.frontier)) {
	            if (counter++ >= cutoff) {
	                FORGE.Util.error("Hit halfedge traversal iteration depth limit.");
	                break;
	            }

	            var edge = that.getFrontierEdge();
	            expansion = that.expandFrontier(edge);
	            callback(expansion);
	        }
	    }

	    // the twin of the passed heEdge points to a face outside of the frontier or boundary
	    var expandFrontier = function(seedEdge){
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
	    };

	    // check for existing twin edges, attach pairs if they exist
	    var setEdgeTwin = function(u, v, twin) {
	        var edge = this.getEdge(u, v);
	        if (edge) {
	            edge.twin = twin;
	            twin.twin = edge;
	            // if we've run up against a face within the boundary, prune the edge that would cancel
	            // the edge we were about to add, plus the far vertex is already on the boundary
	            this.removeFrontier(edge);
	            this.removeFrontier(twin);
	        }
	    }

	    var removeFrontier = function(edge) {
	        if (!this.frontier[edge.id]) return; // check shouldn't be necessary if invariants hold
	        if (edge.arrow) {
	            edge.arrow.setColor( heEdge.colors.interior );
	        }
	        delete this.frontier[edge.id];
	    }

	    // "<indexU>::<indexV>" => half edge from vertex U to vertex V
	    var getEdge = function(u, v) {
	        var key = u+"::"+v;
	        return this.frontier[key];
	    };

	    var addEdge = function(u, v, edge) {
	        var key = u+"::"+v;
	        edge.id = key;
	        this.frontier[key] = edge;
	    };

	    // FIXME TODO: add naive hole filling and time csg + convert to heMesh + convert to threeMesh
	    var repairHoles = function() {
	    };

	    that.create = create;
	    return that;
	})();


/***/ },
/* 3 */
/***/ function(module, exports) {

	
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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	
	var THREE = __webpack_require__(1);
	var heEdge = __webpack_require__(5);

	module.exports = (function() {
	    var that = {};

	    // callback(current, initial, 
	    function forEdges(callback) {
	        if (!this.edge) {
	            FORGE.Util.error("Edgeless face detected.");
	            return [];
	        }
	        this.edge.loopEdges(callback);
	    };

	    var debugMaterial = new THREE.MeshPhongMaterial();

	    function dumpMeshTri() {
	        var geo = new THREE.Geometry();
	        this.edge.loopEdges(function(edge, initial){
	            geo.vertices.push(edge.vert.position);
	        });
	        geo.faces.push( new THREE.Face3(0,1,2) );
	        geo.computeBoundingSphere();

	        return new THREE.Mesh( geo, debugMaterial );
	    };

	    var create = function (spec) {
	        var face = {},
	            spec = spec || {};

	        face.edge = spec.edge;
	        face.id = spec.originalIndex || null;

	        face.forEdges = forEdges;
	        face.dumpMeshTri = dumpMeshTri;
	        face.generateDebugEdges = generateDebugEdges;
	        return face;
	    }

	    var generateDebugEdges = function(){
	        var p = [];
	        this.forEdges(function(edge){
	            p.push(edge.vert.position);
	        });

	        if (p.length != 3) {
	            FORGE.Util.error("non-triangular poly");
	        }

	        var sideVectors = [];
	        for (var i = 0; i < p.length; i++) {
	            var nextIndex = (i+1)%p.length;
	            sideVectors[i] = new THREE.Vector3().subVectors(p[nextIndex], p[i]);
	        }

	        var arrows = [];
	        for (var i = 0; i < p.length; i++) {
	            var dir = sideVectors[i];
	            var len = dir.length();
	            dir.divideScalar(len);
	            var origin = p[i].clone();

	            // necessary to clone?
	            var parallelOffset = sideVectors[i].clone();
	            var perpendicularOffset = sideVectors[(i+2)%sideVectors.length].clone();
	            var offset = new THREE.Vector3().subVectors(parallelOffset, perpendicularOffset).multiplyScalar(0.1);
	            origin.add(offset)

	            arrows.push( new THREE.ArrowHelper( dir, origin, len *.4, heEdge.colors.interior ));
	        }

	        var i = 0;
	        this.forEdges(function(edge){
	            edge.arrow = arrows[i++];
	        });

	        return arrows;
	    };

	    that.create = create;
	    return that;
	})();


/***/ },
/* 5 */
/***/ function(module, exports) {

	
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


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	
	var THREE = __webpack_require__(1);

	module.exports = (function(){
	    var that = {};

	    // for every defined face iterate its local vertices and add them to the mesh as an independent face
	    // intended for debugging, a non-manifold isn't suitable for our purposes
	    var dumpToThree = function(mesh) {
	        var geometry = new THREE.Geometry();
	        mesh.faces.map(function(face) {
	            catFaceGeo(face, geometry);
	        });
	        geometry.computeBoundingSphere();

	        var material = new THREE.MeshNormalMaterial();
	        return new THREE.Mesh( geometry, material );
	    };

	    var catFaceGeo = function(face, geo) {
	        var index = geo.vertices.length;
	        face.forEdges(function(edge, initial){
	            geo.vertices.push(edge.vert.position);
	        });

	        var a = index++;
	        var b = index++;
	        var c = index++;
	        geo.faces.push( new THREE.Face3(a,b,c) );

	    };

	    that.catFaceGeo = catFaceGeo;
	    that.dumpToThree = dumpToThree;
	    return that;
	})();


/***/ }
/******/ ]);