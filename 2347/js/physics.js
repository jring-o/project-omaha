/**
 * TOWER DEFENDER 2347 - Physics Module
 * Cannon.js physics world and collision handling
 */

import { PHYSICS_SETTINGS } from './config.js';

let physicsWorld = null;
let physicsEnabled = false;
let debrisParticles = [];
let collisionDamageCallback = null;

/**
 * Initialize the physics world
 */
export function initPhysicsWorld() {
    physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, PHYSICS_SETTINGS.gravity, 0);
    physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    physicsWorld.solver.iterations = 20;
    physicsWorld.allowSleep = true;

    // Create ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.y = -5;
    physicsWorld.addBody(groundBody);

    return physicsWorld;
}

/**
 * Get the physics world
 */
export function getPhysicsWorld() {
    return physicsWorld;
}

/**
 * Enable physics simulation
 */
export function enablePhysics() {
    physicsEnabled = true;
}

/**
 * Disable physics simulation
 */
export function disablePhysics() {
    physicsEnabled = false;
}

/**
 * Check if physics is enabled
 */
export function isPhysicsEnabled() {
    return physicsEnabled;
}

/**
 * Create physics body for a block
 */
export function createBlockPhysicsBody(mesh, width, height, depth, x, y, z, isStatic = true) {
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: isStatic ? 0 : Math.max(5, width * height * depth * 0.02),
        shape: shape,
        position: new CANNON.Vec3(x, y, z),
        material: new CANNON.Material({
            friction: 0.9,
            restitution: 0.0
        }),
        linearDamping: 0.7,
        angularDamping: 0.9,
        sleepSpeedLimit: 0.2,
        sleepTimeLimit: 0.3
    });
    body.allowSleep = true;
    body.userData = { mesh: mesh, isBlock: true };

    // Add collision event listener for damage on impact
    body.addEventListener('collide', (event) => {
        if (!physicsEnabled) return;

        // Calculate impact velocity
        const relativeVelocity = event.contact.getImpactVelocityAlongNormal();
        const impactSpeed = Math.abs(relativeVelocity);

        // Only damage if impact is significant (falling/tumbling)
        if (impactSpeed > 8) {
            // Scale damage based on impact speed (gradual, not instant death)
            const damage = Math.min(25, (impactSpeed - 8) * 1.5);

            if (collisionDamageCallback && mesh.userData && mesh.userData.health > 0) {
                collisionDamageCallback(mesh, damage);
            }
        }
    });

    physicsWorld.addBody(body);
    return body;
}

/**
 * Set callback for collision damage
 */
export function setCollisionDamageCallback(callback) {
    collisionDamageCallback = callback;
}

/**
 * Create static foundation body
 */
export function createFoundation(width, height, depth, y) {
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(0, y, 0);
    physicsWorld.addBody(body);
    return body;
}

/**
 * Create debris particles from a destroyed block
 */
export function createDebrisParticles(scene, position, size, velocity, color) {
    const particleCount = PHYSICS_SETTINGS.debrisCount;

    for (let i = 0; i < particleCount; i++) {
        const px = position.x + (Math.random() - 0.5) * size.width;
        const py = position.y + (Math.random() - 0.5) * size.height;
        const pz = position.z + (Math.random() - 0.5) * size.depth;

        const particleSize = Math.min(size.width, size.height, size.depth) * (0.1 + Math.random() * 0.15);

        const geometry = new THREE.BoxGeometry(particleSize, particleSize, particleSize);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.5,
            roughness: 0.5,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(px, py, pz);
        mesh.castShadow = true;
        scene.add(mesh);

        const shape = new CANNON.Box(new CANNON.Vec3(particleSize / 2, particleSize / 2, particleSize / 2));
        const body = new CANNON.Body({
            mass: 0.1,
            shape: shape,
            position: new CANNON.Vec3(px, py, pz),
            material: new CANNON.Material({ friction: 0.8, restitution: 0.3 }),
            linearDamping: 0.2,
            angularDamping: 0.2
        });

        const spreadSpeed = 5 + Math.random() * 15;
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.3) * Math.PI;

        body.velocity.set(
            velocity.x * 0.5 + Math.cos(angle) * Math.cos(elevation) * spreadSpeed,
            velocity.y * 0.5 + Math.abs(Math.sin(elevation)) * spreadSpeed + Math.random() * 5,
            velocity.z * 0.5 + Math.sin(angle) * Math.cos(elevation) * spreadSpeed
        );

        body.angularVelocity.set(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        );

        physicsWorld.addBody(body);

        debrisParticles.push({
            mesh: mesh,
            body: body,
            lifetime: PHYSICS_SETTINGS.debrisLifetime * (0.7 + Math.random() * 0.6),
            age: 0
        });
    }
}

/**
 * Update physics simulation
 */
export function updatePhysics(scene, deltaTime, towerBlocks, towerBodies, onBlockDestroy) {
    if (!physicsWorld || !physicsEnabled) return;

    physicsWorld.step(1 / 60, deltaTime, 3);

    // Sync tower block meshes
    for (let i = towerBlocks.length - 1; i >= 0; i--) {
        const mesh = towerBlocks[i];
        const body = towerBodies[i];

        if (body && body.mass > 0) {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);

            if (body.position.y < -50) {
                if (onBlockDestroy) {
                    onBlockDestroy(mesh, i);
                }
            }
        }
    }

    // Update debris particles
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
        const particle = debrisParticles[i];
        particle.age += deltaTime;

        particle.mesh.position.copy(particle.body.position);
        particle.mesh.quaternion.copy(particle.body.quaternion);

        if (particle.age > particle.lifetime * 0.7) {
            const fadeProgress = (particle.age - particle.lifetime * 0.7) / (particle.lifetime * 0.3);
            particle.mesh.material.opacity = 1 - fadeProgress;
            particle.mesh.material.transparent = true;
        }

        if (particle.age > particle.lifetime || particle.body.position.y < -100) {
            physicsWorld.removeBody(particle.body);
            scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
            debrisParticles.splice(i, 1);
        }
    }
}

/**
 * Remove a body from the physics world
 */
export function removeBody(body) {
    if (physicsWorld && body) {
        physicsWorld.removeBody(body);
    }
}

/**
 * Wake up bodies near a position
 */
export function wakeNearbyBodies(towerBodies, position, radius = 100) {
    towerBodies.forEach(body => {
        if (body && body.position) {
            const dist = Math.sqrt(
                Math.pow(body.position.x - position.x, 2) +
                Math.pow(body.position.y - position.y, 2) +
                Math.pow(body.position.z - position.z, 2)
            );
            if (dist < radius) {
                body.wakeUp();
            }
        }
    });
}

/**
 * Clear all debris particles
 */
export function clearDebris(scene) {
    debrisParticles.forEach(particle => {
        if (particle.body && physicsWorld) {
            physicsWorld.removeBody(particle.body);
        }
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
    });
    debrisParticles = [];
}

/**
 * Check sphere-box collision with tower blocks
 */
export function checkBlockCollision(position, radius, towerBlocks, towerBodies) {
    for (let i = 0; i < towerBlocks.length; i++) {
        const block = towerBlocks[i];
        const body = towerBodies[i];
        if (!body) continue;

        const dims = block.geometry.parameters;
        const blockPos = block.position;

        const halfW = dims.width / 2 + radius;
        const halfH = dims.height / 2 + radius;
        const halfD = dims.depth / 2 + radius;

        if (position.x > blockPos.x - halfW && position.x < blockPos.x + halfW &&
            position.y > blockPos.y - halfH && position.y < blockPos.y + halfH &&
            position.z > blockPos.z - halfD && position.z < blockPos.z + halfD) {

            const overlapX = Math.min(
                position.x - (blockPos.x - halfW),
                (blockPos.x + halfW) - position.x
            );
            const overlapY = Math.min(
                position.y - (blockPos.y - halfH),
                (blockPos.y + halfH) - position.y
            );
            const overlapZ = Math.min(
                position.z - (blockPos.z - halfD),
                (blockPos.z + halfD) - position.z
            );

            const pushVector = new THREE.Vector3();

            if (overlapX <= overlapY && overlapX <= overlapZ) {
                pushVector.x = position.x < blockPos.x ? -overlapX : overlapX;
            } else if (overlapY <= overlapX && overlapY <= overlapZ) {
                pushVector.y = position.y < blockPos.y ? -overlapY : overlapY;
            } else {
                pushVector.z = position.z < blockPos.z ? -overlapZ : overlapZ;
            }

            return { collided: true, pushVector: pushVector, block: block };
        }
    }

    return { collided: false, pushVector: new THREE.Vector3(), block: null };
}

/**
 * Resolve collisions iteratively
 */
export function resolveCollisions(position, velocity, radius, towerBlocks, towerBodies, maxIterations = 3) {
    const correctedPos = position.clone();

    for (let iter = 0; iter < maxIterations; iter++) {
        const result = checkBlockCollision(correctedPos, radius, towerBlocks, towerBodies);

        if (!result.collided) break;

        correctedPos.add(result.pushVector);

        if (result.pushVector.x !== 0) velocity.x = 0;
        if (result.pushVector.y !== 0) velocity.y = 0;
        if (result.pushVector.z !== 0) velocity.z = 0;
    }

    return correctedPos;
}
