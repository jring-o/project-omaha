/**
 * TOWER DEFENDER 2347 - Player Module
 * Player ship creation and movement
 */

import { GAME_BOUNDS, PLAYER_SPEED } from './config.js';
import { isActionActive, getMouseDelta, getMouseSettings, isPointerLockedState } from './controls.js';
import { resolveCollisions } from './physics.js';
import { getPowerupMultiplier } from './powerups.js';

let player = null;
let turret = null;
let playerVelocity = null;

// Ship orientation state
let descentYaw = 0;
let descentPitch = 0;
let shipQuaternion = null;

// Camera state
let cameraViewMode = 'first';
let cameraRoll = 0;
let cameraPitch = 0;

/**
 * Create the player ship
 */
export function createPlayer(scene) {
    player = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.ConeGeometry(2, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x3366ff,
        metalness: 0.9,
        roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    player.add(body);

    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.rotation.x = -Math.PI / 2;
    cockpit.position.z = -1;
    player.add(cockpit);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.3, 3);
    const wingMaterial = new THREE.MeshStandardMaterial({
        color: 0x2255cc,
        metalness: 0.8,
        roughness: 0.3
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = 1;
    player.add(wings);

    // Wing tips
    const wingTipGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const wingTipMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    const leftWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    leftWingTip.position.set(-6, 0, 1);
    player.add(leftWingTip);

    const rightWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    rightWingTip.position.set(6, 0, 1);
    player.add(rightWingTip);

    // Engine
    const engineGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = 4;
    player.add(engine);

    // Engine light
    const engineLight = new THREE.PointLight(0xff6600, 2, 20);
    engineLight.position.z = 5;
    player.add(engineLight);
    player.userData.engineLight = engineLight;

    // Turret
    turret = new THREE.Group();

    const turretBaseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 8);
    const turretMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        metalness: 0.9,
        roughness: 0.2
    });
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turret.add(turretBase);

    const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x004444
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -2.5;
    barrel.position.y = 0.2;
    turret.add(barrel);

    const turretTipGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const turretTipMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const turretTip = new THREE.Mesh(turretTipGeometry, turretTipMaterial);
    turretTip.position.z = -4.5;
    turretTip.position.y = 0.2;
    turret.add(turretTip);

    turret.position.y = 1.5;
    turret.position.z = -1;
    player.add(turret);
    player.userData.turret = turret;

    // Initial position
    player.position.set(0, 50, 350);
    player.castShadow = true;
    scene.add(player);

    // Initialize physics
    playerVelocity = new THREE.Vector3();
    shipQuaternion = new THREE.Quaternion();

    return player;
}

/**
 * Get the player object
 */
export function getPlayer() {
    return player;
}

/**
 * Get the turret object
 */
export function getTurret() {
    return turret;
}

/**
 * Get player velocity
 */
export function getPlayerVelocity() {
    return playerVelocity;
}

/**
 * Get camera view mode
 */
export function getCameraViewMode() {
    return cameraViewMode;
}

/**
 * Toggle camera view mode
 */
export function toggleCameraView() {
    cameraViewMode = cameraViewMode === 'third' ? 'first' : 'third';
    return cameraViewMode;
}

/**
 * Reset camera view to first person
 */
export function resetCameraView() {
    cameraViewMode = 'first';
}

/**
 * Reset player state
 */
export function resetPlayer() {
    player.position.set(0, 50, 350);
    playerVelocity.set(0, 0, 0);
    descentYaw = 0;
    descentPitch = 0;
    cameraViewMode = 'first';
    shipQuaternion = new THREE.Quaternion();
}

/**
 * Update player movement and camera (Descent 6DOF mode)
 */
export function updatePlayer(deltaTime, camera, gameState, towerBlocks, towerBodies) {
    const baseSpeed = gameState.isBoosting ? PLAYER_SPEED.boost : PLAYER_SPEED.normal;
    const speedMultiplier = getPowerupMultiplier('speed');
    const moveSpeed = baseSpeed * speedMultiplier;
    const mouseSettings = getMouseSettings();
    const rotationSensitivity = 0.002 * mouseSettings.sensitivity;
    const maxPitchLimit = Math.PI * 0.45;

    // Mouse controls ship rotation
    if (isPointerLockedState()) {
        const mouseDelta = getMouseDelta();
        const deltaX = mouseSettings.invertX ? -mouseDelta.x : mouseDelta.x;
        const deltaY = mouseSettings.invertY ? mouseDelta.y : -mouseDelta.y;

        descentYaw -= deltaX * rotationSensitivity;
        descentPitch += deltaY * rotationSensitivity;
        descentPitch = THREE.MathUtils.clamp(descentPitch, -maxPitchLimit, maxPitchLimit);
    }

    // Build rotation
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), descentYaw);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), descentPitch);

    shipQuaternion.copy(yawQuat).multiply(pitchQuat);
    player.quaternion.slerp(shipQuaternion, deltaTime * mouseSettings.smoothing * 1.5);

    // Strafing
    const strafeDir = new THREE.Vector3();

    if (isActionActive('forward')) strafeDir.z -= 1;
    if (isActionActive('backward')) strafeDir.z += 1;
    if (isActionActive('left')) strafeDir.x -= 1;
    if (isActionActive('right')) strafeDir.x += 1;
    if (isActionActive('down')) strafeDir.y -= 1;
    if (isActionActive('up')) strafeDir.y += 1;

    if (isActionActive('boost')) {
        strafeDir.z -= 1.5;
        gameState.isBoosting = true;
    } else {
        gameState.isBoosting = false;
    }

    if (isActionActive('reverse')) strafeDir.z += 0.8;

    strafeDir.applyQuaternion(player.quaternion);
    strafeDir.normalize();

    if (strafeDir.length() > 0) {
        playerVelocity.lerp(strafeDir.multiplyScalar(moveSpeed), deltaTime * 6);
    } else {
        playerVelocity.lerp(new THREE.Vector3(), deltaTime * 2);
    }

    player.position.add(playerVelocity.clone().multiplyScalar(deltaTime));

    // Collision resolution
    const correctedPos = resolveCollisions(player.position, playerVelocity, 5, towerBlocks, towerBodies);
    player.position.copy(correctedPos);

    // Clamp position
    player.position.x = THREE.MathUtils.clamp(player.position.x, GAME_BOUNDS.minX, GAME_BOUNDS.maxX);
    player.position.y = THREE.MathUtils.clamp(player.position.y, GAME_BOUNDS.minY, GAME_BOUNDS.maxY);
    player.position.z = THREE.MathUtils.clamp(player.position.z, GAME_BOUNDS.minZ, GAME_BOUNDS.maxZ);

    // Turret follows ship in descent mode
    if (turret) {
        turret.rotation.y = THREE.MathUtils.lerp(turret.rotation.y, 0, deltaTime * 10);
        turret.rotation.x = THREE.MathUtils.lerp(turret.rotation.x, 0, deltaTime * 10);
    }

    // Engine light
    if (player.userData.engineLight) {
        player.userData.engineLight.intensity = gameState.isBoosting ? 4 : 2;
    }

    // Camera
    if (cameraViewMode === 'first') {
        const cockpitOffset = new THREE.Vector3(0, 1.5, -2);
        cockpitOffset.applyQuaternion(player.quaternion);
        const targetCameraPos = player.position.clone().add(cockpitOffset);
        camera.position.lerp(targetCameraPos, deltaTime * 15);

        const lookAhead = new THREE.Vector3(0, 0, -100);
        lookAhead.applyQuaternion(player.quaternion);
        const lookTarget = camera.position.clone().add(lookAhead);
        camera.lookAt(lookTarget);

        // Camera banking
        let targetRoll = 0;
        const maxBankAngle = 0.25;
        if (isActionActive('left')) targetRoll = maxBankAngle;
        if (isActionActive('right')) targetRoll = -maxBankAngle;

        let targetPitch = 0;
        const maxPitchAngle = 0.05;
        if (isActionActive('forward')) targetPitch = -maxPitchAngle;
        if (isActionActive('backward')) targetPitch = maxPitchAngle;

        cameraRoll = THREE.MathUtils.lerp(cameraRoll, targetRoll, deltaTime * 8);
        cameraPitch = THREE.MathUtils.lerp(cameraPitch, targetPitch, deltaTime * 8);

        const pitchQuatCam = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cameraPitch);
        camera.quaternion.multiply(pitchQuatCam);

        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), cameraRoll);
        camera.quaternion.multiply(rollQuat);

        player.visible = false;
    } else {
        cameraRoll = THREE.MathUtils.lerp(cameraRoll, 0, deltaTime * 5);
        cameraPitch = THREE.MathUtils.lerp(cameraPitch, 0, deltaTime * 5);

        const cameraOffset = new THREE.Vector3(0, 8, 35);
        cameraOffset.applyQuaternion(player.quaternion);

        const targetCameraPos = player.position.clone().add(cameraOffset);
        camera.position.lerp(targetCameraPos, deltaTime * 5);

        const lookTarget = player.position.clone();
        const lookAhead = new THREE.Vector3(0, 0, -15);
        lookAhead.applyQuaternion(player.quaternion);
        lookTarget.add(lookAhead);
        camera.lookAt(lookTarget);

        player.visible = true;
    }
}

/**
 * Get firing direction (fires in ship direction)
 */
export function getFiringDirection() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(player.quaternion);
    return forward;
}

/**
 * Get projectile spawn position (fires from ship front)
 */
export function getFireSpawnPosition(direction) {
    return player.position.clone().add(direction.clone().multiplyScalar(8));
}

/**
 * Set turret visibility based on control scheme
 */
export function setTurretVisible(visible) {
    if (turret) {
        turret.visible = visible;
    }
}

/**
 * Get descent pitch for cockpit display
 */
export function getDescentPitch() {
    return descentPitch;
}
