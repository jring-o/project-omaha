/**
 * TOWER DEFENDER 2347 - Tower Module
 * Tower building and damage system
 */

import { BLOCK_DATA, SCALE } from './config.js';
import {
    createBlockPhysicsBody,
    createFoundation,
    createDebrisParticles,
    removeBody,
    wakeNearbyBodies
} from './physics.js';

let towerBlocks = [];
let towerBodies = [];

/**
 * Get block material based on height
 */
function getBlockMaterial(y) {
    const normalizedY = y / 250;
    const hue = 0.5 + normalizedY * 0.15;
    const color = new THREE.Color().setHSL(hue, 0.7, 0.5);

    return new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.4,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.1
    });
}

/**
 * Create the tower from block data
 */
export function createTower(scene) {
    towerBlocks = [];
    towerBodies = [];

    const GROUND_Y = 0;

    // Sort blocks by Y (lowest first)
    const sortedBlocks = BLOCK_DATA.map((block, index) => ({
        ...block,
        originalIndex: index
    })).sort((a, b) => a.y - b.y);

    const placedSurfaces = [];

    function findSurfaceBelow(x, z, blockWidth, blockDepth, intendedY, blockHeight) {
        const intendedBottom = intendedY - blockHeight / 2;
        let bestSurfaceY = GROUND_Y;
        let bestDistance = Math.abs(GROUND_Y - intendedBottom);

        for (const surface of placedSurfaces) {
            const overlapX = Math.abs(x - surface.x) < (blockWidth / 2 + surface.width / 2);
            const overlapZ = Math.abs(z - surface.z) < (blockDepth / 2 + surface.depth / 2);

            if (overlapX && overlapZ) {
                const distance = Math.abs(surface.topY - intendedBottom);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestSurfaceY = surface.topY;
                }
            }
        }

        return bestSurfaceY;
    }

    sortedBlocks.forEach((block) => {
        const width = block.width * SCALE;
        const height = block.height * SCALE;
        const depth = block.depth * SCALE;
        const x = block.x * SCALE;
        const z = block.z * SCALE;
        const intendedY = block.y * SCALE;

        const surfaceY = findSurfaceBelow(x, z, width, depth, intendedY, height);
        const y = surfaceY + height / 2;

        placedSurfaces.push({
            x: x,
            z: z,
            width: width,
            depth: depth,
            topY: surfaceY + height
        });

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = getBlockMaterial(y);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Edge highlighting
        const edges = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
        mesh.add(edgeLines);

        mesh.userData = {
            index: block.originalIndex,
            health: 100,
            maxHealth: 100,
            originalColor: material.color.clone(),
            pendingDestruction: false
        };

        scene.add(mesh);
        towerBlocks.push(mesh);

        const body = createBlockPhysicsBody(mesh, width, height, depth, x, y, z, false);
        towerBodies.push(body);
    });

    // Create foundation
    createFoundation(200, 20, 200, -10);

    console.log(`Tower built with ${sortedBlocks.length} blocks`);
}

/**
 * Get tower blocks
 */
export function getTowerBlocks() {
    return towerBlocks;
}

/**
 * Get tower bodies
 */
export function getTowerBodies() {
    return towerBodies;
}

/**
 * Damage a block
 */
export function damageBlock(scene, block, damage, onHealthUpdate, onDestroyed) {
    block.userData.health -= damage;

    // Visual feedback
    block.material.emissiveIntensity = 0.8;
    setTimeout(() => {
        if (block.material) block.material.emissiveIntensity = 0.1;
    }, 100);

    // Color shift based on damage
    const healthPercent = block.userData.health / block.userData.maxHealth;
    if (healthPercent < 0.5) {
        const damageColor = new THREE.Color().lerpColors(
            new THREE.Color(0xff3300),
            block.userData.originalColor,
            healthPercent * 2
        );
        block.material.color.copy(damageColor);
        block.material.emissive.copy(damageColor);
    }

    // Calculate total tower health
    let totalHealth = 0;
    let maxHealth = 0;
    towerBlocks.forEach(b => {
        if (b.userData) {
            totalHealth += Math.max(0, b.userData.health);
            maxHealth += b.userData.maxHealth;
        }
    });

    const towerHealth = maxHealth > 0 ? (totalHealth / maxHealth) * 100 : 0;

    if (onHealthUpdate) {
        onHealthUpdate(towerHealth);
    }

    // Check for block destruction
    if (block.userData.health <= 0 && !block.userData.pendingDestruction) {
        block.userData.pendingDestruction = true;

        if (onDestroyed) {
            onDestroyed(block);
        }

        triggerBlockCollapse(scene, block);
    }

    return towerHealth;
}

/**
 * Trigger block collapse
 */
export function triggerBlockCollapse(scene, mesh) {
    const pos = mesh.position.clone();
    destroyBlockWithDebris(scene, mesh);
    wakeNearbyBodies(towerBodies, pos, 100);
}

/**
 * Destroy a block with debris
 */
export function destroyBlockWithDebris(scene, mesh) {
    const bodyIndex = towerBlocks.indexOf(mesh);
    if (bodyIndex === -1) return;

    const body = towerBodies[bodyIndex];
    if (!body) return;

    const dims = mesh.geometry.parameters;
    const pos = {
        x: body.position.x,
        y: body.position.y,
        z: body.position.z
    };
    const vel = {
        x: body.velocity.x,
        y: body.velocity.y,
        z: body.velocity.z
    };

    createDebrisParticles(scene, pos, dims, vel, mesh.material.color);

    removeBody(body);
    scene.remove(mesh);

    towerBlocks.splice(bodyIndex, 1);
    towerBodies.splice(bodyIndex, 1);

    wakeNearbyBodies(towerBodies, pos, 50);
}

/**
 * Repair tower
 */
export function repairTower(amount) {
    towerBlocks.forEach(block => {
        block.userData.health = Math.min(block.userData.maxHealth, block.userData.health + amount);

        // Reset color
        const healthPercent = block.userData.health / block.userData.maxHealth;
        if (healthPercent >= 0.5) {
            block.material.color.copy(block.userData.originalColor);
            block.material.emissive.copy(block.userData.originalColor);
        }
    });
}

/**
 * Calculate tower health percentage
 */
export function calculateTowerHealth() {
    let totalHealth = 0;
    let maxHealth = 0;
    towerBlocks.forEach(b => {
        if (b.userData) {
            totalHealth += Math.max(0, b.userData.health);
            maxHealth += b.userData.maxHealth;
        }
    });
    return maxHealth > 0 ? (totalHealth / maxHealth) * 100 : 0;
}

/**
 * Clear tower
 */
export function clearTower(scene) {
    towerBlocks.forEach(b => scene.remove(b));
    towerBodies.forEach(body => {
        if (body) removeBody(body);
    });
    towerBlocks = [];
    towerBodies = [];
}

/**
 * Get block count
 */
export function getBlockCount() {
    return towerBlocks.length;
}
