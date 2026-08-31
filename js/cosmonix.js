import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// ============================================================
// COSMONIX 26 — UNIFIED CEREMONY
// Replaces BOTH space.js and launch-sequence.js.
// ============================================================

const mount = document.getElementById('cosmonix-scene');
const launchUI = document.getElementById('launch-ui');
const launchStatus = document.getElementById('launch-status');
const countdownDisplay = document.getElementById('countdown-display');
const initiateButton = document.getElementById('initiate-sequence');
const finalReveal = document.getElementById('final-reveal');
const launchMusic = document.getElementById('launch-music');

const params = new URLSearchParams(window.location.search);
const launchWasSeen = sessionStorage.getItem('cosmonixLaunchSeen') === 'true';
const skipLaunch = params.get('skipLaunch') === 'true' || launchWasSeen;

if (!mount) throw new Error('COSMONIX: #cosmonix-scene not found.');

// ============================================================
// 1. SCENE / CAMERA / RENDERER
// ============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010305);
scene.fog = new THREE.FogExp2(0x010305, 0.012);

const camera = new THREE.PerspectiveCamera(
    34,
    window.innerWidth / window.innerHeight,
    0.1,
    700
);

const cameraTarget = new THREE.Vector3(0, 7, 0);
camera.position.set(17, 8, 28);
camera.lookAt(cameraTarget);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.appendChild(renderer.domElement);

// ============================================================
// 2. LIGHTING
// ============================================================

const ambient = new THREE.AmbientLight(0x9bc8df, 2.8);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xd7f5ff, 6.5);
keyLight.position.set(-8, 6, 11);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x16dfff, 55, 34, 2);
rimLight.position.set(6, -2, 5);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x438fff, 24, 22, 2);
fillLight.position.set(1, 3, 8);
scene.add(fillLight);

const launchGlow = new THREE.PointLight(0x16dfff, 45, 30, 2);
launchGlow.position.set(0, 2, 8);
scene.add(launchGlow);

const engineAreaLight = new THREE.PointLight(0xffa25a, 0, 22, 2);
engineAreaLight.position.set(0, 1, 1);
scene.add(engineAreaLight);

// ============================================================
// 3. STARS
// ============================================================

const starGeometry = new THREE.BufferGeometry();
const starCount = window.innerWidth < 700 ? 850 : 1800;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    const radius = 38 + Math.random() * 125;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i3 + 1] = radius * Math.cos(phi);
    starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xdcefff,
    size: 0.052,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// ============================================================
// 4. ABSTRACT BLOCK PLANET
// Based on the existing space.js configuration.
// ============================================================

const earthGroup = new THREE.Group();
const orbitGroup = new THREE.Group();
scene.add(earthGroup);
scene.add(orbitGroup);

const earthRadius = 3.55;
const cubeSize = 0.205;
const latSteps = 48;
const lonSteps = 96;
const maxBlocks = (latSteps - 1) * lonSteps;

const blockGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const blockMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.68,
    metalness: 0.06,
    vertexColors: true
});

const earthBlocks = new THREE.InstancedMesh(blockGeometry, blockMaterial, maxBlocks);
earthBlocks.frustumCulled = false;
earthGroup.add(earthBlocks);

const deepBlue = new THREE.Color(0x06345a);
const midBlue = new THREE.Color(0x0878ad);
const brightBlue = new THREE.Color(0x18bfe8);
const cyanBlue = new THREE.Color(0x53e7ff);
const tempColor = new THREE.Color();
const dummy = new THREE.Object3D();

let blockIndex = 0;

for (let y = 1; y < latSteps; y++) {
    const v = y / latSteps;
    const lat = Math.PI * (0.5 - v);
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);

    for (let x = 0; x < lonSteps; x++) {
        const u = x / lonSteps;
        const lon = u * Math.PI * 2 - Math.PI;
        const jitter = (Math.random() - 0.5) * 0.025;
        const r = earthRadius + jitter;

        dummy.position.set(
            r * cosLat * Math.cos(lon),
            r * sinLat,
            r * cosLat * Math.sin(lon)
        );

        dummy.rotation.set(
            -lat + Math.PI / 2,
            lon + Math.PI / 2,
            0
        );

        dummy.updateMatrix();
        earthBlocks.setMatrixAt(blockIndex, dummy.matrix);

        const brightness = Math.random();
        if (brightness > 0.90) tempColor.copy(cyanBlue);
        else if (brightness > 0.67) tempColor.copy(brightBlue);
        else if (brightness > 0.25) tempColor.copy(midBlue);
        else tempColor.copy(deepBlue);

        earthBlocks.setColorAt(blockIndex, tempColor);
        blockIndex++;
    }
}

earthBlocks.count = blockIndex;
earthBlocks.instanceMatrix.needsUpdate = true;
earthBlocks.instanceColor.needsUpdate = true;

const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius + 0.18, 48, 48),
    new THREE.MeshBasicMaterial({
        color: 0x43ddff,
        transparent: true,
        opacity: 0.055,
        side: THREE.BackSide
    })
);
earthGroup.add(atmosphere);

const atmosphereRing = new THREE.Mesh(
    new THREE.TorusGeometry(earthRadius + 0.17, 0.012, 8, 180),
    new THREE.MeshBasicMaterial({
        color: 0x5ceaff,
        transparent: true,
        opacity: 0.32
    })
);
atmosphereRing.rotation.x = Math.PI / 2.3;
earthGroup.add(atmosphereRing);

// ============================================================
// 5. EVENT MOONS / ORBITS
// ============================================================

const eventData = [
    { name:'ROCKETRY', radius:6.0, speed:0.19, phase:0.4, tilt:0.18, color:0x52e7ff, size:0.34 },
    { name:'CAD', radius:5.65, speed:-0.25, phase:2.1, tilt:-0.20, color:0x76a7ff, size:0.28 },
    { name:'RC PLANE', radius:6.25, speed:0.15, phase:3.7, tilt:0.30, color:0xb2ffdc, size:0.31 },
    { name:'FLIGHT SIM', radius:5.75, speed:-0.21, phase:4.8, tilt:0.42, color:0x63c8ff, size:0.27 },
    { name:'TRIQUEST', radius:6.15, speed:0.13, phase:5.65, tilt:-0.38, color:0x8bffcb, size:0.30 },
    { name:'QUIZ', radius:5.85, speed:-0.17, phase:1.15, tilt:-0.48, color:0xc2d8ff, size:0.25 }
];

function makeOrbit(radiusValue, tilt, opacity = 0.09) {
    const verticalScale = 0.88;
    const curve = new THREE.EllipseCurve(
        0, 0,
        radiusValue,
        radiusValue * verticalScale,
        0,
        Math.PI * 2,
        false,
        0
    );

    const points = curve.getPoints(220).map(
        point => new THREE.Vector3(point.x, 0, point.y)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x9adfff,
        transparent: true,
        opacity
    });

    const line = new THREE.LineLoop(geometry, material);
    line.rotation.x = tilt;
    return line;
}

const eventObjects = [];

for (const data of eventData) {
    const orbitLine = makeOrbit(data.radius, data.tilt, 0);
    orbitGroup.add(orbitLine);

    const group = new THREE.Group();
    const planet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(data.size, 2),
        new THREE.MeshStandardMaterial({
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.62,
            roughness: 0.3,
            metalness: 0.18
        })
    );
    group.add(planet);

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(data.size * 1.75, 16, 16),
        new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.045
        })
    );
    group.add(glow);
    group.scale.setScalar(0);
    orbitGroup.add(group);

    eventObjects.push({
        data,
        group,
        planet,
        orbitLine,
        deployStartLocal: new THREE.Vector3(),
        deployTargetAngle: data.phase
    });
}

const CEREMONY_PLANET_POSITION = new THREE.Vector3(22, 58, -54);
earthGroup.position.copy(CEREMONY_PLANET_POSITION);
orbitGroup.position.copy(CEREMONY_PLANET_POSITION);
earthGroup.rotation.z = THREE.MathUtils.degToRad(-8);

// ============================================================
// 6. LAUNCH PAD
// ============================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({
        color: 0x02070a,
        roughness: 0.9,
        metalness: 0.15,
        transparent: true,
        opacity: 1
    })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.03;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(80, 80, 0x08748c, 0x062832);
grid.position.y = 0.015;
grid.material.transparent = true;
grid.material.opacity = 0.30;
scene.add(grid);

// ============================================================
// 7. LOADERS / MODELS
// ============================================================

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

function loadGLB(url) {
    return new Promise((resolve, reject) => {
        loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
    });
}

function cloneMaterials(model) {
    model.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;

        if (Array.isArray(child.material)) {
            child.material = child.material.map(material => material.clone());
        } else if (child.material) {
            child.material = child.material.clone();
        }
    });
}

function normaliseHeight(object, targetHeight) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = targetHeight / Math.max(size.y, 0.001);
    object.scale.multiplyScalar(scale);

    object.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    object.position.x -= center.x;
    object.position.z -= center.z;

    object.updateMatrixWorld(true);
    const finalBox = new THREE.Box3().setFromObject(object);
    object.position.y -= finalBox.min.y;
}

const launchWorld = new THREE.Group();
scene.add(launchWorld);

const rocketGroup = new THREE.Group();
launchWorld.add(rocketGroup);

const launcherGroup = new THREE.Group();
launchWorld.add(launcherGroup);

let saturn = null;
let launcher = null;

// ============================================================
// 8. MAIN ENGINE FLAMES
// ============================================================

const flameGroup = new THREE.Group();
flameGroup.visible = false;
rocketGroup.add(flameGroup);

const flameMaterial = new THREE.MeshBasicMaterial({
    color: 0x59eaff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const innerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const flamePositions = [
    [-0.36, -0.10],
    [0.36, -0.10],
    [-0.58, 0.32],
    [0.58, 0.32],
    [0, 0.42]
];

for (const [x, z] of flamePositions) {
    const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.20, 1.7, 12),
        flameMaterial
    );
    flame.rotation.z = Math.PI;
    flame.position.set(x, -0.75, z);
    flameGroup.add(flame);

    const inner = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 1.0, 10),
        innerFlameMaterial
    );
    inner.rotation.z = Math.PI;
    inner.position.set(x, -0.48, z);
    flameGroup.add(inner);
}

// ============================================================
// 9. UPPER STAGE FLAME
// ============================================================

const upperStageFlame = new THREE.Group();
upperStageFlame.visible = false;
rocketGroup.add(upperStageFlame);

const upperOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 1.8, 14),
    new THREE.MeshBasicMaterial({
        color: 0x39dfff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
upperOuter.rotation.z = Math.PI;
upperOuter.position.y = -0.85;
upperStageFlame.add(upperOuter);

const upperInner = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 1.05, 12),
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })
);
upperInner.rotation.z = Math.PI;
upperInner.position.y = -0.48;
upperStageFlame.add(upperInner);

// ============================================================
// 10. PAYLOAD
// ============================================================

const payload = new THREE.Group();
const payloadBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.44, 0.9, 20),
    new THREE.MeshStandardMaterial({
        color: 0x0b1319,
        roughness: 0.22,
        metalness: 0.85
    })
);
payload.add(payloadBody);

const payloadRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.045, 8, 24),
    new THREE.MeshStandardMaterial({
        color: 0x28e6ff,
        emissive: 0x20dfff,
        emissiveIntensity: 2.5,
        roughness: 0.2,
        metalness: 0.2
    })
);
payloadRing.rotation.x = Math.PI / 2;
payload.add(payloadRing);
payload.visible = false;
scene.add(payload);

// ============================================================
// 11. FIRST STAGE VISUAL
// ============================================================

function createFirstStageVisual() {
    const stage = new THREE.Group();

    const white = new THREE.MeshStandardMaterial({
        color: 0xd7e0e3,
        roughness: 0.42,
        metalness: 0.28
    });

    const dark = new THREE.MeshStandardMaterial({
        color: 0x101619,
        roughness: 0.32,
        metalness: 0.72
    });

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.82, 4.4, 24),
        white
    );
    body.position.y = -2;
    stage.add(body);

    const upperBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.77, 0.77, 0.52, 24),
        dark
    );
    upperBand.position.y = -0.65;
    stage.add(upperBand);

    const lowerBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.83, 0.83, 0.48, 24),
        dark
    );
    lowerBand.position.y = -3.45;
    stage.add(lowerBand);

    return stage;
}

// ============================================================
// 12. STATE MACHINE
// ============================================================

const PHASE = {
    IDLE: 'IDLE',
    COUNTDOWN: 'COUNTDOWN',
    ASCENT: 'ASCENT',
    STAGE_SEPARATION: 'STAGE_SEPARATION',
    SPACE_FLIGHT: 'SPACE_FLIGHT',
    PAYLOAD_SEPARATION: 'PAYLOAD_SEPARATION',
    PAYLOAD_APPROACH: 'PAYLOAD_APPROACH',
    PAYLOAD_ORBIT: 'PAYLOAD_ORBIT',
    MOON_DEPLOYMENT: 'MOON_DEPLOYMENT',
    MOON_ORBITS: 'MOON_ORBITS',
    FINAL_REVEAL: 'FINAL_REVEAL',
    LIVE: 'LIVE'
};

let phase = PHASE.IDLE;
let phaseStartedAt = 0;
let launchStarted = false;
let ceremonyTime = 0;
let firstStage = null;
let payloadOrbitAngle = -Math.PI * 0.15;
let payloadOrbitTravel = 0;
let liveOrbitTime = 0;
let websiteLive = false;

const rocketVelocity = new THREE.Vector3();
const firstStageVelocity = new THREE.Vector3();
const payloadVelocity = new THREE.Vector3();

function setStatus(text) {
    if (launchStatus) launchStatus.textContent = text;
}

function smooth01(value) {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
}

function setPhase(nextPhase, now) {
    phase = nextPhase;
    phaseStartedAt = now;
}

function getPhaseSeconds(now) {
    return (now - phaseStartedAt) / 1000;
}

function fadeMusicTo(target, seconds = 1.5) {
    if (!launchMusic) return;

    const from = Number.isFinite(launchMusic.volume) ? launchMusic.volume : 0;
    const start = performance.now();
    const duration = Math.max(seconds * 1000, 1);

    function tick(now) {
        const p = smooth01((now - start) / duration);
        launchMusic.volume = THREE.MathUtils.lerp(from, target, p);
        if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// ============================================================
// 13. LOAD VEHICLE MODELS
// ============================================================

async function prepareLaunchModels() {
    setStatus('COSMONIX // INITIALISING VEHICLE');

    try {
        [saturn, launcher] = await Promise.all([
            loadGLB('assets/launch/saturn-v.glb'),
            loadGLB('assets/launch/mobile-launcher.glb')
        ]);

        cloneMaterials(saturn);
        cloneMaterials(launcher);

        normaliseHeight(saturn, 12);
        saturn.rotation.y = 150;
        rocketGroup.add(saturn);
        rocketGroup.position.set(0, 0.65, 0);

        normaliseHeight(launcher, 16);
        launcherGroup.add(launcher);
        launcherGroup.position.set(-1.8, 0, -0.2);

        setStatus('COSMONIX // LAUNCH CONTROL');
        if (initiateButton) initiateButton.disabled = false;
    } catch (error) {
        console.error('COSMONIX model load failed:', error);
        setStatus('MODEL LOAD ERROR // CHECK assets/launch/');
        if (initiateButton) initiateButton.disabled = true;
    }
}

if (initiateButton) initiateButton.disabled = true;

// ============================================================
// 14. START CEREMONY + MUSIC
// ============================================================

async function startCeremony() {
    if (launchStarted || !saturn || !launcher) return;
    launchStarted = true;

    if (launchUI) launchUI.classList.add('sequence-started');

    if (initiateButton) {
        initiateButton.classList.add('disabled');
        initiateButton.disabled = true;
    }

    if (launchMusic) {
        try {
            launchMusic.loop = false;
            launchMusic.volume = 0;
            await launchMusic.play();
            fadeMusicTo(0.62, 2);
        } catch (error) {
            console.warn('Music could not start; ceremony continues.', error);
        }
    }

    setStatus('COSMONIX // SEQUENCE ACTIVE');
    setPhase(PHASE.COUNTDOWN, performance.now());
}

if (initiateButton) {
    initiateButton.addEventListener('click', startCeremony);
}

// ============================================================
// 15. COUNTDOWN
// ============================================================

let lastCountdownValue = null;

function updateCountdown(now) {
    const elapsed = getPhaseSeconds(now);
    const remaining = Math.max(0, 10 - Math.floor(elapsed));

    if (remaining !== lastCountdownValue) {
        lastCountdownValue = remaining;

        if (countdownDisplay) {
            countdownDisplay.textContent = `T-${remaining}`;
            countdownDisplay.classList.add('visible');
        }

        if (remaining > 3) {
            setStatus(`LAUNCH SEQUENCE // T-${remaining}`);
        } else if (remaining === 3) {
            setStatus('PROPULSION SYSTEMS READY');
        } else if (remaining === 2) {
            setStatus('ENGINE START');
            flameGroup.visible = true;
            engineAreaLight.intensity = 18;
        } else if (remaining === 1) {
            setStatus('THRUST BUILDING');
            engineAreaLight.intensity = 45;
        } else {
            setStatus('IGNITION');
            engineAreaLight.intensity = 82;
        }
    }

    if (elapsed >= 10.9) {
        if (countdownDisplay) countdownDisplay.textContent = 'LIFTOFF';
        setStatus('COSMONIX VEHICLE // ASCENT');
        rocketVelocity.set(0, 0.65, 0);
        setPhase(PHASE.ASCENT, now);
    }
}

// ============================================================
// 16. ASCENT
// ============================================================

function updateAscent(now, delta) {
    const elapsed = getPhaseSeconds(now);
    rocketVelocity.y += 2.9 * delta;
    rocketGroup.position.addScaledVector(rocketVelocity, delta);

    const follow = smooth01(elapsed / 5.5);
    cameraTarget.y = THREE.MathUtils.lerp(7, rocketGroup.position.y + 3.5, follow);
    camera.position.y = THREE.MathUtils.lerp(8, rocketGroup.position.y - 4, follow);
    camera.position.z = THREE.MathUtils.lerp(28, 32, follow);

    grid.material.opacity = THREE.MathUtils.lerp(0.30, 0, smooth01(elapsed / 5.5));
    ground.material.opacity = THREE.MathUtils.lerp(1, 0.08, smooth01(elapsed / 5.8));
    flameGroup.scale.y = 1.1 + Math.min(elapsed / 5, 1) * 0.55;

    if (elapsed >= 6.2) {
        if (countdownDisplay) countdownDisplay.classList.remove('visible');

        firstStage = createFirstStageVisual();
        firstStage.position.copy(rocketGroup.position);
        firstStage.position.y -= 0.4;
        scene.add(firstStage);

        firstStageVelocity.set(-1.5, rocketVelocity.y * 0.30, 0.15);
        flameGroup.visible = false;
        upperStageFlame.visible = true;
        setStatus('STAGE 01 // SEPARATION');
        setPhase(PHASE.STAGE_SEPARATION, now);
    }
}

// ============================================================
// 17. STAGE SEPARATION — NO FREEZE
// ============================================================

function updateStageSeparation(now, delta) {
    const elapsed = getPhaseSeconds(now);

    rocketVelocity.y += 0.72 * delta;
    rocketVelocity.x += 0.20 * delta;
    rocketGroup.position.addScaledVector(rocketVelocity, delta);
    rocketGroup.rotation.z = THREE.MathUtils.lerp(rocketGroup.rotation.z, -0.08, delta * 0.5);

    if (firstStage) {
        firstStageVelocity.y -= 1.35 * delta;
        firstStage.position.addScaledVector(firstStageVelocity, delta);
        firstStage.rotation.z += 0.13 * delta;
        firstStage.rotation.x += 0.07 * delta;
    }

    cameraTarget.lerp(
        new THREE.Vector3(rocketGroup.position.x, rocketGroup.position.y + 2, rocketGroup.position.z),
        1 - Math.pow(0.001, delta)
    );
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, rocketGroup.position.y - 5, delta * 0.8);

    launcherGroup.visible = elapsed < 0.5;

    if (elapsed >= 2.7) {
        setStatus('STAGE 02 // IGNITION CONFIRMED');
        setPhase(PHASE.SPACE_FLIGHT, now);
    }
}

// ============================================================
// 18. SPACE FLIGHT / PLANET REVEAL
// ============================================================

function updateSpaceFlight(now, delta) {
    const elapsed = getPhaseSeconds(now);

    rocketVelocity.x += 0.30 * delta;
    rocketVelocity.y += 0.25 * delta;
    rocketVelocity.z -= 0.18 * delta;
    rocketGroup.position.addScaledVector(rocketVelocity, delta);
    rocketGroup.rotation.z = THREE.MathUtils.lerp(rocketGroup.rotation.z, -0.23, delta * 0.45);

    ground.visible = false;
    grid.visible = false;
    launcherGroup.visible = false;
    launchGlow.intensity = 0;
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.001, delta * 0.8);

    const desiredCamera = new THREE.Vector3(13, 49, -28);
    const desiredTarget = CEREMONY_PLANET_POSITION.clone().add(new THREE.Vector3(-1.4, 0, 0));
    camera.position.lerp(desiredCamera, 1 - Math.pow(0.03, delta));
    cameraTarget.lerp(desiredTarget, 1 - Math.pow(0.03, delta));

    const stagingPosition = CEREMONY_PLANET_POSITION.clone().add(new THREE.Vector3(-10, -2, 7));
    if (elapsed > 1.2) rocketGroup.position.lerp(stagingPosition, delta * 0.48);

    if (elapsed >= 5.2) {
        setStatus('ORBITAL INSERTION // PAYLOAD READY');
        setPhase(PHASE.PAYLOAD_SEPARATION, now);
    }
}

// ============================================================
// 19. PAYLOAD SEPARATION — MOVES AWAY FROM ROCKET
// ============================================================

function beginPayloadIfNeeded() {
    if (payload.visible) return;

    const worldPosition = new THREE.Vector3();
    rocketGroup.getWorldPosition(worldPosition);

    payload.visible = true;
    payload.position.copy(worldPosition);
    payload.position.y += 4.5;
    payload.rotation.copy(rocketGroup.rotation);
    payloadVelocity.set(2.4, 0.55, -1.5);
    upperStageFlame.visible = false;
    engineAreaLight.intensity = 0;
}

function updatePayloadSeparation(now, delta) {
    beginPayloadIfNeeded();
    const elapsed = getPhaseSeconds(now);

    setStatus('COSMONIX PAYLOAD // SEPARATION');

    rocketGroup.position.addScaledVector(rocketVelocity, delta * 0.35);
    rocketGroup.position.x -= 0.65 * delta;
    rocketGroup.rotation.z -= 0.035 * delta;

    payload.position.addScaledVector(payloadVelocity, delta);
    payload.rotation.y += 0.35 * delta;
    payloadRing.rotation.z += 0.75 * delta;

    const payloadTarget = CEREMONY_PLANET_POSITION.clone().add(new THREE.Vector3(-7, 0.5, 3.5));
    if (elapsed > 0.9) payload.position.lerp(payloadTarget, delta * 0.85);

    cameraTarget.lerp(payload.position, delta * 0.9);

    if (elapsed >= 2.8) {
        setStatus('PAYLOAD CLEAR // APPROACHING ORBIT');
        setPhase(PHASE.PAYLOAD_APPROACH, now);
    }
}

// ============================================================
// 20. PAYLOAD APPROACH
// ============================================================

function getPayloadOrbitPosition(angle) {
    const radius = 7.2;
    return new THREE.Vector3(
        CEREMONY_PLANET_POSITION.x + Math.cos(angle) * radius,
        CEREMONY_PLANET_POSITION.y + Math.sin(angle) * radius * 0.12,
        CEREMONY_PLANET_POSITION.z + Math.sin(angle) * radius * 0.88
    );
}

function updatePayloadApproach(now, delta) {
    const elapsed = getPhaseSeconds(now);
    payloadOrbitAngle += 0.34 * delta;

    const orbitTarget = getPayloadOrbitPosition(payloadOrbitAngle);
    payload.position.lerp(orbitTarget, 1 - Math.pow(0.005, delta));
    payload.rotation.y += 0.5 * delta;
    payloadRing.rotation.z += 1.1 * delta;

    rocketGroup.position.x -= 2.0 * delta;
    rocketGroup.position.y += 0.7 * delta;

    cameraTarget.lerp(CEREMONY_PLANET_POSITION, delta * 0.65);

    if (elapsed >= 2.4) {
        payloadOrbitTravel = 0;
        setStatus('COSMONIX PAYLOAD // ORBIT ACQUIRED');
        setPhase(PHASE.PAYLOAD_ORBIT, now);
    }
}

// ============================================================
// 21. ONE COMPLETE PAYLOAD ORBIT
// ============================================================

function updatePayloadOrbit(now, delta) {
    const orbitSpeed = 0.72;
    const angleStep = orbitSpeed * delta;

    payloadOrbitAngle += angleStep;
    payloadOrbitTravel += Math.abs(angleStep);
    payload.position.copy(getPayloadOrbitPosition(payloadOrbitAngle));
    payload.rotation.y += 0.75 * delta;
    payloadRing.rotation.z += 1.35 * delta;

    setStatus('COSMONIX PAYLOAD // ONE ORBIT IN PROGRESS');

    const orbitViewAngle = payloadOrbitAngle - 0.95;
    const cameraRadius = 20;
    const targetCamera = new THREE.Vector3(
        CEREMONY_PLANET_POSITION.x + Math.cos(orbitViewAngle) * cameraRadius,
        CEREMONY_PLANET_POSITION.y + 3.8,
        CEREMONY_PLANET_POSITION.z + Math.sin(orbitViewAngle) * cameraRadius
    );

    camera.position.lerp(targetCamera, delta * 0.45);
    cameraTarget.lerp(CEREMONY_PLANET_POSITION, delta * 1.2);

    if (payloadOrbitTravel >= Math.PI * 2) {
        setStatus('ORBIT COMPLETE // EVENT DEPLOYMENT');

        const payloadLocalToOrbit = payload.position.clone().sub(CEREMONY_PLANET_POSITION);

        for (const item of eventObjects) {
            item.deployStartLocal.copy(payloadLocalToOrbit);
            item.group.position.copy(payloadLocalToOrbit);
            item.group.scale.setScalar(0.01);
        }

        setPhase(PHASE.MOON_DEPLOYMENT, now);
    }
}

// ============================================================
// 22. MOON DEPLOYMENT
// ============================================================

function orbitPositionForEvent(data, angle) {
    return new THREE.Vector3(
        Math.cos(angle) * data.radius,
        Math.sin(angle) * data.radius * 0.10,
        Math.sin(angle) * data.radius * 0.88
    );
}

function updateMoonDeployment(now, delta) {
    const elapsed = getPhaseSeconds(now);
    setStatus('DEPLOYING COSMONIX EVENT NETWORK');

    payload.rotation.y += 0.65 * delta;
    payloadRing.rotation.z += 1.8 * delta;
    payloadOrbitAngle += 0.28 * delta;
    payload.position.copy(getPayloadOrbitPosition(payloadOrbitAngle));

    eventObjects.forEach((item, index) => {
        const delay = index * 0.18;
        const p = smooth01((elapsed - delay) / 2.1);
        const target = orbitPositionForEvent(item.data, item.deployTargetAngle);

        item.group.position.copy(item.deployStartLocal).lerp(target, p);
        item.group.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, p));
        item.orbitLine.material.opacity = THREE.MathUtils.lerp(0, 0.09, p);
        item.group.rotation.y += 0.35 * delta;
        item.planet.rotation.x += 0.30 * delta;
    });

    if (elapsed > 1.7) {
        const vanish = smooth01((elapsed - 1.7) / 1.2);
        payload.scale.setScalar(1 - vanish * 0.92);
    }

    if (elapsed >= 3.5) {
        payload.visible = false;
        payload.scale.setScalar(1);
        setStatus('EVENT NETWORK DEPLOYED');
        setPhase(PHASE.MOON_ORBITS, now);
    }
}

// ============================================================
// 23. EVENT ORBITS + TRANSITION TO WEBSITE
// ============================================================

function updateEventOrbits(delta) {
    liveOrbitTime += delta;

    for (const item of eventObjects) {
        const angle = liveOrbitTime * item.data.speed + item.data.phase;
        const target = orbitPositionForEvent(item.data, angle);
        item.group.position.lerp(target, 1 - Math.pow(0.004, delta));
        item.group.rotation.y += delta * 0.35;
        item.planet.rotation.x += delta * 0.30;
    }
}

function getFinalEarthPosition() {
    const width = window.innerWidth;
    if (width < 700) return new THREE.Vector3(6.0, -0.2, 0);
    if (width < 1000) return new THREE.Vector3(3.3, -0.35, 0);
    return new THREE.Vector3(6.0, -0.2, 0);
}

function getFinalCameraPosition() {
    const width = window.innerWidth;
    if (width < 700) return new THREE.Vector3(0, 0.6, 16.5);
    if (width < 1000) return new THREE.Vector3(0, 0.6, 17.5);
    return new THREE.Vector3(0, 0.6, 18);
}

function getFinalCameraTarget() {
    return new THREE.Vector3(2.2, 0, 0);
}

function enterWebsiteDirectly() {
    websiteLive = true;
    launchStarted = true;
    sessionStorage.setItem('cosmonixLaunchSeen', 'true');

    if (launchUI) {
        launchUI.classList.add('hidden');
        launchUI.style.display = 'none';
    }

    if (finalReveal) {
        finalReveal.classList.remove('visible', 'exit');
        finalReveal.style.display = 'none';
    }

    if (launchMusic) {
        launchMusic.pause();
        launchMusic.currentTime = 0;
    }

    document.body.classList.remove('ceremony-active');
    document.body.classList.add('website-live');

    launchWorld.visible = false;
    ground.visible = false;
    grid.visible = false;
    payload.visible = false;
    flameGroup.visible = false;
    upperStageFlame.visible = false;
    launchGlow.intensity = 0;
    engineAreaLight.intensity = 0;
    scene.fog.density = 0.001;

    const finalEarthPosition = getFinalEarthPosition();
    earthGroup.position.copy(finalEarthPosition);
    orbitGroup.position.copy(finalEarthPosition);
    camera.position.copy(getFinalCameraPosition());
    cameraTarget.copy(getFinalCameraTarget());

    for (const item of eventObjects) {
        item.group.visible = true;
        item.group.scale.setScalar(1);
        item.group.position.copy(orbitPositionForEvent(item.data, item.data.phase));
        item.orbitLine.material.opacity = 0.09;
    }

    setPhase(PHASE.LIVE, performance.now());
}

function updateMoonOrbits(now, delta) {
    updateEventOrbits(delta);

    const finalEarthPosition = getFinalEarthPosition();
    earthGroup.position.lerp(finalEarthPosition, delta * 0.85);
    orbitGroup.position.lerp(finalEarthPosition, delta * 0.85);
    camera.position.lerp(getFinalCameraPosition(), delta * 0.85);
    cameraTarget.lerp(getFinalCameraTarget(), delta * 0.85);

    if (getPhaseSeconds(now) >= 2.4) {
        if (launchUI) launchUI.classList.add('hidden');
        if (finalReveal) finalReveal.classList.add('visible');
        setPhase(PHASE.FINAL_REVEAL, now);
    }
}

function updateFinalReveal(now, delta) {
    updateEventOrbits(delta);

    if (getPhaseSeconds(now) >= 2.6 && !websiteLive) {
        websiteLive = true;
        sessionStorage.setItem('cosmonixLaunchSeen', 'true');
        document.body.classList.remove('ceremony-active');
        document.body.classList.add('website-live');

        if (finalReveal) finalReveal.classList.add('exit');
        setStatus('COSMONIX 26 // NOW LIVE');
        fadeMusicTo(0.28, 3.5);
        setPhase(PHASE.LIVE, now);
    }
}

function updateLive(delta) {
    updateEventOrbits(delta);
    earthGroup.position.lerp(getFinalEarthPosition(), delta * 1.6);
    orbitGroup.position.copy(earthGroup.position);
    camera.position.lerp(getFinalCameraPosition(), delta * 1.6);
    cameraTarget.lerp(getFinalCameraTarget(), delta * 1.6);
}

// ============================================================
// 24. MASTER LOOP — ONLY ONE requestAnimationFrame
// ============================================================

const clock = new THREE.Clock();

if (skipLaunch) {
    enterWebsiteDirectly();
} else {
    prepareLaunchModels();
}

function animate(now = performance.now()) {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.033);
    ceremonyTime += delta;

    earthGroup.rotation.y += delta * 0.14;
    stars.rotation.y = ceremonyTime * 0.0012;
    stars.rotation.x = Math.sin(ceremonyTime * 0.04) * 0.012;

    if (flameGroup.visible) {
        flameGroup.children.forEach((child, index) => {
            child.scale.y = 0.9 + Math.sin(ceremonyTime * 18 + index) * 0.10;
        });
    }

    if (upperStageFlame.visible) {
        upperStageFlame.scale.y = 0.90 + Math.sin(ceremonyTime * 20) * 0.08;
    }

    switch (phase) {
        case PHASE.COUNTDOWN:
            updateCountdown(now);
            break;
        case PHASE.ASCENT:
            updateAscent(now, delta);
            break;
        case PHASE.STAGE_SEPARATION:
            updateStageSeparation(now, delta);
            break;
        case PHASE.SPACE_FLIGHT:
            updateSpaceFlight(now, delta);
            break;
        case PHASE.PAYLOAD_SEPARATION:
            updatePayloadSeparation(now, delta);
            break;
        case PHASE.PAYLOAD_APPROACH:
            updatePayloadApproach(now, delta);
            break;
        case PHASE.PAYLOAD_ORBIT:
            updatePayloadOrbit(now, delta);
            break;
        case PHASE.MOON_DEPLOYMENT:
            updateMoonDeployment(now, delta);
            break;
        case PHASE.MOON_ORBITS:
            updateMoonOrbits(now, delta);
            break;
        case PHASE.FINAL_REVEAL:
            updateFinalReveal(now, delta);
            break;
        case PHASE.LIVE:
            updateLive(delta);
            break;
        default:
            launchGlow.intensity = 38 + Math.sin(ceremonyTime * 1.5) * 5;
            break;
    }

    if (firstStage && firstStage.position.y < -25) {
        scene.remove(firstStage);
        firstStage = null;
    }

    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
}

animate();

// ============================================================
// 25. RESIZE
// ============================================================

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.fov = width < 700 ? 42 : 34;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(width, height);

    if (phase === PHASE.IDLE) {
        if (width < 700) camera.position.set(14, 8, 35);
        else camera.position.set(17, 8, 28);
        cameraTarget.set(0, 7, 0);
    }
}

window.addEventListener('resize', onResize);
onResize();

window.cosmonix = {
    scene,
    camera,
    cameraTarget,
    renderer,
    earthGroup,
    orbitGroup,
    eventObjects,
    rocketGroup,
    payload,
    startCeremony,
    enterWebsiteDirectly,
    get phase() { return phase; }
};

console.log('🚀 COSMONIX unified scene ready.', window.cosmonix);
