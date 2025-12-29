import * as THREE from 'three';
import './style.scss'

const canvas = document.querySelector('#experience-canvas');
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( sizes.width, sizes.height );
document.body.appendChild( renderer.domElement );
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {


}

const render = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render( scene, camera );
  window.requestAnimationFrame( render );
}

render();