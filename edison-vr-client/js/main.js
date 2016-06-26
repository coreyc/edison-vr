AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'YOUR_ID_HERE',
});

const sqs = new AWS.SQS();
const receiveParams = {
    QueueUrl: 'YOUR_QUEUE_URL_HERE',
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0
};

let lux,
    temp;

let scene,
    camera,
    renderer,
    element,
    container,
    effect,
    controls,
    clock,

    // Particles
    particles = new THREE.Object3D(),
    totalParticles = 50,
    maxParticleSize = 200,
    particleRotationSpeed = 10,
    particleRotationDeg = 0,
    lastColorRange = [0, 0.3],
    currentColorRange = [0, 0.3]

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.001, 700);
    camera.position.set(0, 15, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    element = renderer.domElement;
    renderer.setClearColor(0xfaafff, 0.75);

    container = document.getElementById('webglviewer');
    container.appendChild(element);

    effect = new THREE.StereoEffect(renderer);

    controls = new THREE.OrbitControls(camera, element);
    controls.target.set(
        camera.position.x + 0.15,
        camera.position.y,
        camera.position.z
    );
    controls.noPan = true;
    controls.noZoom = true;

    function setOrientationControls(e) {
        if (!e.alpha) {
            return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();

        element.addEventListener('click', fullscreen, false);

        window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);

    // Lighting
    const light = new THREE.PointLight(0x999999, 2, 100);
    light.position.set(20, 20, 20);
    scene.add(light);

    const lightScene = new THREE.PointLight(0x999999, 2, 100);
    lightScene.position.set(0, 5, 0);
    scene.add(lightScene);

    const ambLight = new THREE.AmbientLight(0x222222);
    scene.add(ambLight);

    const floorTexture = THREE.ImageUtils.loadTexture('textures/wood.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat = new THREE.Vector2(50, 50);
    floorTexture.anisotropy = renderer.getMaxAnisotropy();

    const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 20,
        shading: THREE.FlatShading,
        map: floorTexture
    });

    const geometry = new THREE.PlaneBufferGeometry(1000, 1000);

    const floor = new THREE.Mesh(geometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const particleTexture = THREE.ImageUtils.loadTexture('textures/particle.png'),
        spriteMaterial = new THREE.SpriteMaterial({
            map: particleTexture,
            color: 0xddffff
        });

    for (let i = 0; i < totalParticles; i++) {
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.scale.set(64, 64, 1.0);
        sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.75);
        sprite.position.setLength(maxParticleSize * Math.random());

        sprite.material.blending = THREE.AdditiveBlending;

        particles.add(sprite);
    }
    particles.position.y = 70;
    scene.add(particles);

    clock = new THREE.Clock();

    animate();
}

init();

function animate() {
    let elapsedSeconds = clock.getElapsedTime(),
        particleRotationDirection = particleRotationDeg <= 180 ? -1 : 1;

    particles.rotation.y = lux * particleRotationDirection;

    for (let i = 0; i < totalParticles; i++) {
        particles.children[i].material.color.setHSL(currentColorRange[0], currentColorRange[1], (Math.random() * (0.7 - 0.2) + 0.2));
    }

    particles.position.y = lux + 80;

    requestAnimationFrame(animate);

    update(clock.getDelta());
    render(clock.getDelta());
}

function resize() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    effect.setSize(width, height);
}

function update(dt) {
    resize();

    camera.updateProjectionMatrix();

    controls.update(dt);
}

function render(dt) {
    effect.render(scene, camera);
}

function fullscreen() {
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    }
}

function getURL(url, callback) {
    const xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                callback(JSON.parse(xmlhttp.responseText));
            } else {
                console.log('We had an error, status code: ', xmlhttp.status);
            }
        }
    }

    xmlhttp.open('GET', url, true);
    xmlhttp.send();
}

function getSensorData() {
    setInterval(() => {
        getData();
    }, 500);
}

getSensorData();

function getData() {
    sqs.receiveMessage(receiveParams, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            if (data.Messages[0]) {
                lux = JSON.parse(data.Messages[0].Body).state.reported.lux;
                console.log(lux);
                temp = JSON.parse(data.Messages[0].Body).state.reported.temp;
                console.log(temp);
            }
        }
    });
}
