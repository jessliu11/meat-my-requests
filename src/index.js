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
scene.background = new THREE.Color(0xffcdc9);
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
const ambientlight = new THREE.AmbientLight( 0xfcf8c7, 1.95 ); // soft white light
scene.add( ambientlight );
const pointLight1 = new THREE.PointLight( 0xfcf9dc, 100, 100 );
pointLight1.position.set( 0, 5, 5 );
scene.add( pointLight1 );
const pointLight2 = new THREE.PointLight( 0xfcf9dc, 500, 100 );
pointLight2.position.set( 5, 15, 15 );
scene.add( pointLight2 );


const sphereSize = 1;
// const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
// scene.add( pointLightHelper );


const loader = new GLTFLoader();
loader.load("/models/MeatMyRequests.glb", (glb) => {
  scene.add(glb.scene);
});

const renderer = new THREE.WebGLRenderer( {canvas:canvas, antialias:true } );
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );

const controls = new OrbitControls( camera, renderer.domElement );

camera.zoom = 1.3;
camera.updateProjectionMatrix();

camera.position.x = 0;
camera.position.z = 5;
camera.position.y = 5;

controls.target.set(0, 0, -2); // Set what the camera looks at
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


document.getElementById('playButton').addEventListener('click', function(){
  window.location.href = "./main.html";
});

const render = () => {
  controls.update();
  renderer.render( scene, camera );
  window.requestAnimationFrame( render );
  
}

render();