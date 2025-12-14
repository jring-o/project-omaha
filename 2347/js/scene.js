/**
 * TOWER DEFENDER 2347 - Scene Module
 * Three.js scene setup, starfield, and platform
 */

let scene = null;
let camera = null;
let renderer = null;
let stars = [];

/**
 * Initialize the Three.js scene
 */
export function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.FogExp2(0x000022, 0.001);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 200, 450);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Lighting
    setupLighting();

    // Starfield
    createStarfield();

    // Ground platform
    createGroundPlatform();

    // Window resize handler
    window.addEventListener('resize', onWindowResize);

    return { scene, camera, renderer };
}

/**
 * Setup scene lighting
 */
function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x0066ff, 2, 200);
    blueLight.position.set(-50, 50, 50);
    scene.add(blueLight);

    const redLight = new THREE.PointLight(0xff3300, 1, 150);
    redLight.position.set(50, 30, -50);
    scene.add(redLight);
}

/**
 * Create the starfield background
 */
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        const radius = 500 + Math.random() * 1000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        const brightness = 0.5 + Math.random() * 0.5;
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness + Math.random() * 0.3;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    stars.push(starField);
}

/**
 * Create the ground platform
 */
function createGroundPlatform() {
    // Main platform
    const platformGeometry = new THREE.CylinderGeometry(160, 200, 10, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a3a,
        metalness: 0.8,
        roughness: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -5;
    platform.receiveShadow = true;
    scene.add(platform);

    // Glowing ring
    const ringGeometry = new THREE.TorusGeometry(180, 2, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0;
    scene.add(ring);

    // Grid
    const gridHelper = new THREE.GridHelper(300, 30, 0x004444, 0x002222);
    gridHelper.position.y = 0.5;
    scene.add(gridHelper);
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Update starfield rotation
 */
export function updateStars(deltaTime) {
    stars.forEach(star => {
        star.rotation.y += deltaTime * 0.01;
    });
}

/**
 * Render the scene
 */
export function render() {
    renderer.render(scene, camera);
}

/**
 * Get scene references
 */
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
