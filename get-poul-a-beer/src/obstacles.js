import * as THREE from 'three';
import { CONFIG, gameState, getLanePositions } from './config.js';

const obstaclePool = [];
const collectiblePool = [];
const powerupPool = [];
let activeObstacles = [];
let activeCollectibles = [];
let activePowerups = [];
let scene = null;

export function initObstacles(sceneRef) {
  scene = sceneRef;
  const { poolSize, types } = CONFIG.obstacles;

  // Create obstacle pool with mixed types
  const typeKeys = Object.keys(types);
  for (let i = 0; i < poolSize; i++) {
    const typeKey = typeKeys[i % typeKeys.length];
    const obstacle = createObstacle(types[typeKey], typeKey);
    obstacle.visible = false;
    scene.add(obstacle);
    obstaclePool.push(obstacle);
  }

  // Create collectible pool
  for (let i = 0; i < CONFIG.collectibles.poolSize; i++) {
    const collectible = createCollectible();
    collectible.visible = false;
    scene.add(collectible);
    collectiblePool.push(collectible);
  }

  // Create powerup pool
  const powerupTypes = Object.keys(CONFIG.powerups.types);
  for (let i = 0; i < CONFIG.powerups.poolSize; i++) {
    const typeKey = powerupTypes[i % powerupTypes.length];
    const powerup = createPowerup(typeKey);
    powerup.visible = false;
    scene.add(powerup);
    powerupPool.push(powerup);
  }
}

function createObstacle(config, typeName) {
  const geometry = new THREE.BoxGeometry(
    config.width,
    config.height,
    config.depth
  );
  const material = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: 0.6,
    metalness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Handle elevated obstacles (like slideBarrier) differently
  // They position based on bottomY rather than sitting on ground
  if (config.elevated && config.bottomY !== undefined) {
    mesh.position.y = config.bottomY + config.height / 2;
  } else {
    mesh.position.y = config.height / 2;
  }

  // Store metadata for collision detection
  mesh.userData = {
    type: 'obstacle',
    obstacleType: typeName,
    width: config.width,
    height: config.height,
    depth: config.depth,
    elevated: config.elevated || false,
    bottomY: config.bottomY || 0,
  };

  return mesh;
}

function createCollectible() {
  // Create a beer mug collectible
  const group = new THREE.Group();

  // Mug body (cylinder)
  const mugGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.4, 12);
  const mugMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const mugBody = new THREE.Mesh(mugGeometry, mugMaterial);
  mugBody.position.y = 0.2;
  group.add(mugBody);

  // Mug handle
  const handleGeometry = new THREE.TorusGeometry(0.1, 0.03, 6, 8, Math.PI);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.2,
    metalness: 0.1,
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.22, 0.2, 0);
  group.add(handle);

  // Beer liquid
  const liquidGeometry = new THREE.CylinderGeometry(0.17, 0.15, 0.32, 12);
  const liquidMaterial = new THREE.MeshStandardMaterial({
    color: CONFIG.collectibles.color,  // Amber beer color
    roughness: 0.3,
    metalness: 0.2,
    emissive: CONFIG.collectibles.color,
    emissiveIntensity: 0.3,
  });
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = 0.18;
  group.add(liquid);

  // Foam on top
  const foamGeometry = new THREE.CylinderGeometry(0.18, 0.17, 0.06, 12);
  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffef0,
    roughness: 0.8,
    metalness: 0,
    emissive: 0xfffef0,
    emissiveIntensity: 0.1,
  });
  const foam = new THREE.Mesh(foamGeometry, foamMaterial);
  foam.position.y = 0.37;
  group.add(foam);

  group.castShadow = true;
  group.position.y = 1.2;

  group.userData = {
    type: 'collectible',
    refillAmount: CONFIG.collectibles.refillAmount,
  };

  return group;
}

function createPowerup(typeKey) {
  const config = CONFIG.powerups.types[typeKey];
  const group = new THREE.Group();

  // Outer glow sphere
  const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: config.glowColor,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.3,
    emissive: config.glowColor,
    emissiveIntensity: 0.5,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.name = 'glow';
  group.add(glow);

  // Inner core
  const coreGeometry = new THREE.IcosahedronGeometry(0.3, 1);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: config.color,
    roughness: 0.3,
    metalness: 0.6,
    emissive: config.color,
    emissiveIntensity: 0.4,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.name = 'core';
  group.add(core);

  // Icon indicator based on powerup type
  const iconGroup = new THREE.Group();
  iconGroup.name = 'icon';

  if (typeKey === 'goldenBeer') {
    // Small beer mug icon
    const mugGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.15, 8);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 });
    const mug = new THREE.Mesh(mugGeom, mugMat);
    iconGroup.add(mug);
  } else if (typeKey === 'magnet') {
    // U-shape magnet
    const magnetGeom = new THREE.TorusGeometry(0.1, 0.03, 8, 8, Math.PI);
    const magnetMat = new THREE.MeshStandardMaterial({ color: 0x3498db, emissive: 0x3498db, emissiveIntensity: 0.3 });
    const magnet = new THREE.Mesh(magnetGeom, magnetMat);
    magnet.rotation.z = Math.PI;
    iconGroup.add(magnet);
  } else if (typeKey === 'shield') {
    // Shield shape (flattened sphere)
    const shieldGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x2ecc71, emissiveIntensity: 0.3 });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    shield.scale.set(1, 1, 0.3);
    iconGroup.add(shield);
  } else if (typeKey === 'speedSurge') {
    // Lightning bolt (simple triangle)
    const boltGeom = new THREE.ConeGeometry(0.06, 0.2, 3);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, emissive: 0xe74c3c, emissiveIntensity: 0.3 });
    const bolt = new THREE.Mesh(boltGeom, boltMat);
    bolt.rotation.z = Math.PI / 6;
    iconGroup.add(bolt);
  } else if (typeKey === 'slowMo') {
    // Clock face (ring)
    const clockGeom = new THREE.RingGeometry(0.08, 0.12, 16);
    const clockMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, emissive: 0x9b59b6, emissiveIntensity: 0.3, side: THREE.DoubleSide });
    const clock = new THREE.Mesh(clockGeom, clockMat);
    iconGroup.add(clock);
  } else if (typeKey === 'ghost') {
    // Ghost shape (oval)
    const ghostGeom = new THREE.SphereGeometry(0.1, 8, 6);
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    const ghost = new THREE.Mesh(ghostGeom, ghostMat);
    ghost.scale.set(1, 1.3, 0.8);
    iconGroup.add(ghost);
  } else if (typeKey === 'doubleScore') {
    // X2 represented by two small cubes
    const cubeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, emissive: 0xf39c12, emissiveIntensity: 0.3 });
    const cube1 = new THREE.Mesh(cubeGeom, cubeMat);
    cube1.position.x = -0.06;
    const cube2 = new THREE.Mesh(cubeGeom, cubeMat);
    cube2.position.x = 0.06;
    iconGroup.add(cube1);
    iconGroup.add(cube2);
  }

  iconGroup.position.y = 0;
  group.add(iconGroup);

  // Orbiting particles
  for (let i = 0; i < 3; i++) {
    const particleGeom = new THREE.SphereGeometry(0.05, 6, 6);
    const particleMat = new THREE.MeshStandardMaterial({
      color: config.glowColor,
      emissive: config.glowColor,
      emissiveIntensity: 0.6,
    });
    const particle = new THREE.Mesh(particleGeom, particleMat);
    particle.name = `orbitParticle${i}`;
    particle.userData.orbitOffset = (i / 3) * Math.PI * 2;
    particle.userData.orbitRadius = 0.4;
    group.add(particle);
  }

  group.position.y = 1.5;
  group.castShadow = true;

  group.userData = {
    type: 'powerup',
    powerupType: typeKey,
    config: config,
  };

  return group;
}

function getObstacleFromPool(excludeTypes = []) {
  for (const obstacle of obstaclePool) {
    if (!obstacle.visible && !excludeTypes.includes(obstacle.userData.obstacleType)) {
      obstacle.visible = true;
      return obstacle;
    }
  }
  return null;
}

function getCollectibleFromPool() {
  for (const collectible of collectiblePool) {
    if (!collectible.visible) {
      collectible.visible = true;
      return collectible;
    }
  }
  return null;
}

function returnObstacleToPool(obstacle) {
  obstacle.visible = false;
  const index = activeObstacles.indexOf(obstacle);
  if (index > -1) {
    activeObstacles.splice(index, 1);
  }
}

function returnCollectibleToPool(collectible) {
  collectible.visible = false;
  const index = activeCollectibles.indexOf(collectible);
  if (index > -1) {
    activeCollectibles.splice(index, 1);
  }
}

function getPowerupFromPool(preferredType = null) {
  // First try to get the preferred type
  if (preferredType) {
    for (const powerup of powerupPool) {
      if (!powerup.visible && powerup.userData.powerupType === preferredType) {
        powerup.visible = true;
        return powerup;
      }
    }
  }
  // Otherwise get any available powerup
  for (const powerup of powerupPool) {
    if (!powerup.visible) {
      powerup.visible = true;
      return powerup;
    }
  }
  return null;
}

function returnPowerupToPool(powerup) {
  powerup.visible = false;
  const index = activePowerups.indexOf(powerup);
  if (index > -1) {
    activePowerups.splice(index, 1);
  }
}

// Select a random powerup type based on spawn weights
function selectRandomPowerupType() {
  const types = CONFIG.powerups.types;
  const typeKeys = Object.keys(types);

  // Calculate total weight
  let totalWeight = 0;
  for (const key of typeKeys) {
    totalWeight += types[key].spawnWeight;
  }

  // Random selection
  let random = Math.random() * totalWeight;
  for (const key of typeKeys) {
    random -= types[key].spawnWeight;
    if (random <= 0) {
      return key;
    }
  }

  return typeKeys[0]; // Fallback
}

export function resetObstacles() {
  // Return all active items to pools
  for (const obstacle of [...activeObstacles]) {
    returnObstacleToPool(obstacle);
  }
  for (const collectible of [...activeCollectibles]) {
    returnCollectibleToPool(collectible);
  }
  for (const powerup of [...activePowerups]) {
    returnPowerupToPool(powerup);
  }

  activeObstacles = [];
  activeCollectibles = [];
  activePowerups = [];
}

/**
 * Spawn obstacles for a specific track segment.
 * Called by track.js when a segment is created/recycled.
 * This ensures obstacles are spawned with correct segment info (lane count, type, etc.)
 *
 * @param {THREE.Group} segment - The track segment to spawn obstacles for
 */
export function spawnObstaclesForSegment(segment) {
  const segmentData = segment.userData;
  const segmentLength = CONFIG.track.segmentLength;
  const segmentStart = segment.position.z - segmentLength / 2;

  // Don't spawn obstacles on gap segments (player needs clear path to jump)
  if (segmentData.hasGap) {
    return;
  }

  // Get lane info directly from segment (no extrapolation needed!)
  const laneCount = segmentData.laneCount || 3;
  const lanePositions = getLanePositions(laneCount);

  // Determine obstacle types to exclude based on segment type
  // On narrow (1-lane) sections, exclude tall barriers so player can jump over
  const excludeTypes = laneCount === 1 ? ['tallBarrier'] : [];

  // Randomly decide how many obstacle rows to spawn in this segment
  // Based on segment length (20) and gap settings (8-20)
  const { minGap, maxGap } = CONFIG.obstacles;
  const avgGap = (minGap + maxGap) / 2;

  // Spawn 0-2 rows per segment based on probability
  // Segment length / average gap gives expected rows
  const expectedRows = segmentLength / avgGap;
  let numRows = 0;

  // Use probability to decide number of rows
  if (Math.random() < expectedRows) {
    numRows = 1;
    // Small chance for second row if segment is long enough
    if (segmentLength >= avgGap * 1.5 && Math.random() < 0.3) {
      numRows = 2;
    }
  }

  // Spawn each row at different Z positions within the segment
  for (let row = 0; row < numRows; row++) {
    // Spread rows evenly within segment, with some randomness
    const rowT = numRows === 1 ? 0.5 : (row + 0.5) / numRows;
    const zOffset = (rowT + (Math.random() - 0.5) * 0.3) * segmentLength;
    const z = segmentStart + zOffset;

    // Interpolate track height at this Z position
    const t = zOffset / segmentLength;
    const trackHeight = THREE.MathUtils.lerp(
      segmentData.startHeight,
      segmentData.endHeight,
      t
    );

    // Determine how many lanes to block
    // Always leave at least 1 lane open for escape
    let maxBlocked = Math.min(laneCount - 1, Math.ceil(laneCount / 2));

    if (laneCount === 1) {
      // On narrow sections, sometimes spawn obstacles, sometimes don't
      maxBlocked = Math.random() < 0.3 ? 1 : 0;
    }

    // Randomly pick how many to actually spawn
    let numObstacles = 0;
    if (maxBlocked > 0) {
      if (laneCount >= 5) {
        // Wide sections: 2-3 obstacles
        numObstacles = Math.random() < 0.6 ? 2 : 3;
      } else {
        // Standard sections: 1-2 obstacles
        numObstacles = Math.random() < 0.7 ? 1 : 2;
      }
      numObstacles = Math.min(numObstacles, maxBlocked);
    }

    // Pick random lanes to block
    const blockedLanes = [];
    while (blockedLanes.length < numObstacles) {
      const laneIndex = Math.floor(Math.random() * laneCount);
      if (!blockedLanes.includes(laneIndex)) {
        blockedLanes.push(laneIndex);
      }
    }

    // Spawn obstacles in blocked lanes
    for (const laneIndex of blockedLanes) {
      const obstacle = getObstacleFromPool(excludeTypes);
      if (obstacle) {
        obstacle.position.x = lanePositions[laneIndex];
        obstacle.position.z = z;
        // Handle elevated obstacles (slideBarrier) differently
        if (obstacle.userData.elevated) {
          obstacle.position.y = obstacle.userData.bottomY + obstacle.userData.height / 2 + trackHeight;
        } else {
          obstacle.position.y = obstacle.userData.height / 2 + trackHeight;
        }
        activeObstacles.push(obstacle);
      }
    }

    // Maybe spawn a collectible or powerup in a free lane
    if (Math.random() < 0.4) {
      const freeLanes = [];
      for (let i = 0; i < laneCount; i++) {
        if (!blockedLanes.includes(i)) {
          freeLanes.push(i);
        }
      }

      if (freeLanes.length > 0) {
        const collectibleLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];

        // Chance to spawn powerup instead of regular collectible
        if (Math.random() < CONFIG.powerups.spawnChance) {
          const powerupType = selectRandomPowerupType();
          const powerup = getPowerupFromPool(powerupType);
          if (powerup) {
            powerup.position.x = lanePositions[collectibleLane];
            powerup.position.z = z;
            powerup.position.y = 1.5 + trackHeight;
            powerup.userData.baseY = 1.5 + trackHeight; // Store base Y for bobbing
            activePowerups.push(powerup);
          }
        } else {
          const collectible = getCollectibleFromPool();
          if (collectible) {
            collectible.position.x = lanePositions[collectibleLane];
            collectible.position.z = z;
            collectible.position.y = 1.2 + trackHeight;
            activeCollectibles.push(collectible);
          }
        }
      }
    }
  }
}

export function updateObstacles(delta) {
  if (!gameState.isRunning) return;

  // Apply speed modifier from powerups
  const effectiveSpeed = gameState.speed * gameState.powerupSpeedModifier;
  const moveAmount = effectiveSpeed * delta;

  // Move obstacles toward player
  for (const obstacle of activeObstacles) {
    obstacle.position.z -= moveAmount;
  }

  // Move and rotate collectibles
  for (const collectible of activeCollectibles) {
    collectible.position.z -= moveAmount;
    collectible.rotation.y += CONFIG.collectibles.rotationSpeed * delta;
    collectible.rotation.x += CONFIG.collectibles.rotationSpeed * 0.5 * delta;
  }

  // Move, rotate, and animate powerups
  const time = performance.now() * 0.001;
  for (const powerup of activePowerups) {
    powerup.position.z -= moveAmount;

    // Rotate faster than collectibles
    powerup.rotation.y += CONFIG.powerups.rotationSpeed * delta;

    // Pulse the glow
    const glow = powerup.getObjectByName('glow');
    if (glow) {
      const pulse = 0.3 + Math.sin(time * 3) * 0.1;
      glow.material.opacity = pulse;
      const scale = 1 + Math.sin(time * 4) * 0.1;
      glow.scale.setScalar(scale);
    }

    // Animate orbiting particles
    for (let i = 0; i < 3; i++) {
      const particle = powerup.getObjectByName(`orbitParticle${i}`);
      if (particle) {
        const angle = time * 2 + particle.userData.orbitOffset;
        const radius = particle.userData.orbitRadius;
        particle.position.x = Math.cos(angle) * radius;
        particle.position.z = Math.sin(angle) * radius;
        particle.position.y = Math.sin(time * 3 + particle.userData.orbitOffset) * 0.1;
      }
    }

    // Bob up and down (use stored base Y to account for track height)
    const baseY = powerup.userData.baseY || 1.5;
    powerup.position.y = baseY + Math.sin(time * 2) * 0.15;
  }

  // Recycle obstacles that passed the camera
  const recycleThreshold = -10;

  for (const obstacle of [...activeObstacles]) {
    if (obstacle.position.z < recycleThreshold) {
      returnObstacleToPool(obstacle);
    }
  }

  for (const collectible of [...activeCollectibles]) {
    if (collectible.position.z < recycleThreshold) {
      returnCollectibleToPool(collectible);
    }
  }

  for (const powerup of [...activePowerups]) {
    if (powerup.position.z < recycleThreshold) {
      returnPowerupToPool(powerup);
    }
  }

  // No more independent spawning - obstacles are spawned by track.js
}

export function getActiveObstacles() {
  return activeObstacles;
}

export function getActiveCollectibles() {
  return activeCollectibles;
}

export function getActivePowerups() {
  return activePowerups;
}

export function collectItem(collectible) {
  returnCollectibleToPool(collectible);
  return collectible.userData.refillAmount || CONFIG.collectibles.refillAmount;
}

export function collectPowerup(powerup) {
  const powerupType = powerup.userData.powerupType;
  const config = powerup.userData.config;
  returnPowerupToPool(powerup);
  return { type: powerupType, config };
}

// Magnet effect: attract collectibles and powerups toward player
export function applyMagnetEffect(playerX, playerZ, attractRadius, delta) {
  const attractSpeed = 8; // Units per second

  // Attract collectibles
  for (const collectible of activeCollectibles) {
    const dx = playerX - collectible.position.x;
    const dz = playerZ - collectible.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < attractRadius && dist > 0.5) {
      const attractForce = (1 - dist / attractRadius) * attractSpeed * delta;
      collectible.position.x += (dx / dist) * attractForce;
      // Only attract horizontally, not along Z (let normal movement handle that)
    }
  }

  // Attract powerups too
  for (const powerup of activePowerups) {
    const dx = playerX - powerup.position.x;
    const dz = playerZ - powerup.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < attractRadius && dist > 0.5) {
      const attractForce = (1 - dist / attractRadius) * attractSpeed * delta;
      powerup.position.x += (dx / dist) * attractForce;
    }
  }
}
