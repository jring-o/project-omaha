/**
 * TOWER DEFENDER 2347 - Cinematic Module
 * Opening cinematic sequence with camera descent from garden to underworld
 */

import { CINEMATIC_CONFIG, STORAGE_KEYS } from './config.js';

let cinematicActive = false;
let cinematicStartTime = 0;
let cinematicScene = null;
let cinematicCamera = null;
let gardenElements = [];
let onCinematicComplete = null;
let skipButton = null;

// Garden scene elements - services as nature
const GARDEN_ITEMS = [
    // Trees (major services)
    { type: 'tree', label: 'Netflix', x: -80, z: -60, scale: 1.2 },
    { type: 'tree', label: 'Gmail', x: 60, z: -40, scale: 1.0 },
    { type: 'tree', label: 'Banking', x: -30, z: -80, scale: 1.1 },
    { type: 'tree', label: 'Amazon', x: 100, z: -70, scale: 1.3 },
    { type: 'tree', label: 'Google', x: -120, z: -30, scale: 1.0 },
    // Deer (commerce/delivery)
    { type: 'deer', label: 'Uber', x: 40, z: -50, scale: 0.9 },
    { type: 'deer', label: 'DoorDash', x: -50, z: -100, scale: 0.8 },
    // Flowers (social/personal)
    { type: 'flower', label: 'Instagram', x: -60, z: -30, scale: 0.7 },
    { type: 'flower', label: 'Photos', x: 20, z: -90, scale: 0.6 },
    { type: 'flower', label: 'TikTok', x: 80, z: -30, scale: 0.65 },
    // Butterflies (communication/family)
    { type: 'butterfly', label: 'Family Calls', x: -20, z: -45, scale: 0.5 },
    { type: 'butterfly', label: 'Grandkids', x: 50, z: -20, scale: 0.45 }
];

/**
 * Check if player has seen the cinematic before
 */
export function hasSeenCinematic() {
    return localStorage.getItem(STORAGE_KEYS.hasSeenCinematic) === 'true';
}

/**
 * Mark cinematic as seen
 */
export function markCinematicSeen() {
    localStorage.setItem(STORAGE_KEYS.hasSeenCinematic, 'true');
}

/**
 * Start the opening cinematic
 */
export function startCinematic(scene, camera, onComplete) {
    cinematicActive = true;
    cinematicStartTime = Date.now();
    cinematicScene = scene;
    cinematicCamera = camera;
    onCinematicComplete = onComplete;

    // Store original camera position
    camera.userData.originalPosition = camera.position.clone();

    // Create garden scene
    createGardenScene(scene);

    // Setup camera for cinematic
    camera.position.set(0, 400, 200);
    camera.lookAt(0, 350, 0);

    // Show cinematic overlay
    showCinematicOverlay();

    // Add skip button
    createSkipButton();
}

/**
 * Create the garden scene above ground
 */
function createGardenScene(scene) {
    // Sky dome (bright blue gradient)
    const skyGeometry = new THREE.SphereGeometry(800, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = 300;
    scene.add(sky);
    gardenElements.push(sky);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(50, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(200, 500, -300);
    scene.add(sun);
    gardenElements.push(sun);

    // Ground (lush green)
    const groundGeometry = new THREE.PlaneGeometry(600, 600);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 300;
    scene.add(ground);
    gardenElements.push(ground);

    // Create garden items
    GARDEN_ITEMS.forEach(item => {
        const element = createGardenItem(item);
        element.position.set(item.x, 300, item.z);
        element.scale.setScalar(item.scale);
        scene.add(element);
        gardenElements.push(element);
    });

    // Add some grass patches
    for (let i = 0; i < 30; i++) {
        const grass = createGrass();
        grass.position.set(
            (Math.random() - 0.5) * 400,
            300,
            (Math.random() - 0.5) * 400
        );
        scene.add(grass);
        gardenElements.push(grass);
    }
}

/**
 * Create a garden item (tree, deer, flower, butterfly)
 */
function createGardenItem(item) {
    const group = new THREE.Group();

    switch (item.type) {
        case 'tree':
            // Trunk
            const trunkGeometry = new THREE.CylinderGeometry(3, 4, 30, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 15;
            group.add(trunk);

            // Foliage (pixel-style layered cones)
            for (let i = 0; i < 3; i++) {
                const foliageGeometry = new THREE.ConeGeometry(15 - i * 3, 20, 8);
                const foliageMaterial = new THREE.MeshStandardMaterial({
                    color: 0x228b22,
                    flatShading: true
                });
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.y = 30 + i * 12;
                group.add(foliage);
            }
            break;

        case 'deer':
            // Simple deer shape
            const bodyGeometry = new THREE.BoxGeometry(15, 10, 8);
            const deerMaterial = new THREE.MeshStandardMaterial({ color: 0xd2691e });
            const body = new THREE.Mesh(bodyGeometry, deerMaterial);
            body.position.y = 10;
            group.add(body);

            // Head
            const headGeometry = new THREE.BoxGeometry(5, 6, 5);
            const head = new THREE.Mesh(headGeometry, deerMaterial);
            head.position.set(10, 14, 0);
            group.add(head);

            // Legs
            const legGeometry = new THREE.BoxGeometry(2, 8, 2);
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(legGeometry, deerMaterial);
                leg.position.set(
                    i < 2 ? 5 : -5,
                    4,
                    i % 2 === 0 ? 2 : -2
                );
                group.add(leg);
            }
            break;

        case 'flower':
            // Stem
            const stemGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 6);
            const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.y = 7.5;
            group.add(stem);

            // Petals
            const petalColors = [0xff69b4, 0xff6347, 0xffd700, 0x9370db];
            const petalGeometry = new THREE.CircleGeometry(4, 6);
            for (let i = 0; i < 5; i++) {
                const petalMaterial = new THREE.MeshStandardMaterial({
                    color: petalColors[Math.floor(Math.random() * petalColors.length)],
                    side: THREE.DoubleSide
                });
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                petal.position.y = 15;
                petal.rotation.z = (i / 5) * Math.PI * 2;
                petal.rotation.x = Math.PI / 4;
                petal.position.x = Math.cos((i / 5) * Math.PI * 2) * 3;
                petal.position.z = Math.sin((i / 5) * Math.PI * 2) * 3;
                group.add(petal);
            }

            // Center
            const centerGeometry = new THREE.SphereGeometry(2, 8, 8);
            const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 15;
            group.add(center);
            break;

        case 'butterfly':
            // Body
            const butterflyBodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
            const butterflyMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const butterflyBody = new THREE.Mesh(butterflyBodyGeometry, butterflyMaterial);
            butterflyBody.rotation.z = Math.PI / 2;
            butterflyBody.position.y = 20;
            group.add(butterflyBody);

            // Wings
            const wingGeometry = new THREE.CircleGeometry(5, 6);
            const wingMaterial = new THREE.MeshStandardMaterial({
                color: 0xff69b4,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(0, 22, 3);
            leftWing.rotation.y = Math.PI / 6;
            group.add(leftWing);

            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(0, 22, -3);
            rightWing.rotation.y = -Math.PI / 6;
            group.add(rightWing);
            break;
    }

    // Add floating label using Canvas texture
    if (item.label) {
        const labelSprite = createLabelSprite(item.label);
        // Position label above the item
        const labelHeight = item.type === 'tree' ? 70 : item.type === 'deer' ? 30 : item.type === 'flower' ? 25 : 35;
        labelSprite.position.y = labelHeight;
        group.add(labelSprite);
    }

    return group;
}

/**
 * Create a text label sprite
 */
function createLabelSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();

    // Draw text
    context.font = 'bold 32px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(30, 7.5, 1);

    return sprite;
}

/**
 * Create grass patch
 */
function createGrass() {
    const group = new THREE.Group();
    const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0x32cd32,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < 5; i++) {
        const bladeGeometry = new THREE.PlaneGeometry(1, 5 + Math.random() * 3);
        const blade = new THREE.Mesh(bladeGeometry, grassMaterial);
        blade.position.set(
            (Math.random() - 0.5) * 3,
            2 + Math.random() * 2,
            (Math.random() - 0.5) * 3
        );
        blade.rotation.y = Math.random() * Math.PI;
        blade.rotation.x = -0.2 + Math.random() * 0.4;
        group.add(blade);
    }

    return group;
}

/**
 * Show cinematic overlay
 */
function showCinematicOverlay() {
    const overlay = document.getElementById('cinematic-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
}

/**
 * Hide cinematic overlay
 */
function hideCinematicOverlay() {
    const overlay = document.getElementById('cinematic-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}

/**
 * Create skip button
 */
function createSkipButton() {
    const overlay = document.getElementById('cinematic-overlay');
    if (overlay && !skipButton) {
        skipButton = document.createElement('button');
        skipButton.className = 'cinematic-skip-btn';
        skipButton.textContent = 'Skip (Space)';
        skipButton.onclick = skipCinematic;
        overlay.appendChild(skipButton);

        // Keyboard skip
        window.addEventListener('keydown', handleSkipKey);
    }
}

/**
 * Handle skip key press
 */
function handleSkipKey(e) {
    if (cinematicActive && (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter')) {
        skipCinematic();
    }
}

/**
 * Skip the cinematic
 */
export function skipCinematic() {
    if (!cinematicActive) return;

    endCinematic();
}

/**
 * Update cinematic (called each frame)
 */
export function updateCinematic(deltaTime) {
    if (!cinematicActive) return false;

    const elapsed = Date.now() - cinematicStartTime;
    const duration = CINEMATIC_CONFIG.duration;

    // Find current scene phase
    let currentScene = CINEMATIC_CONFIG.scenes[0];
    for (const scene of CINEMATIC_CONFIG.scenes) {
        if (elapsed >= scene.time) {
            currentScene = scene;
        }
    }

    // Update text
    updateCinematicText(currentScene.text);

    // Update camera based on phase
    updateCinematicCamera(elapsed, duration, currentScene.phase);

    // Check if cinematic is complete
    if (elapsed >= duration) {
        endCinematic();
        return false;
    }

    return true;
}

/**
 * Update cinematic camera position
 */
function updateCinematicCamera(elapsed, duration, phase) {
    if (!cinematicCamera) return;

    const progress = elapsed / duration;

    switch (phase) {
        case 'garden_pan':
            // Wide establishing shot, slowly pan across the garden (0-4 seconds)
            const panProgress = elapsed / 4000;
            cinematicCamera.position.set(
                -100 + panProgress * 50,
                380,
                150
            );
            cinematicCamera.lookAt(0, 320, -50);
            break;

        case 'garden_tour':
            // Tour through the garden, closer to items (4-19 seconds)
            const tourProgress = (elapsed - 4000) / 15000;
            const tourAngle = tourProgress * Math.PI * 1.2; // Full sweep
            cinematicCamera.position.set(
                Math.sin(tourAngle) * 140,
                350 + Math.sin(tourProgress * Math.PI) * 30,
                Math.cos(tourAngle) * 120 + 30
            );
            cinematicCamera.lookAt(
                Math.sin(tourAngle + 0.3) * 50,
                320,
                Math.cos(tourAngle + 0.3) * 50 - 60
            );
            break;

        case 'descending':
            // Descend through ground (19-27 seconds)
            const descentProgress = (elapsed - 19000) / 8000;
            cinematicCamera.position.set(
                0,
                350 - descentProgress * 250,
                120 - descentProgress * 20
            );
            cinematicCamera.lookAt(0, 300 - descentProgress * 200, 0);
            break;

        case 'underground':
            // In the underworld, approaching the tower (27-40 seconds)
            const underProgress = (elapsed - 27000) / 13000;
            cinematicCamera.position.set(
                Math.sin(underProgress * 0.8) * 40,
                80 + underProgress * 70,
                100 + underProgress * 150
            );
            cinematicCamera.lookAt(0, 100, 0);
            break;

        case 'tower':
            // Focus on tower, final shot (40-45 seconds)
            const towerProgress = (elapsed - 40000) / 5000;
            cinematicCamera.position.set(
                0,
                150 + towerProgress * 50,
                250 + towerProgress * 100
            );
            cinematicCamera.lookAt(0, 120, 0);
            break;
    }
}

/**
 * Update cinematic text display
 */
function updateCinematicText(text) {
    const textElement = document.getElementById('cinematic-text');
    if (textElement && textElement.textContent !== text) {
        // Fade out
        textElement.style.opacity = '0';

        setTimeout(() => {
            textElement.textContent = text;
            // Fade in
            textElement.style.opacity = '1';
        }, 300);
    }
}

/**
 * End the cinematic
 */
function endCinematic() {
    cinematicActive = false;

    // Remove garden elements
    gardenElements.forEach(element => {
        if (cinematicScene) {
            cinematicScene.remove(element);
        }
    });
    gardenElements = [];

    // Hide overlay
    hideCinematicOverlay();

    // Remove skip button event listener
    window.removeEventListener('keydown', handleSkipKey);

    // Remove skip button
    if (skipButton && skipButton.parentNode) {
        skipButton.parentNode.removeChild(skipButton);
        skipButton = null;
    }

    // Mark as seen
    markCinematicSeen();

    // Callback
    if (onCinematicComplete) {
        onCinematicComplete();
    }
}

/**
 * Check if cinematic is currently playing
 */
export function isCinematicActive() {
    return cinematicActive;
}

/**
 * Reset cinematic state (for testing)
 */
export function resetCinematicState() {
    localStorage.removeItem(STORAGE_KEYS.hasSeenCinematic);
}
