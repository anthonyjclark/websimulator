import * as THREE from 'three';
import * as CANNON from 'cannon';

var world, timeStep=1/10, scene, renderer, camera, sphere,
      sphereBody, sphereShape, groundShape,
      ground, groundBody, groundShape,totaltime=0;
  // CONSTANTS
  var GRID_HELPER_SIZE = 40,
      GRID_HELPER_STEP = 2,
      MASS             = 0.5;

  initThree();
  initCannon();
  animate();

  function initCannon() {
    world                   = new CANNON.World();
    world.broadphase        = new CANNON.NaiveBroadphase();
    sphereShape             = new CANNON.Sphere();
    groundShape             = new CANNON.Plane();

    sphereBody              = new CANNON.Body({
                                    mass: MASS,
                                  });
    groundBody              = new CANNON.Body({
                                    mass: 0, // mass == 0 makes the body static
                                  });

    world.solver.iterations = 10;
    world.gravity.set(0,-9.8,0);
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0,500,0)
    sphereBody.linearDamping= 0;
    world.addBody(sphereBody);

    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(groundBody);

    var ballContact         = new CANNON.ContactMaterial( groundBody, sphereBody, {
    //     friction: 0,
    //     restitution: 1 
    });

    world.addContactMaterial(ballContact);
  }

  function initThree(){
    // INITIALIZE CANVAS
    scene                 = new THREE.Scene();
    renderer              = new THREE.WebGLRenderer();
    camera                = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    var light             = new THREE.AmbientLight( 0x404040 ),
        directionalLight  = new THREE.DirectionalLight( 0xffffff ),
        gridHelper        = new THREE.GridHelper( GRID_HELPER_SIZE, GRID_HELPER_STEP );

    renderer.setSize( window.innerWidth - 100 , window.innerHeight - 100 );
    renderer.setClearColor( 0xadd8e6 );
    document.body.appendChild( renderer.domElement );
    camera.position.set(1,25,100); // camera position to x , y , z
    camera.lookAt( new THREE.Vector3() )
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();

    // INITIAL CANVAS
    scene.add( directionalLight );  
    scene.add( light );
    scene.add( camera );
    scene.add( gridHelper );

    var geometry = new THREE.SphereGeometry( 15, 16, 16 ),
        material = new THREE.MeshBasicMaterial({color: 0xFFF550, wireframe: true}); 
    sphere       = new THREE.Mesh(geometry, material); 
    

    var groundGeometry = new THREE.BoxGeometry(100 , 1, 100),
        groundMaterial = new THREE.MeshLambertMaterial( {color: 0x654321} );
    //groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    ground             = new THREE.Mesh( groundGeometry, groundMaterial );
    ground.receiveShadow = true;

    // ADD OBJECTS TO SCENE
    scene.add(sphere);
    scene.add( ground );
  }    

  function animate() {
      requestAnimationFrame( animate );
      updatePhysics();
         render();
  }
  function updatePhysics() {
    // Step the physics world
    world.step(timeStep);
    totaltime+=timeStep;
    if(totaltime < 2){
        // console.log(totaltime+","sphere.position.x,",",sphere.position.y,',', sphere.position.z);
        console.log(`,${totaltime},${sphere.position.x},${sphere.position.y},${sphere.position.z}` );
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