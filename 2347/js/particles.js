/**
 * TOWER DEFENDER 2347 - Particles Module
 * Particle system and explosions
 */

import { PARTICLE_SETTINGS } from './config.js';

let particlePool = [];
let explosions = [];
let particles = [];
let sharedParticleGeometry = null;
let sharedExplosionCoreGeometry = null;
let sharedExplosionGlowGeometry = null;

/**
 * Initialize the particle system
 */
export function initParticleSystem(scene) {
    // Create shared geometries
    sharedParticleGeometry = new THREE.SphereGeometry(0.4, 4, 4);
    sharedExplosionCoreGeometry = new THREE.SphereGeometry(1, 6, 6);
    sharedExplosionGlowGeometry = new THREE.SphereGeometry(2, 6, 6);

    // Pre-allocate particle pool
    for (let i = 0; i < PARTICLE_SETTINGS.maxParticles; i++) {
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0
        });
        const particle = new THREE.Mesh(sharedParticleGeometry, material);
        particle.visible = false;
        particle.userData = {
            active: false,
            velocity: new THREE.Vector3(),
            lifetime: 0,
            maxLifetime: 1,
            gravity: -15
        };
        scene.add(particle);
        particlePool.push(particle);
    }
}

/**
 * Get a pooled particle
 */
function getPooledParticle() {
    for (let i = 0; i < particlePool.length; i++) {
        if (!particlePool[i].userData.active) {
            return particlePool[i];
        }
    }
    return particlePool[0];
}

/**
 * Spawn a pooled particle
 */
function spawnPooledParticle(position, color) {
    const particle = getPooledParticle();

    particle.position.copy(position);
    particle.material.color.setHex(color);
    particle.material.opacity = 1;
    particle.visible = true;
    particle.scale.setScalar(0.8 + Math.random() * 0.4);

    particle.userData.active = true;
    particle.userData.velocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15 + 5,
        (Math.random() - 0.5) * 15
    );
    particle.userData.lifetime = 0.6 + Math.random() * 0.4;
    particle.userData.maxLifetime = particle.userData.lifetime;
}

/**
 * Create an explosion
 */
export function createExplosion(scene, position, size = 5, color = 0xff6600) {
    const explosion = new THREE.Group();

    // Core flash
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const core = new THREE.Mesh(sharedExplosionCoreGeometry, coreMaterial);
    core.scale.setScalar(size);
    explosion.add(core);

    // Outer glow
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
    });
    const glow = new THREE.Mesh(sharedExplosionGlowGeometry, glowMaterial);
    glow.scale.setScalar(size);
    explosion.add(glow);

    explosion.position.copy(position);
    explosion.userData = {
        lifetime: 0.4,
        maxSize: size * 2.5,
        currentSize: size
    };

    scene.add(explosion);
    explosions.push(explosion);

    // Create particles
    for (let i = 0; i < PARTICLE_SETTINGS.particlesPerExplosion; i++) {
        spawnPooledParticle(position, color);
    }
}

/**
 * Update explosions
 */
export function updateExplosions(scene, deltaTime) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        const data = explosion.userData;

        data.lifetime -= deltaTime;

        const progress = 1 - (data.lifetime / 0.5);
        const scale = 1 + progress * 2;
        explosion.scale.set(scale, scale, scale);

        explosion.children.forEach(child => {
            if (child.material) {
                child.material.opacity = 1 - progress;
            }
        });

        if (data.lifetime <= 0) {
            scene.remove(explosion);
            explosions.splice(i, 1);
        }
    }
}

/**
 * Update particles
 */
export function updateParticles(deltaTime) {
    // Update pooled particles
    for (let i = 0; i < particlePool.length; i++) {
        const particle = particlePool[i];
        const data = particle.userData;

        if (!data.active) continue;

        data.velocity.y += data.gravity * deltaTime;
        particle.position.x += data.velocity.x * deltaTime;
        particle.position.y += data.velocity.y * deltaTime;
        particle.position.z += data.velocity.z * deltaTime;

        data.lifetime -= deltaTime;
        const lifetimeRatio = Math.max(0, data.lifetime / data.maxLifetime);
        particle.material.opacity = lifetimeRatio;

        if (data.lifetime <= 0) {
            data.active = false;
            particle.visible = false;
        }
    }

    // Update legacy particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const data = particle.userData;

        if (particlePool.includes(particle)) continue;

        data.velocity.y += data.gravity * deltaTime;
        particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));

        data.lifetime -= deltaTime;
        particle.material.opacity = data.lifetime;

        if (data.lifetime <= 0) {
            particles.splice(i, 1);
        }
    }
}

/**
 * Clear all effects
 */
export function clearEffects(scene) {
    explosions.forEach(e => scene.remove(e));
    explosions = [];

    particles.forEach(p => {
        if (!particlePool.includes(p)) {
            scene.remove(p);
        }
    });
    particles = [];

    particlePool.forEach(p => {
        p.userData.active = false;
        p.visible = false;
    });
}

/**
 * Get explosions array
 */
export function getExplosions() {
    return explosions;
}

/**
 * Get particles array
 */
export function getParticles() {
    return particles;
}
