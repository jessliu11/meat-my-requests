import './style.scss'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
const light = new THREE.AmbientLight( 0xfcf8c7, 20 ); // soft white light
scene.add( light );

const loader = new GLTFLoader();
loader.load("/models/MeatMyRequests.glb", (glb) => {
  scene.add(glb.scene);
});

const renderer = new THREE.WebGLRenderer( {canvas:canvas, antialias:true } );
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );

const controls = new OrbitControls( camera, renderer.domElement );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 5;
controls.update();

// event listeners 

window.addEventListener('resize', () => {
  // update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const render = () => {
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  controls.update();
  renderer.render( scene, camera );
  window.requestAnimationFrame( render );
  
}

render();