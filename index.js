
var THREE = require("three");
var HEMesh = require("./src/mesh");

console.log("getting latest hemesh index.js");

var OrbitControls = require('three-orbit-controls')(THREE);
THREE.OrbitControls = OrbitControls;

//var CSGLib = require('./src/csg');

var material = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x00ff00
});
var iterativeMat = new THREE.MeshBasicMaterial({
    color: 0x0000ff
});
var debugMat = new THREE.MeshNormalMaterial();

var interiorColor = new THREE.Color( 0xff0000 );
var frontierColor = new THREE.Color( 0x00ff00 );
var boundaryColor = new THREE.Color( 0x0000ff );


function exportToObj( scene ) {
    var exporter = new THREE.OBJExporter();
    return exporter.parse( scene );
}

/*function testCSG( scene, container ) {
    var geometry1 = new THREE.SphereGeometry( 2, 16, 16 );
    var geometry2 = new THREE.SphereGeometry( 2, 16, 16 );

    // var geometry1 = new THREE.BoxGeometry( 2, 2, 2 );
    // var geometry2 = new THREE.BoxGeometry( 2, 2, 2 );

    var mesh1 = new THREE.Mesh( geometry1, debugMat );
    var mesh2 = new THREE.Mesh( geometry2, debugMat );

    // sphere positions
    mesh1.position.set(  1, 1, 1 );
    mesh2.position.set( -1,-1,-1 );

    // box positions
    // mesh1.position.set(-0.5,-0.5,-0.5);
    // mesh2.position.set( 0.5, 0.5, 0.5);

    var joinedMesh = CSGLib.combineMeshes(mesh1, mesh2);
    scene.add( joinedMesh );

    // verify csg result
    var vertCount = joinedMesh.geometry.vertices.length;
    var expectedVerts = 32;
    console.log("Expected result with %s, got %s ", expectedVerts, vertCount);

    //var objString = exportToObj(scene);
    //if (!container) {
        //console.log(objString);
        //console.warn("logged OBJ text because no container passed to display it");
    //} else {
        //container.innerHTML = objString; // .split( '\n' ).join( '<br />' );
    //}
}*/

function testHalfEdge( scene, iterationMax = 0) {
    // var seedGeom = new THREE.BoxGeometry( 1, 1, 1 );
    // var seedGeom = new THREE.PlaneGeometry( 1, 1, 1 );
    var seedGeom = generate2HoleCube();
    var seedMesh = new THREE.Mesh( seedGeom, material );
    scene.add( seedMesh );


    var iterativeGeo = new THREE.Geometry();
    var heMesh = new HELib.HEMesh({ geometry: seedGeom });
    heMesh.closeHoles();
    heMesh.generateFaceArrows( scene );

    var iterator = heMesh.iterateFrontier();

    var waitForPrompting = false;
    var useFaceFragments = false;
    if (!useFaceFragments) {
        iterativeGeo.vertices = heMesh.vertices.map(function(v) {
            return v.position;
        });
    }

    var expansion;
    var counter = 0;
    var button = document.getElementById('stepButton');
    var iterativeMesh; //  = new THREE.Mesh( iterativeGeo, iterativeMat );
    var iterativeMeshes = [];

    function iterationLimitedStep() {
        if (counter >= iterationMax && iterationMax > 0) {
            return;
        }
        // console.log("on %s of %s", counter, iterationMax);

        expansion = stepIterator(iterator, iterativeGeo, useFaceFragments);

        if (waitForPrompting) {
            iterativeMesh = new THREE.Mesh( iterativeGeo.clone(), iterativeMat );
            iterativeMeshes[counter] = iterativeMesh;
            scene.add( iterativeMeshes[counter] );

            if (expansion.done) {
                counter++;
                button.removeEventListener('click', iterationLimitedStep);
                return;
            }
        }
        counter++;
    }

    iterationLimitedStep();
    if (waitForPrompting) {
        button.addEventListener('click', iterationLimitedStep);
    } else {
        while (!expansion.done) {
            iterationLimitedStep();
        }
    }

    if (!waitForPrompting) {
        iterativeMesh = new THREE.Mesh( iterativeGeo, iterativeMat );
        scene.add( iterativeMesh );
    }
}

function stepIterator(iterator, geometry, duplicateVertices) {
    var expansion = iterator.next();
    // assume this means it just finished since the calling also loop monitors done
    if (expansion.done) { 
        console.log("terminal value: ", expansion.value);
        return expansion;
    }

    expansion.value.newEdges.map(function(newFrontierEdge){
        newFrontierEdge.arrow.setColor( frontierColor );
    });
    expansion.value.closedEdges.map(function(closedEdge){
        if (closedEdge.twin.isBoundary) {
            closedEdge.arrow.setColor( boundaryColor );
        } else {
            closedEdge.arrow.setColor( interiorColor );
        }
    });

    if (duplicateVertices) {
        addSeparateFaceToGeometry(expansion.value.face, geometry);
    } else {
        addFaceToGeometry(expansion.value.face, geometry);
    }

    return expansion;
}

function addSeparateFaceToGeometry(face, geo) {
    var index = geo.vertices.length;
    face.edge.loopEdges(function(edge, initial){
        geo.vertices.push(edge.vert.position.clone());
    });

    var a = index++;
    var b = index++;
    var c = index++;
    geo.faces.push( new THREE.Face3(a,b,c) );
}

function addFaceToGeometry(face, geo) {
    var f = face.edge.loopEdges(function(edge){
        return edge.vert.index;
    });
    geo.faces.push( new THREE.Face3(f[0], f[1], f[2]) );
}

function generate2HoleCube() {
    var geom = new THREE.Geometry(); 

    geom.vertices = [
        new THREE.Vector3(1.000000, -1.000000, -1.000000),
        new THREE.Vector3(1.000000, -1.000000, 1.000000),
        new THREE.Vector3(-1.000000, -1.000000, 1.000000),
        new THREE.Vector3(-1.000000, -1.000000, -1.000000),
        new THREE.Vector3(1.000000, 1.000000, -0.999999),
        new THREE.Vector3(0.999999, 1.000000, 1.000001),
        new THREE.Vector3(-1.000000, 1.000000, 1.000000),
        new THREE.Vector3(-1.000000, 1.000000, -1.000000)
    ];
    geom.faces = [
        new THREE.Face3(1, 4, 5),
        new THREE.Face3(1, 0, 4),
        new THREE.Face3(2, 5, 6),
        new THREE.Face3(2, 1, 5),
        new THREE.Face3(3, 6, 7),
        new THREE.Face3(3, 2, 6),
        new THREE.Face3(7, 0, 3),
        new THREE.Face3(7, 4, 0)
    ];
    return geom;
}

//module.exports = { HEMesh, CSGLib, testHalfEdge, testCSG };
module.exports = { HEMesh, testHalfEdge };

