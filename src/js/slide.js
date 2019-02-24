import * as THREE from 'three';
import * as CANNON from 'cannon';

var world, timeStep=1/30, scene, renderer, camera, sphere, 
    sphereBody, sphereShape, groundShape, groundMaterial, 
    ground, groundBody, groundShape,totaltime=0;

// CONSTANTS
var GRID_HELPER_SIZE = 40,
    GRID_HELPER_STEP = 2,
    MASS = 5,
    RADIUS = 5;

initThree();
initCannon();
animate();

function initCannon() {
    
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();

    sphereShape = new CANNON.Sphere();
    sphereBody  = new CANNON.Body({
        mass: MASS,
        material: groundMaterial
    });

    groundShape = new CANNON.Plane();
    groundMaterial = new CANNON.Material();
    groundBody = new CANNON.Body({
        mass: 0, 
        material: groundMaterial
    });

    world.gravity.set(0,-10,0);

    groundBody.addShape(groundShape);
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0,100,0)
    sphereBody.linearDamping= 0;

    world.addBody(groundBody);
    world.addBody(sphereBody);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,1,0),-Math.PI/6);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/6);



    var contactMaterial = new CANNON.ContactMaterial(groundMaterial, groundBody, { 
        friction: 0.0, 
        restitution: 1.0 
    });

    world.addContactMaterial(contactMaterial);
}

function initThree(){

    // INITIALIZE CANVAS
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var light = new THREE.AmbientLight( 0x404040 ),
        directionalLight = new THREE.DirectionalLight( 0xffffff ),
        gridHelper = new THREE.GridHelper( GRID_HELPER_SIZE, GRID_HELPER_STEP );

    renderer.setSize( window.innerWidth - 100 , window.innerHeight - 100 );
    renderer.setClearColor( 0xadd8e6 );
    document.body.appendChild( renderer.domElement );
    camera.position.set(1,25,100); // camera position to x , y , z
    camera.lookAt(new THREE.Vector3())
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();

    // INITIAL CANVAS
    scene.add(directionalLight);  
    scene.add(light);
    scene.add(camera);
    scene.add(gridHelper);

    var sphereGeometry = new THREE.SphereGeometry(RADIUS,16,16),
        sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFF550, 
            wireframe: true
        }),
        groundGeometry = new THREE.BoxGeometry(50, 200, 1),
        groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x654321
        });

    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial); 
    ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.receiveShadow = true;

    // ADD OBJECTS TO SCENE
    scene.add(sphere);
    scene.add(ground);
}    

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    render();
}
function updatePhysics() {

    // Step the physics world
    world.step(timeStep);
    totaltime+=timeStep;

    if(totaltime < 5){
        console.log(`${sphere.position.x},${sphere.position.y},${sphere.position.z}` );
    }

    // Copy coordinates from Cannon.js to Three.js
    sphere.position.copy(sphereBody.position);
    sphere.quaternion.copy(sphereBody.quaternion);

    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);
}

function render() {
    renderer.render( scene, camera );
}