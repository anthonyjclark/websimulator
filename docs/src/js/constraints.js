import * as THREE from 'three';
import * as CANNON from 'cannon';
import 'three-orbitcontrols';

var world, timeStep=1/60, scene, renderer, camera, rightRearWheel, leftRearWheel, rightFrontWheel, leftFrontWheel,
    rightRearWheelBody,leftRearWheelBody, rightFrontWheelBody, leftFrontWheelBody, sphereShape, groundShape, groundMaterial,
    sphereMaterial,rearAxleMaterial, frontAxleMaterial, ground, groundBody, groundShape, rearAxleShape, rearAxle, rearAxleBody, 
    frontAxleShape, frontAxle, frontAxleBody, totaltime=0;




// CONSTANTS
var MASS = 5,
    WIDTH = 50,
    LENGTH = 200,
    HEIGHT = 1,
    RADIUS = 5,
    PLAY = true;

//BUTTONS - NEED TO MOVE TO HYPERAPP ACTIONS(?)
document.querySelector('#pauseBtn').addEventListener('click',()=>{
    PLAY = false;
    console.log(document.querySelector('#pauseBtn').innerHTML);
    console.log('pause Accessed');
});
document.querySelector('#playBtn').addEventListener('click', ()=>{
    PLAY=true;
    console.log(document.querySelector('#playBtn').innerHTML)
    console.log('play Accessed');
});
document.querySelector('#trialBtn').addEventListener('click', ()=>{
    console.log('button works!');
});


initThree();
initCannon();
animate();
 
function initCannon() {
    
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();

    sphereShape = new CANNON.Sphere(RADIUS);
    rearAxleShape = new CANNON.Box(new CANNON.Vec3(5,2,0.5));
    // frontAxleShape = new CANNON.Box(new CANNON.Vec3(5,2,0.5));
    groundShape = new CANNON.Plane();
    groundMaterial = new CANNON.Material();
    // frontAxleMaterial = new CANNON.Material();
    rearAxleMaterial = new CANNON.Material();
    sphereMaterial = new CANNON.Material();

    rightRearWheelBody = new CANNON.Body({
        mass: MASS,
        material: sphereMaterial,
        position: new CANNON.Vec3(-RADIUS*3, 10,0)
    });

    leftRearWheelBody = new CANNON.Body({
        mass: MASS,
        material: sphereMaterial,
        position: new CANNON.Vec3(RADIUS*3, 10, 0)
    });

    rightFrontWheelBody = new CANNON.Body({
        mass: MASS,
        material: sphereMaterial,
        position: new CANNON.Vec3(-RADIUS*3, 10, 30)
    });

    leftFrontWheelBody = new CANNON.Body({
        mass: MASS,
        material: sphereMaterial,
        position: new CANNON.Vec3(RADIUS*3, 10, 30)
    });

    rearAxleBody = new CANNON.Body({ 
        mass: MASS, 
        material: rearAxleMaterial,
        position: new CANNON.Vec3(0,10,0)
    });
    
    // frontAxleBody = new CANNON.Body({ 
    //     mass: MASS, 
    //     material: frontAxleMaterial,
    //     position: new CANNON.Vec3(0,10,30)
    // });

    groundBody = new CANNON.Body({
        mass: 0, 
        material: groundMaterial
        });

    rightRearWheelBody.linearDamping= 0;
    leftRearWheelBody.linearDamping= 0;
    rightFrontWheelBody.linearDamping= 0;
    leftFrontWheelBody.linearDamping= 0;

    groundBody.addShape(groundShape);
    rightRearWheelBody.addShape(sphereShape);
    leftRearWheelBody.addShape(sphereShape);
    rightFrontWheelBody.addShape(sphereShape);
    leftFrontWheelBody.addShape(sphereShape);
    rearAxleBody.addShape(rearAxleShape);
    //frontAxleBody.addShape(frontAxleShape);

    //Copy the ground quaternion to so that axle(s) are always parallel to the ground
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2.5);
    rearAxleBody.quaternion.copy(groundBody.quaternion);
    //frontAxleBody.quaternion.copy(groundBody.quaternion);

    var contactMaterial1 = new CANNON.ContactMaterial(groundMaterial, sphereMaterial, { 
        friction: 1.0, 
        restitution: 0.0
    });

    world.addContactMaterial(contactMaterial1);

    var rightRear_axle = new CANNON.DistanceConstraint(rightRearWheelBody, rearAxleBody, 10);
    var leftRear_axle = new CANNON.DistanceConstraint(leftRearWheelBody, rearAxleBody, 10);

    // var rightFront_axle = new CANNON.DistanceConstraint(rightFrontWheelBody, frontAxleBody, 10);
    // var leftFront_axle = new CANNON.DistanceConstraint(leftFrontWheelBody, frontAxleBody, 10);

    
    world.addConstraint(rightRear_axle);
    world.addConstraint(leftRear_axle);
    // world.addConstraint(rightFront_axle);
    // world.addConstraint(leftFront_axle);

    world.gravity.set(0,-10,0);
    world.addBody(groundBody);
    world.addBody(rightRearWheelBody);
    world.addBody(leftRearWheelBody);
    world.addBody(rightFrontWheelBody);
    world.addBody(leftFrontWheelBody);
    world.addBody(rearAxleBody);
    // world.addBody(frontAxleBody);
}

function initThree(){

    // INITIALIZE CANVAS
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    var light = new THREE.AmbientLight( 0x404040 ),
        directionalLight = new THREE.DirectionalLight( 0xffffff );

    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.setClearColor( 0xadd8e6 );
    document.body.appendChild( renderer.domElement );
    camera.position.set(1,25,100); // camera position to x , y , z
    camera.lookAt(new THREE.Vector3());

    window.addEventListener('resize', function(){
        var width = window.innerWidth;
        var height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width/height;
        //camera.UpdateProjectionMatrix();
    });

    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();

    // INITIAL CANVAS
    scene.add(directionalLight);  
    scene.add(light);
    scene.add(camera);

    var sphereTexture = new THREE.TextureLoader().load('./img/sphere/sphereTexture.png');

    var rightRearWheelGeometry = new THREE.SphereGeometry(RADIUS,64,64),
        rightRearWheelMaterial = new THREE.MeshLambertMaterial({
            color: 0x000000, 
            //envMap: sphereTexture,
        });

    var leftRearWheelGeometry = new THREE.SphereGeometry(RADIUS,64,64),
        leftRearWheelMaterial = new THREE.MeshLambertMaterial({
            color: 0x000FFF, 
            //envMap: sphereTexture,
        });
    
    var rightFrontWheelGeometry = new THREE.SphereGeometry(RADIUS,64,64),
        rightFrontWheelMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFF550, 
            //envMap: sphereTexture,
        });

    var leftFrontWheelGeometry = new THREE.SphereGeometry(RADIUS,64,64),
        leftFrontWheelMaterial = new THREE.MeshLambertMaterial({
            color: 0xFF0000, 
            //envMap: sphereTexture,
        });
    
    var rearAxleGeometry = new THREE.BoxGeometry(RADIUS*6-10,1,1),
        rearAxleMaterial = new THREE.MeshLambertMaterial({
            color: 0x000000
        });
    // var frontAxleGeometry = new THREE.BoxGeometry(RADIUS*6-10,1,1),
    //     frontAxleMaterial = new THREE.MeshLambertMaterial({
    //         color: 0x000000
    //     })    

    var groundGeometry = new THREE.BoxGeometry(WIDTH, LENGTH, HEIGHT),
        groundMaterial = new THREE.MeshLambertMaterial({
            color: 0x90EE90
        });
        
    rightRearWheel = new THREE.Mesh(rightRearWheelGeometry, rightRearWheelMaterial); 
    leftRearWheel = new THREE.Mesh(leftRearWheelGeometry, leftRearWheelMaterial); 
    rightFrontWheel = new THREE.Mesh(rightFrontWheelGeometry, rightFrontWheelMaterial); 
    leftFrontWheel = new THREE.Mesh(leftFrontWheelGeometry, leftFrontWheelMaterial); 
    rearAxle = new THREE.Mesh(rearAxleGeometry, rearAxleMaterial);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    //frontAxle = new THREE.Mesh(frontAxleGeometry, frontAxleMaterial);


    ground.receiveShadow = true;

    // ADD OBJECTS TO SCENE
    scene.add(rightRearWheel);
    scene.add(leftRearWheel);
    scene.add(rightFrontWheel);
    scene.add(leftFrontWheel);
    scene.add(rearAxle);
    // scene.add(frontAxle);
    scene.add(ground);
}    

function animate() {
    requestAnimationFrame(animate);
    if(PLAY){ 
        updatePhysics();
    }
    render();
}

function updatePhysics() {

    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    rightRearWheel.position.copy(rightRearWheelBody.position);
    rightRearWheel.quaternion.copy(rightRearWheelBody.quaternion);

    leftRearWheel.position.copy(leftRearWheelBody.position);
    leftRearWheel.quaternion.copy(leftRearWheelBody.quaternion);

    rightFrontWheel.position.copy(rightFrontWheelBody.position);
    rightFrontWheel.quaternion.copy(rightFrontWheelBody.quaternion);

    leftFrontWheel.position.copy(leftFrontWheelBody.position);
    leftFrontWheel.quaternion.copy(leftFrontWheelBody.quaternion);

    rearAxle.position.copy(rearAxleBody.position);
    rearAxle.quaternion.copy(rearAxleBody.quaternion);

    // frontAxle.position.copy(frontAxleBody.position);
    // frontAxle.quaternion.copy(frontAxleBody.quaternion);

    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);
}

function render() {
    renderer.render( scene, camera );
}