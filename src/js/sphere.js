import * as THREE from 'three';
import * as CANNON from 'cannon';

var ground;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0,0 ,20);
camera.lookAt(new THREE.Vector3());

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', ()=>{

    var height = window.innerHeight;
    var width = window.innerWidth;
    renderer.setSize(width, height);
    camera.aspect = width/height;
    camera.updateProjectionMatrix()

});

var geometry = new THREE.SphereGeometry( 1, 16, 16 ); 
var material = new THREE.MeshBasicMaterial({color: 0xFFF550, wireframe: true}); 
var sphere = new THREE.Mesh(geometry, material); 
scene.add(sphere); 

var world = new CANNON.World();
world.gravity.set(0,-9.82,0);

var groundGeometry = new THREE.BoxGeometry(100 , 1, 100),
        groundMaterial = new THREE.MeshLambertMaterial( {color: 0xFFFFFF} );
    ground             = new THREE.Mesh( groundGeometry, groundMaterial );
    ground.receiveShadow = true;
scene.add(ground);

var mass = 5, radius = 1;
var sphereShape = new CANNON.Sphere(radius); 
var sphereBody = new CANNON.Body({mass: mass, shape: sphereShape}); 

world.add(sphereBody);
//world.add(ground);


function update() {
    sphere.position.copy(sphereBody.position);
    world.step(1/60);
};

function render() {
    requestAnimationFrame(update); 
    renderer.render(scene, camera); 
    
};

function SimLoop() {
    requestAnimationFrame(SimLoop);
    update();
    render();
};

SimLoop();