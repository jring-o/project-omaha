/**
 * TOWER DEFENDER 2347 - Enemies Module
 * Enemy types, creation, AI behaviors, and boss mechanics
 */

import { ENEMY_TYPES } from './config.js';
import { resolveCollisions } from './physics.js';

let enemies = [];
let activeBoss = null;
let bossSpawnTimer = 0;

/**
 * Create an enemy
 */
export function createEnemy(scene, type = 'entitlement') {
    const enemy = new THREE.Group();
    const config = ENEMY_TYPES[type] || ENEMY_TYPES.entitlement;

    // Create visual based on enemy type
    createEnemyVisual(enemy, config, type);

    // Spawn position
    const angle = Math.random() * Math.PI * 2;
    const distance = config.isBoss ? 600 : 500 + Math.random() * 200;
    const height = config.isBoss ? 150 : 80 + Math.random() * 150;

    enemy.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
    );

    // Enemy data
    enemy.userData = {
        type: type,
        name: config.name,
        health: config.health,
        maxHealth: config.health,
        speed: config.speed,
        damage: config.damage,
        points: config.points,
        size: config.size,
        behavior: config.behavior,
        isBoss: config.isBoss || false,
        attackCooldown: 0,
        targetBlock: null,
        state: 'approaching',
        velocity: new THREE.Vector3(),
        // Behavior-specific data
        phaseTimer: 0,
        isPhased: false,
        currentSize: config.size,
        stealthed: config.behavior === 'stealth',
        lastSpawnTime: 0,
        drainTimer: 0,
        erraticTimer: 0,
        erraticDirection: new THREE.Vector3()
    };

    scene.add(enemy);
    enemies.push(enemy);

    if (config.isBoss) {
        activeBoss = enemy;
        showBossAnnouncement(config.name, config.description);
    }

    return enemy;
}

/**
 * Create enemy visual based on type
 */
function createEnemyVisual(enemy, config, type) {
    let bodyGeometry;
    const size = config.size;

    // Different shapes for different enemy types
    switch (config.behavior) {
        case 'swarm': // Entitlement - small pyramids
            bodyGeometry = new THREE.TetrahedronGeometry(2.5 * size);
            break;
        case 'tank': // Corporate - cube
            bodyGeometry = new THREE.BoxGeometry(5 * size, 5 * size, 5 * size);
            break;
        case 'phase': // Burnout - ghostly sphere
            bodyGeometry = new THREE.SphereGeometry(3 * size, 8, 8);
            break;
        case 'grow': // Scope Creep - starts small
            bodyGeometry = new THREE.DodecahedronGeometry(2 * size);
            break;
        case 'erratic': // Troll - spiky
            bodyGeometry = new THREE.IcosahedronGeometry(3 * size);
            break;
        case 'stealth': // Zero-Day - octahedron
            bodyGeometry = new THREE.OctahedronGeometry(2.5 * size);
            break;
        // Boss geometries
        case 'drain': // Heartbleed - pulsing heart shape (sphere for now)
            bodyGeometry = new THREE.SphereGeometry(4 * size, 12, 12);
            break;
        case 'remove': // Left-Pad Void - black hole (torus)
            bodyGeometry = new THREE.TorusGeometry(3 * size, 1.5 * size, 8, 16);
            break;
        case 'spawn': // Log4Shell - massive octahedron
            bodyGeometry = new THREE.OctahedronGeometry(4 * size);
            break;
        case 'corrupt': // Colors - chaotic shape
            bodyGeometry = new THREE.TorusKnotGeometry(2.5 * size, 0.8 * size, 64, 8);
            break;
        case 'infiltrate': // XZ - disguised (looks friendly at first)
            bodyGeometry = new THREE.CylinderGeometry(2 * size, 3 * size, 5 * size, 6);
            break;
        default:
            bodyGeometry = new THREE.OctahedronGeometry(3 * size);
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: config.isBoss ? 0.9 : 0.7,
        roughness: config.isBoss ? 0.1 : 0.3,
        emissive: config.color,
        emissiveIntensity: config.isBoss ? 0.5 : 0.3,
        transparent: config.behavior === 'phase' || config.behavior === 'stealth',
        opacity: config.behavior === 'stealth' ? 0.2 : (config.behavior === 'phase' ? 0.6 : 1.0)
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    enemy.add(body);

    // Glowing core
    const coreGeometry = new THREE.SphereGeometry(1.2 * size, 6, 6);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: config.isBoss ? 0xff0000 : 0xffffff,
        transparent: config.behavior === 'stealth',
        opacity: config.behavior === 'stealth' ? 0.1 : 1.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    enemy.add(core);

    // Boss health bar
    if (config.isBoss) {
        const healthBarBg = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 1),
            new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
        );
        healthBarBg.position.y = 8 * size;
        healthBarBg.name = 'healthBarBg';
        enemy.add(healthBarBg);

        const healthBar = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 0.8),
            new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
        );
        healthBar.position.y = 8 * size;
        healthBar.position.z = 0.01;
        healthBar.name = 'healthBar';
        enemy.add(healthBar);
    }
}

/**
 * Show boss announcement
 */
function showBossAnnouncement(name, description) {
    const announcement = document.getElementById('boss-announcement');
    if (announcement) {
        announcement.querySelector('.boss-name').textContent = name;
        announcement.querySelector('.boss-description').textContent = description;
        announcement.style.display = 'flex';

        setTimeout(() => {
            announcement.style.display = 'none';
        }, 4000);
    }
}

/**
 * Get all enemies
 */
export function getEnemies() {
    return enemies;
}

/**
 * Get active boss
 */
export function getActiveBoss() {
    return activeBoss;
}

/**
 * Update all enemies
 */
export function updateEnemies(deltaTime, towerBlocks, towerBodies, player, onAttack, onBossAction) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy.userData) continue;

        const data = enemy.userData;
        const config = ENEMY_TYPES[data.type];

        // Find target block
        if (!data.targetBlock || !towerBlocks.includes(data.targetBlock)) {
            if (towerBlocks.length > 0) {
                // Bosses target lower blocks, regular enemies random
                if (data.isBoss) {
                    const sortedBlocks = [...towerBlocks].sort((a, b) => a.position.y - b.position.y);
                    data.targetBlock = sortedBlocks[Math.floor(Math.random() * Math.min(5, sortedBlocks.length))];
                } else {
                    data.targetBlock = towerBlocks[Math.floor(Math.random() * towerBlocks.length)];
                }
            }
        }

        if (!data.targetBlock) continue;

        // Update based on behavior
        updateEnemyBehavior(enemy, deltaTime, towerBlocks, towerBodies, player, onAttack, onBossAction);

        // Update boss health bar
        if (data.isBoss) {
            updateBossHealthBar(enemy);
        }

        // Rotate body
        if (enemy.children[0]) {
            const rotSpeed = data.isBoss ? 1 : 2;
            enemy.children[0].rotation.y += deltaTime * rotSpeed;
            enemy.children[0].rotation.x += deltaTime * rotSpeed * 0.75;
        }
    }
}

/**
 * Update enemy behavior based on type
 */
function updateEnemyBehavior(enemy, deltaTime, towerBlocks, towerBodies, player, onAttack, onBossAction) {
    const data = enemy.userData;
    const config = ENEMY_TYPES[data.type];
    const enemyRadius = 3 * (data.currentSize || data.size);
    const targetPos = data.targetBlock.position.clone();
    const direction = targetPos.clone().sub(enemy.position);
    const distance = direction.length();
    direction.normalize();

    let moveVector = new THREE.Vector3();
    const baseSpeed = data.speed * 60 * deltaTime;

    switch (data.behavior) {
        case 'swarm':
            // Fast, direct approach
            moveVector = updateSwarmBehavior(enemy, direction, distance, baseSpeed, deltaTime);
            break;

        case 'tank':
            // Slow, steady, doesn't dodge
            moveVector = updateTankBehavior(enemy, direction, distance, baseSpeed, deltaTime);
            break;

        case 'phase':
            // Phases in and out, can bypass some defenses
            moveVector = updatePhaseBehavior(enemy, direction, distance, baseSpeed, deltaTime);
            break;

        case 'grow':
            // Gets bigger over time
            moveVector = updateGrowBehavior(enemy, direction, distance, baseSpeed, deltaTime, config);
            break;

        case 'erratic':
            // Unpredictable movement
            moveVector = updateErraticBehavior(enemy, direction, distance, baseSpeed, deltaTime);
            break;

        case 'stealth':
            // Invisible until close
            moveVector = updateStealthBehavior(enemy, direction, distance, baseSpeed, deltaTime, config);
            break;

        // Boss behaviors
        case 'drain':
            moveVector = updateDrainBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction);
            break;

        case 'remove':
            moveVector = updateRemoveBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction, towerBlocks);
            break;

        case 'spawn':
            moveVector = updateSpawnBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction, config);
            break;

        case 'corrupt':
            moveVector = updateCorruptBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction);
            break;

        case 'infiltrate':
            moveVector = updateInfiltrateBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction);
            break;

        default:
            moveVector = direction.clone().multiplyScalar(baseSpeed);
    }

    enemy.position.add(moveVector);

    // Collision resolution (bosses don't collide with tower)
    if (!data.isBoss) {
        const correctedPos = resolveCollisions(enemy.position, data.velocity, enemyRadius, towerBlocks, towerBodies);
        enemy.position.copy(correctedPos);
    }

    // Face target
    enemy.lookAt(targetPos);

    // Handle attacks
    if (distance < (data.isBoss ? 60 : 40)) {
        data.attackCooldown -= deltaTime;
        if (data.attackCooldown <= 0 && onAttack) {
            onAttack(enemy, data.targetBlock);
            data.attackCooldown = data.isBoss ? 1 + Math.random() : 2 + Math.random() * 2;
        }
    }

    // Avoid player (non-bosses only)
    if (!data.isBoss) {
        const toPlayer = player.position.clone().sub(enemy.position);
        if (toPlayer.length() < 30) {
            const avoidDir = toPlayer.normalize().multiplyScalar(-1);
            enemy.position.add(avoidDir.multiplyScalar(data.speed * 20 * deltaTime));
        }
    }
}

// Behavior update functions
function updateSwarmBehavior(enemy, direction, distance, baseSpeed, deltaTime) {
    if (distance > 30) {
        return direction.clone().multiplyScalar(baseSpeed * 1.5);
    } else {
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        return perpendicular.multiplyScalar(baseSpeed * 0.8);
    }
}

function updateTankBehavior(enemy, direction, distance, baseSpeed, deltaTime) {
    // Slow but relentless
    return direction.clone().multiplyScalar(baseSpeed * 0.5);
}

function updatePhaseBehavior(enemy, direction, distance, baseSpeed, deltaTime) {
    const data = enemy.userData;
    data.phaseTimer += deltaTime;

    // Phase in and out every 3 seconds
    if (data.phaseTimer > 3) {
        data.phaseTimer = 0;
        data.isPhased = !data.isPhased;

        // Update visual
        enemy.children.forEach(child => {
            if (child.material) {
                child.material.opacity = data.isPhased ? 0.2 : 0.6;
            }
        });
    }

    // Move faster when phased
    const speedMult = data.isPhased ? 2 : 1;
    return direction.clone().multiplyScalar(baseSpeed * speedMult);
}

function updateGrowBehavior(enemy, direction, distance, baseSpeed, deltaTime, config) {
    const data = enemy.userData;

    // Grow over time
    if (data.currentSize < (config.maxSize || 2.5)) {
        data.currentSize *= 1 + (0.02 * deltaTime);
        const scale = data.currentSize / data.size;
        enemy.scale.setScalar(scale);

        // Increase health and damage as it grows
        data.damage = config.damage * scale;
    }

    return direction.clone().multiplyScalar(baseSpeed);
}

function updateErraticBehavior(enemy, direction, distance, baseSpeed, deltaTime) {
    const data = enemy.userData;
    data.erraticTimer += deltaTime;

    // Change direction randomly
    if (data.erraticTimer > 0.5) {
        data.erraticTimer = 0;
        data.erraticDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5),
            (Math.random() - 0.5) * 2
        ).normalize();
    }

    // Mix target direction with erratic direction
    const mixed = direction.clone().lerp(data.erraticDirection, 0.5);
    return mixed.multiplyScalar(baseSpeed * 1.2);
}

function updateStealthBehavior(enemy, direction, distance, baseSpeed, deltaTime, config) {
    const data = enemy.userData;
    const stealthDist = config.stealthDistance || 100;

    // Become visible when close
    const shouldBeVisible = distance < stealthDist;

    if (data.stealthed && shouldBeVisible) {
        data.stealthed = false;
        enemy.children.forEach(child => {
            if (child.material) {
                child.material.opacity = 1.0;
                child.material.transparent = false;
            }
        });
    }

    return direction.clone().multiplyScalar(baseSpeed);
}

// Boss behavior functions
function updateDrainBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction) {
    const data = enemy.userData;
    data.drainTimer += deltaTime;

    // Pulse visual effect
    const pulse = Math.sin(data.drainTimer * 3) * 0.2 + 1;
    enemy.scale.setScalar(pulse);

    // Drain tower health periodically
    if (data.drainTimer > 2 && onBossAction) {
        data.drainTimer = 0;
        onBossAction('drain', { amount: 2 });
    }

    // Orbit the tower
    if (distance < 80) {
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        return perpendicular.multiplyScalar(baseSpeed);
    }
    return direction.clone().multiplyScalar(baseSpeed);
}

function updateRemoveBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction, towerBlocks) {
    const data = enemy.userData;

    // Periodically remove a block directly
    data.drainTimer = (data.drainTimer || 0) + deltaTime;
    if (data.drainTimer > 8 && onBossAction && towerBlocks.length > 0) {
        data.drainTimer = 0;
        const targetBlock = towerBlocks[Math.floor(Math.random() * towerBlocks.length)];
        onBossAction('remove', { block: targetBlock });
    }

    // Rotate the torus
    enemy.children[0].rotation.x += deltaTime * 2;

    return direction.clone().multiplyScalar(baseSpeed);
}

function updateSpawnBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction, config) {
    const data = enemy.userData;
    const now = Date.now();

    // Spawn minions periodically
    if (now - data.lastSpawnTime > (config.spawnRate || 5000) && onBossAction) {
        data.lastSpawnTime = now;
        onBossAction('spawn', { type: config.spawnType || 'zeroDay', position: enemy.position.clone() });
    }

    // Circle the tower at a distance
    if (distance < 100) {
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        return perpendicular.multiplyScalar(baseSpeed * 0.5);
    }
    return direction.clone().multiplyScalar(baseSpeed);
}

function updateCorruptBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction) {
    const data = enemy.userData;
    data.drainTimer = (data.drainTimer || 0) + deltaTime;

    // Random color changes
    if (Math.random() < 0.02) {
        const randomColor = Math.random() * 0xffffff;
        enemy.children[0].material.color.setHex(randomColor);
        enemy.children[0].material.emissive.setHex(randomColor);
    }

    // Corrupt random block periodically
    if (data.drainTimer > 5 && onBossAction) {
        data.drainTimer = 0;
        onBossAction('corrupt', {});
    }

    // Chaotic movement
    const chaos = new THREE.Vector3(
        Math.sin(data.drainTimer * 5) * 0.5,
        Math.cos(data.drainTimer * 3) * 0.3,
        Math.sin(data.drainTimer * 4) * 0.5
    );

    return direction.clone().add(chaos).normalize().multiplyScalar(baseSpeed * 1.5);
}

function updateInfiltrateBehavior(enemy, direction, distance, baseSpeed, deltaTime, onBossAction) {
    const data = enemy.userData;

    // Starts looking friendly (green), turns red as health decreases
    const healthPercent = data.health / data.maxHealth;
    if (healthPercent < 0.5) {
        // Reveal true nature
        const red = Math.floor((1 - healthPercent * 2) * 255);
        const green = Math.floor(healthPercent * 2 * 255);
        const color = (red << 16) | (green << 8);
        enemy.children[0].material.color.setHex(color);
        enemy.children[0].material.emissive.setHex(color);

        // More aggressive when revealed
        data.damage = ENEMY_TYPES.xz.damage * (2 - healthPercent);
    }

    return direction.clone().multiplyScalar(baseSpeed * (healthPercent < 0.5 ? 1.5 : 0.8));
}

/**
 * Update boss health bar
 */
function updateBossHealthBar(enemy) {
    const healthBar = enemy.getObjectByName('healthBar');
    if (healthBar) {
        const healthPercent = enemy.userData.health / enemy.userData.maxHealth;
        healthBar.scale.x = Math.max(0.01, healthPercent);
        healthBar.position.x = -5 * (1 - healthPercent);
    }
}

/**
 * Damage an enemy
 */
export function damageEnemy(scene, enemy, damage, onDestroyed) {
    const data = enemy.userData;

    // Phased enemies take less damage
    if (data.isPhased) {
        damage *= 0.3;
    }

    data.health -= damage;

    // Visual feedback
    enemy.children.forEach(child => {
        if (child.material && child.material.emissive) {
            child.material.emissiveIntensity = 1;
            setTimeout(() => {
                if (child.material) child.material.emissiveIntensity = data.isBoss ? 0.5 : 0.3;
            }, 50);
        }
    });

    if (data.health <= 0) {
        const color = enemy.children[0].material.color.getHex();
        const position = enemy.position.clone();
        const points = data.points;
        const isBoss = data.isBoss;
        const type = data.type;

        scene.remove(enemy);
        enemies.splice(enemies.indexOf(enemy), 1);

        if (isBoss) {
            activeBoss = null;
        }

        if (onDestroyed) {
            onDestroyed(position, color, points, isBoss, type);
        }

        return true;
    }

    return false;
}

/**
 * Remove an enemy
 */
export function removeEnemy(scene, enemy) {
    scene.remove(enemy);
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
        enemies.splice(index, 1);
    }
    if (enemy.userData.isBoss) {
        activeBoss = null;
    }
}

/**
 * Clear all enemies
 */
export function clearEnemies(scene) {
    enemies.forEach(e => scene.remove(e));
    enemies = [];
    activeBoss = null;
}

/**
 * Get enemy count
 */
export function getEnemyCount() {
    return enemies.length;
}

/**
 * Get boss count
 */
export function getBossCount() {
    return enemies.filter(e => e.userData.isBoss).length;
}

/**
 * Check if a boss is active
 */
export function isBossActive() {
    return activeBoss !== null;
}
