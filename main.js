import * as three from 'https://cdn.rawgit.com/mrdoob/three.js/dev/build/three.module.js';

// import { TrackballControls } from 'https://unpkg.com/three/examples/jsm/controls/TrackballControls.js';
// import { PDBLoader } from 'https://unpkg.com/three/examples/jsm/loaders/PDBLoader.js';
// import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js';
// import { GUI } from 'https://unpkg.com/three/examples/jsm/libs/lil-gui.module.min.js';

import { TrackballControls } from './src/TrackballControls.js';
import { PDBLoader } from './src/PDBLoader.js';
import { CSS2DRenderer, CSS2DObject } from './src/CSS2DRenderer.js';
import { GUI } from './src/lil-gui.module.min.js';

let camera, scene, renderer, labelRenderer;
let controls;

let root;

const MOLECULES = {
    'Geraniol': 'geraniol.pdb',
    'Citronellol': 'citronellol.pdb',
    'Nerol': 'nerol.pdb',
};

const params = {
    molecule: 'geraniol.pdb'
};

const loader = new PDBLoader();
const offset = new three.Vector3();

// // create an AudioListener and add it to the camera
// const listener = new three.AudioListener();
// // create a global audio source
// const sound = new three.Audio( listener );
// // load a sound and set it as the Audio object's buffer
// const audioLoader = new three.AudioLoader();


init();
animate();

function init() {  

    scene = new three.Scene();
    scene.background = new three.Color( 0x050505 );

    camera = new three.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.z = 1000;
    // camera.add( listener );
    scene.add( camera );

    // audioLoader.load( 'geranio_new_v2.mp3', function( buffer ) {
    //     sound.setBuffer( buffer );
    //     sound.setLoop(true);
    //     sound.setVolume(1.0);
    //     sound.play();
    // });

    const light1 = new three.DirectionalLight( 0xffffff, 0.8 );
    light1.position.set( 1, 1, 1 );
    scene.add( light1 );

    const light2 = new three.DirectionalLight( 0xffffff, 0.5 );
    light2.position.set( - 1, - 1, 1 );
    scene.add( light2 );

    root = new three.Group();
    scene.add( root );

    //

    renderer = new three.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById( 'container' ).appendChild( labelRenderer.domElement );

    //

    controls = new TrackballControls( camera, renderer.domElement );
    controls.minDistance = 500;
    controls.maxDistance = 2000;

    //

    loadMolecule( params.molecule );

    //

    window.addEventListener( 'resize', onWindowResize );

    //

    const gui = new GUI();

    gui.add( params, 'molécula:', MOLECULES ).onChange( loadMolecule );
    gui.open();

}

//

function loadMolecule( model ) {

    const url = './pdb/' + model;

    while ( root.children.length > 0 ) {

        const object = root.children[ 0 ];
        object.parent.remove( object );

    }

    loader.load( url, function ( pdb ) {

        const geometryAtoms = pdb.geometryAtoms;
        const geometryBonds = pdb.geometryBonds;
        const json = pdb.json;

        const boxGeometry = new three.BoxGeometry( 1, 1, 1 );
        const sphereGeometry = new three.IcosahedronGeometry( 1, 3 );

        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter( offset ).negate();

        geometryAtoms.translate( offset.x, offset.y, offset.z );
        geometryBonds.translate( offset.x, offset.y, offset.z );

        let positions = geometryAtoms.getAttribute( 'position' );
        const colors = geometryAtoms.getAttribute( 'color' );

        const position = new three.Vector3();
        const color = new three.Color();

        for ( let i = 0; i < positions.count; i ++ ) {

            position.x = positions.getX( i );
            position.y = positions.getY( i );
            position.z = positions.getZ( i );

            color.r = colors.getX( i );
            color.g = colors.getY( i );
            color.b = colors.getZ( i );

            const material = new three.MeshPhongMaterial( { color: color } );

            const object = new three.Mesh( sphereGeometry, material );
            object.position.copy( position );
            object.position.multiplyScalar( 75 );
            object.scale.multiplyScalar( 25 );
            root.add( object );

            const atom = json.atoms[ i ];

            const text = document.createElement( 'div' );
            text.className = 'label';
            text.style.color = 'rgb(' + atom[ 3 ][ 0 ] + ',' + atom[ 3 ][ 1 ] + ',' + atom[ 3 ][ 2 ] + ')';
            text.textContent = atom[ 4 ];

            const label = new CSS2DObject( text );
            label.position.copy( object.position );
            root.add( label );

        }

        positions = geometryBonds.getAttribute( 'position' );

        const start = new three.Vector3();
        const end = new three.Vector3();

        for ( let i = 0; i < positions.count; i += 2 ) {

            start.x = positions.getX( i );
            start.y = positions.getY( i );
            start.z = positions.getZ( i );

            end.x = positions.getX( i + 1 );
            end.y = positions.getY( i + 1 );
            end.z = positions.getZ( i + 1 );

            start.multiplyScalar( 75 );
            end.multiplyScalar( 75 );

            const object = new three.Mesh( boxGeometry, new three.MeshPhongMaterial( 0xffffff ) );
            object.position.copy( start );
            object.position.lerp( end, 0.5 );
            object.scale.set( 5, 5, start.distanceTo( end ) );
            object.lookAt( end );
            root.add( object );

        }

        render();

    } );

}

//

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

function animate() {

    requestAnimationFrame( animate );
    controls.update();

    const time = Date.now() * 0.0004;

    root.rotation.x = time;
    root.rotation.y = time * 0.7;

    render();

}

function render() {

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );

}