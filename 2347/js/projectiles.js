/**
 * TOWER DEFENDER 2347 - Projectiles Module
 * Weapon firing and projectile management
 */

import { WEAPONS } from './config.js';
import { isActionActive } from './controls.js';
import { getFiringDirection, getFireSpawnPosition } from './player.js';
import { getEnemies, damageEnemy } from './enemies.js';
import { getPowerupMultiplier } from './powerups.js';

let projectiles = [];
let lastFireTime = 0;

/**
 * Create a projectile
 */
export function createProjectile(scene, position, direction, weapon, isEnemy = false) {
    const projectile = new THREE.Group();

    const geometry = isEnemy
        ? new THREE.SphereGeometry(weapon.size || 0.5, 6, 6)
        : new THREE.CylinderGeometry(weapon.size * 0.3, weapon.size * 0.3, weapon.size * 3, 6);

    const material = new THREE.MeshBasicMaterial({
        color: isEnemy ? 0xff0000 : weapon.color
    });

    const mesh = new THREE.Mesh(geometry, material);
    if (!isEnemy) mesh.rotation.x = Math.PI / 2;
    projectile.add(mesh);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(weapon.size * 1.5, 6, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: isEnemy ? 0xff0000 : weapon.color,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    projectile.add(glow);

    projectile.position.copy(position);

    projectile.userData = {
        direction: direction.clone().normalize(),
        speed: weapon.speed,
        damage: weapon.damage,
        isEnemy: isEnemy,
        homing: weapon.homing || false,
        lifetime: 5,
        target: null
    };

    // Find target for homing missiles
    if (weapon.homing && !isEnemy) {
        const enemies = getEnemies();
        if (enemies.length > 0) {
            let closestEnemy = null;
            let closestDistance = Infinity;
            enemies.forEach(enemy => {
                const dist = enemy.position.distanceTo(position);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestEnemy = enemy;
                }
            });
            projectile.userData.target = closestEnemy;
        }
    }

    scene.add(projectile);
    projectiles.push(projectile);

    return projectile;
}

/**
 * Fire player weapon
 */
export function fireWeapon(scene, currentWeapon) {
    const now = Date.now();
    const weapon = WEAPONS[currentWeapon];

    // Apply fire rate powerup (higher multiplier = faster firing = lower cooldown)
    const fireRateMultiplier = getPowerupMultiplier('fireRate');
    const actualFireRate = weapon.fireRate / fireRateMultiplier;

    if (now - lastFireTime < actualFireRate) return false;
    lastFireTime = now;

    const forward = getFiringDirection();

    for (let i = 0; i < weapon.count; i++) {
        const direction = forward.clone();

        if (weapon.spread > 0) {
            const spreadAngle = (i - (weapon.count - 1) / 2) * weapon.spread;
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
        }

        const spawnPos = getFireSpawnPosition(direction);
        createProjectile(scene, spawnPos, direction, weapon);
    }

    return true;
}

/**
 * Fire missile
 */
export function fireMissile(scene) {
    const now = Date.now();
    if (now - lastFireTime < 300) return false;
    lastFireTime = now;

    const forward = getFiringDirection();
    const spawnPos = getFireSpawnPosition(forward);
    createProjectile(scene, spawnPos, forward, WEAPONS[2]);

    return true;
}

/**
 * Fire enemy projectile
 */
export function fireEnemyProjectile(scene, enemy, targetBlock) {
    if (!targetBlock) return;

    const direction = targetBlock.position.clone().sub(enemy.position).normalize();
    const spawnPos = enemy.position.clone().add(direction.clone().multiplyScalar(4));

    createProjectile(scene, spawnPos, direction, {
        damage: enemy.userData.damage,
        speed: 3,
        color: 0xff0000,
        size: 0.5
    }, true);
}

/**
 * Update all projectiles
 */
export function updateProjectiles(scene, deltaTime, towerBlocks, onBlockHit, onEnemyHit, createExplosion) {
    const enemies = getEnemies();

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const data = projectile.userData;

        // Homing behavior
        if (data.homing && data.target && !data.isEnemy) {
            if (enemies.includes(data.target)) {
                const toTarget = data.target.position.clone().sub(projectile.position).normalize();
                data.direction.lerp(toTarget, deltaTime * 5);
                data.direction.normalize();
            }
        }

        // Move projectile
        projectile.position.add(data.direction.clone().multiplyScalar(data.speed * 60 * deltaTime));

        // Rotate to face direction
        projectile.lookAt(projectile.position.clone().add(data.direction));

        // Lifetime
        data.lifetime -= deltaTime;
        if (data.lifetime <= 0) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
            continue;
        }

        // Collisions
        if (data.isEnemy) {
            // Enemy projectiles hit tower blocks
            for (const block of towerBlocks) {
                if (projectile.position.distanceTo(block.position) < 5) {
                    if (onBlockHit) {
                        onBlockHit(block, data.damage);
                    }
                    if (createExplosion) {
                        createExplosion(projectile.position, 2, 0xff3300);
                    }
                    scene.remove(projectile);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Player projectiles hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (projectile.position.distanceTo(enemy.position) < 5) {
                    if (onEnemyHit) {
                        onEnemyHit(enemy, data.damage);
                    }
                    if (createExplosion) {
                        createExplosion(projectile.position, 3, 0x00ffff);
                    }
                    scene.remove(projectile);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }
}

/**
 * Get all projectiles
 */
export function getProjectiles() {
    return projectiles;
}

/**
 * Clear all projectiles
 */
export function clearProjectiles(scene) {
    projectiles.forEach(p => scene.remove(p));
    projectiles = [];
}

/**
 * Handle weapon firing based on input
 */
export function handleWeaponInput(scene, currentWeapon) {
    if (isActionActive('fire')) {
        fireWeapon(scene, currentWeapon);
    }
    if (isActionActive('altfire')) {
        fireMissile(scene);
    }
}
