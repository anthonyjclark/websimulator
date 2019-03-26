// Simulation of a knee-joint using cannonjs and threejs

// three vars
var camera, scene, renderer, controls, spotLight;

//CONSTANTS
var MASS = 1,
    LEG_RADIUS = 0.4,
    LEG_HEIGHT = 2,
    TORSO_X = 4,
    TORSO_Y = 2,
    TORSO_Z = 8;
    

// cannon vars
var world, motor;
var fixedTimeStep = 1.0 / 60.0;
var maxSubSteps = 3;
var lastTime;

//Objects to store motors
var limbJointMotors = {},
    torsoLimbMotors = {},
    objects = {}; // three/cannon objs
   
var pos_of_obj = {
    "right-rear-leg": [2,2,-4],
    "right-front-leg": [2,2,4],
    "left-front-leg": [-2,2,-4],
    "left-rear-leg": [-2,2,4],
    "torso-left-rear": [-2,0,3.5],
    "torso-right-rear": [2,0,3.5],
    "torso-left-front": [-2,0,-3.5],
    "torso-right-front": [2,0,-3.5]
};

// Control vars
var motor_direction = {
    "right-rear-leg": "back",
    "right-front-leg": "back",
    "left-front-leg": "back",
    "left-rear-leg": "back",
    "torso-left-rear": "back",
    "torso-right-rear": "back",
    "torso-left-front":  "back",
    "torso-right-front": "back"
}
// UI
var is_paused = false;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function togglePlayPause() {
    is_paused = !is_paused;
}

function resetCamera() {
    controls.reset();
}

init();
animate();

function init() {
    initUI();
    initTHREE();
    initCANNON();
    addLegs();
    addTorso();
}

function initUI() {
    var pauseButton = document.getElementById("btn-play-pause");
    pauseButton.addEventListener("click", togglePlayPause, false);

    var resetCamButton = document.getElementById("btn-reset-camera");
    resetCamButton.addEventListener("click", resetCamera, false);
}

function initTHREE() {
    var width = window.innerWidth,
        height = window.innerHeight,
        fov = 65,
        near = 0.01,
        far = 500,
        default_camera_position = [-8, 8, 8];

    var canvasContainer = document.getElementById("canvas");

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    canvasContainer.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    // Camera and controls
    camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
    camera.position.set(...default_camera_position);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 50;
    // controls.update() must be called after any manual changes to the camera"s transform

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff));

    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(10, 30, 10);
    spotLight.angle = Math.PI / 4;

    spotLight.penumbra = 0.05;
    spotLight.decay = 2;

    spotLight.distance = 50;

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 50;
    spotLight.shadow.camera.fov = 30;

    scene.add(spotLight);

    // renderer.setClearColor( 0x0 );
    // lightHelper = new THREE.SpotLightHelper( spotLight );
    // scene.add( lightHelper );
    // shadowCameraHelper = new THREE.CameraHelper( spotLight.shadow.camera );
    // scene.add( shadowCameraHelper );

    // Create ground plane and ground grid
    var groundMaterial = new THREE.ShadowMaterial();

    // Rotate vertically and push beneath grid to prevent bleeding through
    var groundGeometry = new THREE.PlaneGeometry(far / 5, far / 5);
    groundGeometry.rotateX(-Math.PI / 2);
    groundGeometry.translate(0, -0.05, 0);

    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;

    scene.add(ground);

    var grid = new THREE.GridHelper(far / 5, far / 5);
    scene.add(grid);

    var axes = new THREE.AxesHelper(far / 15);
    axes.position.y = 0.05;
    scene.add(axes);

    window.addEventListener("resize", onWindowResize, false);
}

function initCANNON() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Create a plane (mass == 0 makes the body static)
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });

    // Rotate ground so that it is y-axis up (instead of z)
    groundBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(1, 0, 0),
        -Math.PI / 2
    );

    groundBody.addShape(groundShape);
    world.addBody(groundBody);
}

function createLeg(ulName, llName, LegPos, motorName) {

    // Upper leg (cylinder)
    var ul_name = ulName,
        ul_height = LEG_HEIGHT,
        ul_radius = LEG_RADIUS,
        ul_mass = MASS; 
        ul_position = [LegPos[0],LegPos[1]*2.1,LegPos[2]], 
        ul_color = 0xFFF550;

    addCylinder(ul_name, ul_radius, ul_height, ul_position, ul_mass, ul_color);

    // Lower leg (cylinder)
    var ll_name = llName,
        ll_height = LEG_HEIGHT,
        ll_radius = LEG_RADIUS - 0.1,
        ll_mass = MASS,
        ll_position = LegPos,
        ll_color = 0xFFFF00;

    addCylinder(ll_name, ll_radius, ll_height, ll_position, ll_mass, ll_color);

    addLegJoint(ul_name, ll_name, motorName);
}

function addCylinder(name, radius, height, position, mass, color) {
    // Create rendered object
    var geometry = new THREE.CylinderGeometry(radius, radius, height);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    scene.add(mesh);

    // Create the physics object
    var shape = new CANNON.Cylinder(radius, radius, height, 10);

    // Rotate cannon cylinder to match three cylinder
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    var t = new CANNON.Vec3(0, 0, 0);
    shape.transformAllPoints(t, q);

    var body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(...position)
    });

    body.addShape(shape);

    world.addBody(body);

    objects[name] = {
        mesh: mesh,
        body: body
    };
}

function addLegs(){
    var rruLeg = 'right-rear-leg-upper',
        rrlLeg = 'right-rear-leg-lower';
    
    createLeg(rruLeg, rrlLeg, pos_of_obj["right-rear-leg"], "right-rear-leg");

    var rfuLeg = 'right-front-leg-upper',
        rflLeg = 'right-front-leg-lower';

    createLeg(rfuLeg, rflLeg, pos_of_obj["right-front-leg"], "right-front-leg");

    var lruLeg = 'left-rear-leg-upper',
        lrlLeg = 'left-rear-leg-lower';

    createLeg(lruLeg, lrlLeg, pos_of_obj["left-rear-leg"], "left-rear-leg");

    var lfuLeg = 'left-front-leg-upper',
        lflLeg = 'left-front-leg-lower';

    createLeg(lfuLeg, lflLeg, pos_of_obj["left-front-leg"], "left-front-leg");

}

function addTorso(){

    var geometry = new THREE.BoxGeometry(TORSO_X - LEG_RADIUS * 2, TORSO_Y + 0.1, TORSO_Z + 1),
        material = new THREE.MeshStandardMaterial({ 
            color: 0xB5651D 
        }),
        mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    scene.add(mesh);

    var shape = new CANNON.Cylinder(1, 1, 4, 10);

    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(0, 0, 0), -Math.PI / 2);
    var t = new CANNON.Vec3(0, 0, 0);
    shape.transformAllPoints(t, q);

    var body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 4.2, 0)
    });

    body.addShape(shape);

    world.addBody(body);

    objects['torso'] = {
        mesh: mesh,
        body: body
    };

    addTorsoJoint('left-rear-leg-upper', 'torso-left-rear', pos_of_obj['torso-left-rear']);
    addTorsoJoint('right-rear-leg-upper', 'torso-right-rear', pos_of_obj['torso-right-rear']);
    addTorsoJoint('left-front-leg-upper', 'torso-left-front', pos_of_obj['torso-left-front']);
    addTorsoJoint('right-front-leg-upper', 'torso-right-front', pos_of_obj['torso-right-front']);

}

function addLegJoint(name1, name2, motorName) {
    motor = new CANNON.HingeConstraint(
        objects[name1].body,
        objects[name2].body,
        {
            pivotA: new CANNON.Vec3(0, -1, 0),
            axisA: new CANNON.Vec3(1, 0, 0),
            pivotB: new CANNON.Vec3(0, 1, 0)
            // axisB: new CANNON.Vec3(1, 0, 0)
        }
    );

    limbJointMotors[motorName] = motor;
    motor.enableMotor();
    motor.setMotorSpeed(1);
    motor.collideConnected = false;

    world.addConstraint(motor);
}

function addTorsoJoint(legName, motorName, position) {
    motor = new CANNON.HingeConstraint(
        objects['torso'].body,
        objects[legName].body,
        {
            pivotA: new CANNON.Vec3(position[0],position[1],position[2]),
             axisA: new CANNON.Vec3(position[0], 0, 0)
            //pivotB: new CANNON.Vec3(-2, 4.2, -4)
            // axisB: new CANNON.Vec3(1, 0, 0)
        }
    );

    torsoLimbMotors[motorName] = motor;
    motor.enableMotor();
    motor.setMotorSpeed(1);
    motor.collideConnected = false;

    world.addConstraint(motor);

    
}

function animate(time) {
    requestAnimationFrame(animate);
 
    if (!is_paused) {
        if (lastTime !== undefined) {
            var dt = (time - lastTime) / 1000;
            world.step(fixedTimeStep, dt, maxSubSteps);
        }
        lastTime = time;
    } else {
        lastTime = undefined;
    };

    // Update rendered transform of all objects
    for (var obj of Object.values(objects)) {
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
    };

    // // Angle between the two bodies of the motor

    for(var motor of Object.keys(limbJointMotors)){
        var upper_leg = objects[`${motor}-upper`],
            lower_leg = objects[`${motor}-lower`],
            rotation_upper = upper_leg.body.quaternion,
            rotation_lower = lower_leg.body.quaternion,
            z = rotation_upper.mult(rotation_lower.inverse())
            angle = 2 * Math.acos(z.w);
        
        if (motor_direction[motor] === "back" && angle > Math.PI/3) {
            limbJointMotors[motor].setMotorSpeed(-1);
            motor_direction[motor] = "forward";
        } else if (motor_direction[motor] === "forward" && angle < 0.1) {
            limbJointMotors[motor].setMotorSpeed(1);
            motor_direction[motor] = "back";
        }
    } 

    for(var motor of Object.keys(torsoLimbMotors)){
        var torso = objects[`torso`],
            upper_leg = objects[`${motor.substr(motor.indexOf('-')+1)}-leg-upper`],
            rotation_upper = torso.body.quaternion,
            rotation_lower = upper_leg.body.quaternion,
            z = rotation_upper.mult(rotation_lower.inverse())
            angle = 2 * Math.acos(z.w);
        
        if (motor_direction[motor] === "back" && angle > Math.PI/3) {
            torsoLimbMotors[motor].setMotorSpeed(-1);
            motor_direction[motor] = "forward";
        } else if (motor_direction[motor] === "forward" && angle < 0.1) {
            torsoLimbMotors[motor].setMotorSpeed(1);
            motor_direction[motor] = "back";
        }
    } 

    renderer.render(scene, camera);
}
    
   