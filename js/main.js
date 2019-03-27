// Physical constants
var DENSITY = 500,
    UPPER_LEG_RADIUS = 0.3,
    UPPER_LEG_HEIGHT = 1.5,
    UPPER_LEG_COLOR = "blue",
    LOWER_LEG_RADIUS = 0.2,
    LOWER_LEG_HEIGHT = 2,
    LOWER_LEG_COLOR = "green",
    TORSO_X = 4,
    TORSO_Y = 0.75,
    TORSO_Z = 2,
    TORSO_COLOR = "gray";

// three vars
var camera, scene, renderer, controls, spotLight;

// cannon vars
var world;

var fixedTimeStep = 1.0 / 60.0,
    maxSubSteps = 3,
    lastTime;

// three/cannon objs
var objects = {};

// Joint control
var motors = {};

// UI
var isPaused = false;

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function togglePlayPause() {
    isPaused = !isPaused;
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
    initCat();
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
        defaultCameraPosition = [-8, 8, 8];

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
    camera.position.set(...defaultCameraPosition);

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

    // Helper methods for viewing the spotlight projection
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

function initCat() {
    // Create the main torso
    var pos = [0, UPPER_LEG_HEIGHT * 2, 0];
    var mass = DENSITY * TORSO_X * TORSO_Y * TORSO_Z;
    var torsoName = "torso";

    addBox(torsoName, TORSO_X, TORSO_Y, TORSO_Z, pos, mass, TORSO_COLOR);

    // Create the legs
    createLeg(torsoName, "front", "left");
    createLeg(torsoName, "front", "right");
    createLeg(torsoName, "back", "left");
    createLeg(torsoName, "back", "right");

    // Setup motors
    setupMotors();
}

function createLeg(parent, frontback, leftright) {
    var fb = frontback === "front" ? 1 : -1;
    var lr = leftright === "right" ? 1 : -1;

    // Upper leg body
    var ulName = `${frontback}-${leftright}-upper-leg`;

    var ulPos = [
        (TORSO_X / 2 - UPPER_LEG_RADIUS) * fb,
        UPPER_LEG_HEIGHT * 1.5,
        (TORSO_Z / 2 + UPPER_LEG_RADIUS) * lr
    ];
    var ulMass =
        DENSITY *
        Math.PI *
        UPPER_LEG_RADIUS *
        UPPER_LEG_RADIUS *
        UPPER_LEG_HEIGHT;

    addCylinder(
        ulName,
        UPPER_LEG_RADIUS,
        UPPER_LEG_HEIGHT,
        ulPos,
        ulMass,
        UPPER_LEG_COLOR
    );

    // Upper leg joint to torso
    var ulPivot = [0, UPPER_LEG_HEIGHT / 2, 0];
    var ulAxis = [0, 0, 1];
    var torsoPivot = [ulPos[0], 0, ulPos[2]];
    var torsoAxis = [0, 0, 1];
    var mName = `${ulName}-motor`;
    addHinge(parent, ulName, torsoPivot, ulPivot, torsoAxis, ulAxis, mName);
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

    // Add cylinder to global list of objects
    objects[name] = {
        mesh: mesh,
        body: body
    };
}

function addBox(name, xsize, ysize, zsize, position, mass, color) {
    // Create rendered object
    var geometry = new THREE.BoxGeometry(xsize, ysize, zsize);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    scene.add(mesh);

    // Create the physics object
    var shape = new CANNON.Box(
        new CANNON.Vec3(xsize / 2, ysize / 2, zsize / 2)
    );

    var body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(...position)
    });

    body.addShape(shape);

    world.addBody(body);

    // Add box to global list of objects
    objects[name] = {
        mesh: mesh,
        body: body
    };
}

function addHinge(name1, name2, piv1, piv2, ax1, ax2, motorName) {
    var motor = new CANNON.HingeConstraint(
        objects[name1].body,
        objects[name2].body,
        {
            pivotA: new CANNON.Vec3(...piv1),
            axisA: new CANNON.Vec3(...ax1),
            pivotB: new CANNON.Vec3(...piv2),
            axisB: new CANNON.Vec3(...ax2)
        }
    );

    motors[motorName] = {
        name: motorName,
        servo: motor,
        speed: 1,
        angle: 0,
        hi: Math.PI / 3,
        lo: 0.1,
        state: "back",
        body1: objects[name1].body,
        body2: objects[name2].body
    };

    // Move this
    motor.setMotorSpeed(1);

    motor.enableMotor();
    motor.collideConnected = false;

    world.addConstraint(motor);
}

function setupMotors() {
    // Setup motor angles, speeds, etc.
    // This is just hard-coded in addHinge for now
}

var temp = true;
function animate(time) {
    requestAnimationFrame(animate);

    if (!isPaused) {
        if (lastTime !== undefined) {
            var dt = (time - lastTime) / 1000;
            world.step(fixedTimeStep, dt, maxSubSteps);
        }
        lastTime = time;
    } else {
        lastTime = undefined;
    }

    // Update rendered transform of all objects
    for (var obj of Object.values(objects)) {
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
    }

    // Actuate motors
    for (var mtr of Object.values(motors)) {
        var rot1 = mtr.body1.quaternion;
        var rot2 = mtr.body2.quaternion;
        mtr.angle = 2* Math.acos(rot1.mult(rot2.inverse()).w)

        if (mtr.state === "back" && mtr.angle > mtr.hi) {
            mtr.servo.setMotorSpeed(-mtr.speed);
            mtr.state = "forward";
        } else if (mtr.state === "forward" && mtr.angle < mtr.lo) {
            mtr.servo.setMotorSpeed(mtr.speed);
            mtr.state = "back";
        }
    }

    renderer.render(scene, camera);
}
