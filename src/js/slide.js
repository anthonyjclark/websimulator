import * as THREE from 'three';
import * as CANNON from 'cannon';

var world, timeStep=1/30, scene, renderer, camera, sphere1, sphere2, sphere3,
    sphereBody1, sphereBody2, sphereBody3, sphereShape, groundShape, groundMaterial,
    mat1,mat2,mat3,ground, groundBody, groundShape,totaltime=0;

// CONSTANTS
var GRID_HELPER_SIZE = 40,
    GRID_HELPER_STEP = 2,
    MASS = 5,
    WIDTH=50,
    LENGTH=200,
    HEIGHT=1,
    RADIUS = 5;

initThree();
initCannon();
animate();

function initCannon() {
    
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();

    sphereShape = new CANNON.Sphere(RADIUS);
    groundShape = new CANNON.Plane();
    groundMaterial = new CANNON.Material();
    mat1 = new CANNON.Material();
    mat2 = new CANNON.Material();
    mat3 = new CANNON.Material();
    
    sphereBody1 = new CANNON.Body({
        mass: MASS,
        material: mat1,
        position: new CANNON.Vec3(RADIUS*3, 100, -LENGTH/2+RADIUS+1)
    });

    sphereBody2 = new CANNON.Body({
        mass: MASS,
        material: mat2,
        position: new CANNON.Vec3(0,100,-100+RADIUS+1)
    });

    sphereBody3 = new CANNON.Body({
        mass: MASS,
        material: mat3,
        position: new CANNON.Vec3(-RADIUS*3, 100, -LENGTH/2+RADIUS+1)
    });

    groundBody = new CANNON.Body({
        mass: 0, 
        material: groundMaterial
        });

    world.gravity.set(0,-10,0);

    groundBody.addShape(groundShape);
    sphereBody1.addShape(sphereShape);
    sphereBody2.addShape(sphereShape);
    sphereBody3.addShape(sphereShape);

    sphereBody1.linearDamping= 0;
    sphereBody2.linearDamping= 0;
    sphereBody3.linearDamping= 0;

    world.addBody(groundBody);
    world.addBody(sphereBody1);
    world.addBody(sphereBody2);
    world.addBody(sphereBody3);

    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/3);
    //groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);

    var contactMaterial1 = new CANNON.ContactMaterial(groundMaterial, mat1, { 
        friction: 1.0, 
        restitution: 0.1
    });
    var contactMaterial2 = new CANNON.ContactMaterial(groundMaterial, mat2, { 
        friction: 1.0, 
        restitution: 1.0
    });
    var contactMaterial3 = new CANNON.ContactMaterial(groundMaterial, mat3, { 
        friction: 1.0, 
        restitution: 0.5
    });

    world.addContactMaterial(contactMaterial1);
    world.addContactMaterial(contactMaterial2);
    world.addContactMaterial(contactMaterial3);
}

function initThree(){

    // INITIALIZE CANVAS
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var light = new THREE.AmbientLight( 0x404040 ),
        directionalLight = new THREE.DirectionalLight( 0xffffff );


    //var gridHelper = new THREE.GridHelper( GRID_HELPER_SIZE, GRID_HELPER_STEP );

    renderer.setSize( window.innerWidth - 100 , window.innerHeight - 100 );
    renderer.setClearColor( 0xadd8e6 );
    document.body.appendChild( renderer.domElement );
    camera.position.set(1,25,100); // camera position to x , y , z
    camera.lookAt(new THREE.Vector3())

    window.addEventListener('resize', function(){
        var width = window.innerWidth;
        var height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width/height;
        camera.UpdateProjectionMatrix();
    });
    
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();

    // INITIAL CANVAS
    scene.add(directionalLight);  
    scene.add(light);
    scene.add(camera);

    //scene.add(gridHelper);

    var sphere1Geometry = new THREE.SphereGeometry(RADIUS,16,16),
        sphere1Material = new THREE.MeshBasicMaterial({
            color: 0xFF0000, 
            wireframe: true
        });
    var sphere2Geometry = new THREE.SphereGeometry(RADIUS,16,16),
        sphere2Material = new THREE.MeshBasicMaterial({
            color: 0x0000FF, 
            wireframe: true
        });
    var sphere3Geometry = new THREE.SphereGeometry(RADIUS,16,16),
        sphere3Material = new THREE.MeshBasicMaterial({
            color: 0xFFF550, 
            wireframe: true
        }),
        groundGeometry = new THREE.BoxGeometry(WIDTH, LENGTH, HEIGHT),
        groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x90ee90
        });
        
    sphere1 = new THREE.Mesh(sphere1Geometry, sphere1Material); 
    sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material); 
    sphere3 = new THREE.Mesh(sphere3Geometry, sphere3Material); 
    ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.receiveShadow = true;

    // ADD OBJECTS TO SCENE
    scene.add(sphere1);
    scene.add(sphere2);
    scene.add(sphere3);
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

    // totaltime+=timeStep;
    // if(totaltime < 5){
    //     console.log(`${sphere.position.x},${sphere.position.y},${sphere.position.z}` );
    // }

    // Copy coordinates from Cannon.js to Three.js
    sphere1.position.copy(sphereBody1.position);
    sphere1.quaternion.copy(sphereBody1.quaternion);

    sphere2.position.copy(sphereBody2.position);
    sphere2.quaternion.copy(sphereBody2.quaternion);

    sphere3.position.copy(sphereBody3.position);
    sphere3.quaternion.copy(sphereBody3.quaternion);
    
    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);
}

function render() {
    renderer.render( scene, camera );
}