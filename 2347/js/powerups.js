/**
 * TOWER DEFENDER 2347 - Powerups Module
 * MegaBonk-style random powerup drops during gameplay
 */

import { POWERUPS } from './config.js';

let powerups = [];
let activePowerups = {};
let rubberDuckDrone = null;

/**
 * Spawn a random powerup at a position
 */
export function spawnPowerup(scene, position) {
    const powerupKeys = Object.keys(POWERUPS);
    const randomKey = powerupKeys[Math.floor(Math.random() * powerupKeys.length)];
    const config = POWERUPS[randomKey];

    const powerup = new THREE.Group();

    // Create floating orb
    const orbGeometry = new THREE.SphereGeometry(3, 12, 12);
    const orbMaterial = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: 0.8,
        roughness: 0.2,
        emissive: config.color,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    powerup.add(orb);

    // Glowing ring
    const ringGeometry = new THREE.TorusGeometry(4, 0.5, 8, 24);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    powerup.add(ring);

    // Point light
    const light = new THREE.PointLight(config.color, 2, 30);
    powerup.add(light);

    powerup.position.copy(position);
    powerup.position.y += 10; // Float above drop location

    powerup.userData = {
        type: randomKey,
        config: config,
        lifetime: 15, // Despawn after 15 seconds
        bobOffset: Math.random() * Math.PI * 2
    };

    scene.add(powerup);
    powerups.push(powerup);

    return powerup;
}

/**
 * Update all powerups
 */
export function updatePowerups(scene, deltaTime, playerPosition) {
    // Update floating powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const data = powerup.userData;

        // Bobbing animation
        data.bobOffset += deltaTime * 2;
        powerup.position.y += Math.sin(data.bobOffset) * 0.03;

        // Rotate ring
        if (powerup.children[1]) {
            powerup.children[1].rotation.z += deltaTime * 2;
        }

        // Check for player pickup
        const distance = powerup.position.distanceTo(playerPosition);
        if (distance < 15) {
            collectPowerup(scene, powerup);
            powerups.splice(i, 1);
            continue;
        }

        // Lifetime
        data.lifetime -= deltaTime;
        if (data.lifetime <= 0) {
            scene.remove(powerup);
            powerups.splice(i, 1);
            continue;
        }

        // Flash when about to despawn
        if (data.lifetime < 3) {
            const flash = Math.sin(data.lifetime * 10) > 0;
            powerup.visible = flash;
        }
    }

    // Update rubber duck drone if active
    if (rubberDuckDrone) {
        updateRubberDuckDrone(deltaTime, playerPosition);
    }
}

/**
 * Collect a powerup
 */
function collectPowerup(scene, powerup) {
    const data = powerup.userData;
    const config = data.config;

    // Show pickup notification
    showPowerupNotification(config);

    // Apply effect
    applyPowerupEffect(scene, data.type, config);

    // Remove from scene
    scene.remove(powerup);
}

/**
 * Apply powerup effect
 */
function applyPowerupEffect(scene, type, config) {
    switch (config.effect) {
        case 'fireRate':
        case 'speed':
        case 'scoreMultiplier':
        case 'invincible':
        case 'shield':
            // Timed effects
            activePowerups[type] = {
                config: config,
                timeRemaining: config.duration
            };
            break;

        case 'autoTarget':
            // Spawn rubber duck drone
            activePowerups[type] = {
                config: config,
                timeRemaining: config.duration
            };
            spawnRubberDuckDrone(scene);
            break;

        case 'megaShot':
            // Instant effect - handled by game.js when shooting
            activePowerups[type] = {
                config: config,
                shots: 1
            };
            break;

        case 'restoreBlock':
            // Instant effect - signal to game.js
            activePowerups[type] = {
                config: config,
                pending: true
            };
            break;

        case 'healTower':
            // Instant effect - signal to game.js
            activePowerups[type] = {
                config: config,
                pending: true,
                amount: config.amount
            };
            break;

        case 'money':
            // Instant effect - signal to game.js
            activePowerups[type] = {
                config: config,
                pending: true,
                amount: config.amount
            };
            break;
    }
}

/**
 * Update active powerup timers
 */
export function updateActivePowerups(deltaTime) {
    for (const [type, data] of Object.entries(activePowerups)) {
        if (data.timeRemaining !== undefined) {
            data.timeRemaining -= deltaTime;
            if (data.timeRemaining <= 0) {
                // Effect expired
                if (type === 'rubberDuck' || type === 'autoTarget') {
                    removeRubberDuckDrone();
                }
                delete activePowerups[type];
            }
        }
    }
}

/**
 * Show powerup notification
 */
function showPowerupNotification(config) {
    const notification = document.createElement('div');
    notification.className = 'powerup-notification';
    notification.innerHTML = `
        <span class="powerup-icon">${config.icon}</span>
        <span class="powerup-name">${config.name}</span>
        <span class="powerup-desc">${config.description}</span>
    `;

    const container = document.getElementById('powerup-notifications');
    if (container) {
        container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove after animation
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
}

/**
 * Spawn rubber duck drone
 */
function spawnRubberDuckDrone(scene) {
    if (rubberDuckDrone) {
        scene.remove(rubberDuckDrone);
    }

    rubberDuckDrone = new THREE.Group();

    // Duck body (simplified)
    const bodyGeometry = new THREE.SphereGeometry(2, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        metalness: 0.3,
        roughness: 0.7,
        emissive: 0xffcc00,
        emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rubberDuckDrone.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(1, 1.2, 0);
    rubberDuckDrone.add(head);

    // Beak
    const beakGeometry = new THREE.ConeGeometry(0.5, 1, 6);
    const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(2.2, 1.2, 0);
    beak.rotation.z = -Math.PI / 2;
    rubberDuckDrone.add(beak);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.2, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(1.5, 1.6, 0.6);
    rubberDuckDrone.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1.5, 1.6, -0.6);
    rubberDuckDrone.add(rightEye);

    rubberDuckDrone.userData = {
        angle: 0,
        target: null,
        fireCooldown: 0
    };

    scene.add(rubberDuckDrone);
}

/**
 * Update rubber duck drone
 */
function updateRubberDuckDrone(deltaTime, playerPosition) {
    if (!rubberDuckDrone) return;

    const data = rubberDuckDrone.userData;

    // Orbit around player
    data.angle += deltaTime * 2;
    const orbitRadius = 15;
    rubberDuckDrone.position.set(
        playerPosition.x + Math.cos(data.angle) * orbitRadius,
        playerPosition.y + 5 + Math.sin(data.angle * 2) * 2,
        playerPosition.z + Math.sin(data.angle) * orbitRadius
    );

    // Look forward in orbit direction
    const lookTarget = new THREE.Vector3(
        playerPosition.x + Math.cos(data.angle + 0.5) * orbitRadius,
        playerPosition.y + 5,
        playerPosition.z + Math.sin(data.angle + 0.5) * orbitRadius
    );
    rubberDuckDrone.lookAt(lookTarget);
}

/**
 * Remove rubber duck drone
 */
function removeRubberDuckDrone() {
    if (rubberDuckDrone && rubberDuckDrone.parent) {
        rubberDuckDrone.parent.remove(rubberDuckDrone);
    }
    rubberDuckDrone = null;
}

/**
 * Get rubber duck drone for auto-targeting
 */
export function getRubberDuckDrone() {
    return rubberDuckDrone;
}

/**
 * Check if a powerup effect is active
 */
export function isPowerupActive(type) {
    return activePowerups[type] !== undefined;
}

/**
 * Get active powerup data
 */
export function getActivePowerup(type) {
    return activePowerups[type];
}

/**
 * Get all active powerups
 */
export function getActivePowerups() {
    return activePowerups;
}

/**
 * Consume a pending powerup effect
 */
export function consumePowerup(type) {
    if (activePowerups[type]) {
        if (activePowerups[type].pending) {
            const data = activePowerups[type];
            delete activePowerups[type];
            return data;
        }
        if (activePowerups[type].shots !== undefined) {
            activePowerups[type].shots--;
            if (activePowerups[type].shots <= 0) {
                delete activePowerups[type];
            }
            return true;
        }
    }
    return null;
}

/**
 * Get powerup multiplier for an effect type
 */
export function getPowerupMultiplier(effectType) {
    for (const data of Object.values(activePowerups)) {
        if (data.config && data.config.effect === effectType && data.config.multiplier) {
            return data.config.multiplier;
        }
    }
    return 1;
}

/**
 * Check if tower is shielded
 */
export function isTowerShielded() {
    return isPowerupActive('firewall');
}

/**
 * Check if player is invincible
 */
export function isPlayerInvincible() {
    return isPowerupActive('viralTweet');
}

/**
 * Clear all powerups
 */
export function clearPowerups(scene) {
    powerups.forEach(p => scene.remove(p));
    powerups = [];
    activePowerups = {};
    removeRubberDuckDrone();
}

/**
 * Get active powerups display data
 */
export function getActivePowerupsDisplay() {
    const display = [];
    for (const [type, data] of Object.entries(activePowerups)) {
        if (data.timeRemaining !== undefined) {
            display.push({
                type: type,
                icon: data.config.icon,
                name: data.config.name,
                timeRemaining: Math.ceil(data.timeRemaining)
            });
        }
    }
    return display;
}
