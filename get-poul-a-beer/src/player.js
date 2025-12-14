import * as THREE from 'three';
import { CONFIG, findClosestLaneIndex, gameState } from './config.js';
import { getTrackHeightAt, getLaneInfoAt } from './track.js';
import { playSound, startLowBeerWarning, stopLowBeerWarning } from './audio.js';

let playerMesh = null;
let beerMesh = null;        // The beer mug
let beerLiquidMesh = null;  // The beer liquid inside (scales with amount)
let currentLane = CONFIG.player.startLane;
let targetLane = CONFIG.player.startLane;
let currentLaneCount = CONFIG.lanes.count;  // Track current lane configuration
let currentLanePositions = CONFIG.lanes.positions.slice();  // Copy of current lane positions
let isJumping = false;
let jumpProgress = 0;
let baseY = 0;
let trackHeight = 0;  // Current track height (for ramps)
let isFalling = false;
let fallVelocity = 0;
const GRAVITY = 30;
const FALL_DEATH_THRESHOLD = -10;

// Powerup visual effects
let shieldBubble = null;
let speedTrailParticles = [];
let originalPlayerOpacity = 1;
let originalPlayerColor = null;

// Sliding state
let isSliding = false;
let slideProgress = 0;
const SLIDE_DURATION = 0.6;  // seconds
const SLIDE_HEIGHT_REDUCTION = 0.5;  // How much lower during slide

// Beer spill tracking
let lastLane = CONFIG.player.startLane;
let spillParticles = [];
let scene = null;

export function initPlayer(sceneRef) {
  scene = sceneRef;
  const { size, color } = CONFIG.player;

  // Create player geometry - a stylized character (for now, a rounded box)
  const geometry = new THREE.BoxGeometry(size, size * 1.5, size);

  // Add some rounding by using beveled edges
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.6,
  });

  playerMesh = new THREE.Mesh(geometry, material);
  playerMesh.castShadow = true;
  playerMesh.receiveShadow = true;

  // Position player
  const startX = CONFIG.lanes.positions[currentLane];
  baseY = (size * 1.5) / 2;
  playerMesh.position.set(startX, baseY, 0);

  // Add eye details for character feel
  const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.2, 0.3, 0.5);
  playerMesh.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.2, 0.3, 0.5);
  playerMesh.add(rightEye);

  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.5,
  });

  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.2, 0.3, 0.6);
  playerMesh.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.2, 0.3, 0.6);
  playerMesh.add(rightPupil);

  // Create beer mug (held to the side)
  createBeerMug();

  // Create shield bubble (invisible by default)
  createShieldBubble();

  // Store original player color for effects
  originalPlayerColor = playerMesh.material.color.getHex();

  scene.add(playerMesh);

  return playerMesh;
}

// Create the beer mug that the player carries
function createBeerMug() {
  // Mug container group
  beerMesh = new THREE.Group();

  // Mug body (cylinder)
  const mugGeometry = new THREE.CylinderGeometry(0.25, 0.22, 0.5, 16);
  const mugMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,  // Light brownish glass
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.7,
  });
  const mugBody = new THREE.Mesh(mugGeometry, mugMaterial);
  mugBody.position.y = 0.25;
  beerMesh.add(mugBody);

  // Mug handle (torus segment)
  const handleGeometry = new THREE.TorusGeometry(0.15, 0.04, 8, 12, Math.PI);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.2,
    metalness: 0.1,
  });
  const mugHandle = new THREE.Mesh(handleGeometry, handleMaterial);
  mugHandle.rotation.z = Math.PI / 2;
  mugHandle.rotation.y = Math.PI / 2;
  mugHandle.position.set(0.28, 0.25, 0);
  beerMesh.add(mugHandle);

  // Beer liquid inside (scales based on beer amount)
  const liquidGeometry = new THREE.CylinderGeometry(0.22, 0.19, 0.42, 16);
  const liquidMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5a623,  // Amber beer color
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0xf5a623,
    emissiveIntensity: 0.1,
  });
  beerLiquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
  beerLiquidMesh.position.y = 0.23;
  beerMesh.add(beerLiquidMesh);

  // Foam on top
  const foamGeometry = new THREE.CylinderGeometry(0.23, 0.22, 0.08, 16);
  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffef0,  // Creamy white
    roughness: 0.8,
    metalness: 0,
  });
  const foam = new THREE.Mesh(foamGeometry, foamMaterial);
  foam.position.y = 0.48;
  foam.name = 'foam';
  beerMesh.add(foam);

  // Position mug to the side of player
  beerMesh.position.set(0.6, 0.2, 0.2);
  beerMesh.rotation.z = -0.1;  // Slight tilt

  playerMesh.add(beerMesh);
}

// Create the shield bubble for shield powerup
function createShieldBubble() {
  const geometry = new THREE.SphereGeometry(1.2, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2ecc71,
    transparent: true,
    opacity: 0.3,
    emissive: 0x2ecc71,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  shieldBubble = new THREE.Mesh(geometry, material);
  shieldBubble.visible = false;
  shieldBubble.name = 'shieldBubble';
  playerMesh.add(shieldBubble);
}

// Update powerup visual effects
export function updatePowerupVisuals(delta) {
  if (!playerMesh) return;

  const time = performance.now() * 0.001;

  // Shield bubble
  if (shieldBubble) {
    const shieldActive = gameState.activePowerups.shield.active;
    shieldBubble.visible = shieldActive;
    if (shieldActive) {
      // Pulse effect
      const pulse = 1 + Math.sin(time * 4) * 0.1;
      shieldBubble.scale.setScalar(pulse);
      shieldBubble.material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
      shieldBubble.rotation.y += delta * 0.5;
    }
  }

  // Ghost effect - make player transparent
  const ghostActive = gameState.activePowerups.ghost.active;
  if (ghostActive) {
    playerMesh.material.transparent = true;
    playerMesh.material.opacity = 0.4 + Math.sin(time * 5) * 0.1;
    // Slight color shift to white
    playerMesh.material.color.setHex(0xaadddd);
  } else if (playerMesh.material.opacity < 1) {
    // Restore opacity when ghost ends
    playerMesh.material.opacity = 1;
    playerMesh.material.transparent = false;
    playerMesh.material.color.setHex(originalPlayerColor || CONFIG.player.color);
  }

  // Golden Beer effect - golden glow
  const goldenBeerActive = gameState.activePowerups.goldenBeer.active;
  if (goldenBeerActive && !ghostActive) {
    // Golden tint
    const goldenPulse = Math.sin(time * 6) * 0.5 + 0.5;
    const r = 0x4e + (0xff - 0x4e) * goldenPulse * 0.3;
    const g = 0xcd + (0xd7 - 0xcd) * goldenPulse * 0.3;
    const b = 0xc4 * (1 - goldenPulse * 0.5);
    playerMesh.material.color.setRGB(r / 255, g / 255, b / 255);
    playerMesh.material.emissive = new THREE.Color(0xffd700);
    playerMesh.material.emissiveIntensity = 0.2 + goldenPulse * 0.1;
  } else if (!ghostActive && playerMesh.material.emissiveIntensity > 0) {
    // Reset emissive
    playerMesh.material.emissive = new THREE.Color(0x000000);
    playerMesh.material.emissiveIntensity = 0;
    if (!goldenBeerActive) {
      playerMesh.material.color.setHex(originalPlayerColor || CONFIG.player.color);
    }
  }

  // Speed Surge effect - speed lines/trail
  const speedSurgeActive = gameState.activePowerups.speedSurge.active;
  updateSpeedTrail(speedSurgeActive, delta);

  // Slow-Mo effect - blue tint on beer mug
  const slowMoActive = gameState.activePowerups.slowMo.active;
  if (beerLiquidMesh) {
    if (slowMoActive) {
      beerLiquidMesh.material.color.setHex(0x9b59b6);
      beerLiquidMesh.material.emissive = new THREE.Color(0x9b59b6);
      beerLiquidMesh.material.emissiveIntensity = 0.3;
    } else {
      beerLiquidMesh.material.color.setHex(0xf5a623);
      beerLiquidMesh.material.emissive = new THREE.Color(0xf5a623);
      beerLiquidMesh.material.emissiveIntensity = 0.1;
    }
  }

  // Magnet effect - blue aura
  const magnetActive = gameState.activePowerups.magnet.active;
  if (magnetActive) {
    // Subtle blue tint on the beer mug foam
    if (beerMesh) {
      const foam = beerMesh.getObjectByName('foam');
      if (foam) {
        foam.material.color.setHex(0x5dade2);
      }
    }
  } else {
    if (beerMesh) {
      const foam = beerMesh.getObjectByName('foam');
      if (foam) {
        foam.material.color.setHex(0xfffef0);
      }
    }
  }

  // Double Score effect - orange particles around score could be added in UI
  // For player, add subtle orange glow
  const doubleScoreActive = gameState.activePowerups.doubleScore.active;
  if (doubleScoreActive && !ghostActive && !goldenBeerActive) {
    playerMesh.material.emissive = new THREE.Color(0xf39c12);
    playerMesh.material.emissiveIntensity = 0.1 + Math.sin(time * 4) * 0.05;
  }
}

// Speed trail particles
function updateSpeedTrail(active, delta) {
  if (!scene || !playerMesh) return;

  if (active) {
    // Spawn new trail particles
    if (Math.random() < 0.3) {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const material = new THREE.MeshStandardMaterial({
        color: 0xe74c3c,
        emissive: 0xe74c3c,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
      });

      const particle = new THREE.Mesh(geometry, material);
      const worldPos = new THREE.Vector3();
      playerMesh.getWorldPosition(worldPos);

      particle.position.set(
        worldPos.x + (Math.random() - 0.5) * 1,
        worldPos.y + (Math.random() - 0.5) * 1,
        worldPos.z - 1
      );

      particle.userData = {
        life: 1.0,
        decay: 2.0,
      };

      scene.add(particle);
      speedTrailParticles.push(particle);
    }
  }

  // Update existing particles
  for (let i = speedTrailParticles.length - 1; i >= 0; i--) {
    const particle = speedTrailParticles[i];

    // Move backward
    particle.position.z -= gameState.speed * delta * 0.5;

    // Decay
    particle.userData.life -= particle.userData.decay * delta;
    particle.material.opacity = particle.userData.life * 0.8;
    particle.scale.x = particle.userData.life;

    // Remove dead particles
    if (particle.userData.life <= 0) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      speedTrailParticles.splice(i, 1);
    }
  }
}

// Clear speed trail particles
function clearSpeedTrail() {
  for (const particle of speedTrailParticles) {
    if (scene) scene.remove(particle);
    particle.geometry.dispose();
    particle.material.dispose();
  }
  speedTrailParticles = [];
}

export function resetPlayer() {
  currentLane = CONFIG.player.startLane;
  targetLane = CONFIG.player.startLane;
  lastLane = CONFIG.player.startLane;
  currentLaneCount = CONFIG.lanes.count;
  currentLanePositions = CONFIG.lanes.positions.slice();
  isJumping = false;
  jumpProgress = 0;
  isSliding = false;
  slideProgress = 0;
  trackHeight = 0;
  isFalling = false;
  fallVelocity = 0;
  lowBeerWarningActive = false;

  if (playerMesh) {
    const startX = CONFIG.lanes.positions[currentLane];
    playerMesh.position.set(startX, baseY, 0);
    playerMesh.rotation.set(0, 0, 0);
    playerMesh.scale.set(1, 1, 1);  // Reset scale (in case died while sliding)

    // Reset player material to original state
    playerMesh.material.opacity = 1;
    playerMesh.material.transparent = false;
    playerMesh.material.color.setHex(originalPlayerColor || CONFIG.player.color);
    playerMesh.material.emissive = new THREE.Color(0x000000);
    playerMesh.material.emissiveIntensity = 0;
  }

  // Reset beer liquid visual
  if (beerLiquidMesh) {
    beerLiquidMesh.scale.y = 1;
    beerLiquidMesh.position.y = 0.23;
    beerLiquidMesh.material.color.setHex(0xf5a623);
  }

  // Hide shield bubble
  if (shieldBubble) {
    shieldBubble.visible = false;
  }

  // Clear any spill particles
  clearSpillParticles();

  // Clear speed trail particles
  clearSpeedTrail();
}

export function moveLeft() {
  // Use current lane count for bounds checking
  const oldLane = targetLane;
  if (targetLane < currentLaneCount - 1) {
    targetLane++;
  }
  console.log(`moveLeft: lane ${oldLane} → ${targetLane} (max: ${currentLaneCount - 1}) | x=${playerMesh?.position.x.toFixed(2)}`);
}

export function moveRight() {
  const oldLane = targetLane;
  if (targetLane > 0) {
    targetLane--;
  }
  console.log(`moveRight: lane ${oldLane} → ${targetLane} (min: 0) | x=${playerMesh?.position.x.toFixed(2)}`);
}

// Get current lane count (for external systems that need to know bounds)
export function getCurrentLaneCount() {
  return currentLaneCount;
}

// Get current lane positions (for external systems like obstacles)
export function getCurrentLanePositions() {
  return currentLanePositions;
}

export function jump() {
  // Can't jump while sliding
  if (!isJumping && !isSliding) {
    isJumping = true;
    jumpProgress = 0;
    // Play jump sound
    playSound('jump');
    // Spill beer when jumping
    spillBeer(CONFIG.beer.spillRates.jump, 'jump');
  }
}

export function slide() {
  // Can't slide while jumping, already sliding, or falling
  if (!isSliding && !isJumping && !isFalling) {
    isSliding = true;
    slideProgress = 0;
    // Play slide sound
    playSound('slide');
    // Spill beer when sliding
    spillBeer(CONFIG.beer.spillRates.slide, 'slide');
  }
}

// Spill beer and create visual effect
export function spillBeer(amount, reason = 'passive') {
  if (gameState.beer <= 0) return;

  // Golden Beer powerup prevents beer drain (except from obstacle hits)
  if (gameState.activePowerups.goldenBeer.active && reason !== 'hit') {
    return;
  }

  const oldBeer = gameState.beer;
  gameState.beer = Math.max(0, gameState.beer - amount);

  // Create splash particles for significant spills
  if (amount >= 2 && playerMesh) {
    createSpillParticles(amount, reason);
    // Play spill sound for significant spills
    playSound('beerSpill');
  }

  // Update beer liquid visual
  updateBeerVisual();
}

// Refill beer (from pickup)
export function refillBeer(amount) {
  gameState.beer = Math.min(CONFIG.beer.maxAmount, gameState.beer + amount);
  updateBeerVisual();
}

// Track low beer warning state
let lowBeerWarningActive = false;

// Update the visual level of beer in the mug
function updateBeerVisual() {
  if (!beerLiquidMesh) return;

  const beerPercent = gameState.beer / CONFIG.beer.maxAmount;

  // Scale the liquid height
  beerLiquidMesh.scale.y = Math.max(0.05, beerPercent);

  // Adjust position so it stays at bottom of mug
  const baseY = 0.23;
  const offset = (1 - beerPercent) * 0.21;
  beerLiquidMesh.position.y = baseY - offset;

  // Update foam visibility based on beer level
  if (beerMesh) {
    const foam = beerMesh.getObjectByName('foam');
    if (foam) {
      foam.visible = beerPercent > 0.3;
      if (foam.visible) {
        foam.position.y = 0.48 - (1 - beerPercent) * 0.42;
      }
    }
  }

  // Low beer warning sound (under 20%)
  if (beerPercent <= 0.2 && !lowBeerWarningActive && gameState.isRunning) {
    lowBeerWarningActive = true;
    startLowBeerWarning();
  } else if ((beerPercent > 0.2 || !gameState.isRunning) && lowBeerWarningActive) {
    lowBeerWarningActive = false;
    stopLowBeerWarning();
  }
}

// Create splash particles when beer spills
function createSpillParticles(amount, reason) {
  if (!scene || !playerMesh) return;

  const particleCount = Math.min(Math.floor(amount / 2) + 2, 8);
  const beerColor = 0xf5a623;

  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 6);
    const material = new THREE.MeshStandardMaterial({
      color: beerColor,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    const particle = new THREE.Mesh(geometry, material);

    // Position at mug location (world space)
    const mugWorldPos = new THREE.Vector3();
    beerMesh.getWorldPosition(mugWorldPos);
    particle.position.copy(mugWorldPos);
    particle.position.y += 0.5;

    // Random velocity based on spill reason
    let vx, vy, vz;
    if (reason === 'jump') {
      // Splash upward and outward
      vx = (Math.random() - 0.5) * 3;
      vy = 2 + Math.random() * 2;
      vz = (Math.random() - 0.5) * 2;
    } else if (reason === 'slide') {
      // Splash forward and up
      vx = (Math.random() - 0.5) * 2;
      vy = 1 + Math.random() * 1.5;
      vz = 1 + Math.random() * 2;
    } else if (reason === 'hit') {
      // Big splash in all directions
      vx = (Math.random() - 0.5) * 5;
      vy = 2 + Math.random() * 3;
      vz = (Math.random() - 0.5) * 5;
    } else if (reason === 'lane') {
      // Small side splash
      vx = (Math.random() - 0.5) * 4;
      vy = 0.5 + Math.random();
      vz = (Math.random() - 0.5) * 1;
    } else {
      // Passive drip
      vx = (Math.random() - 0.5) * 0.5;
      vy = -0.5;
      vz = (Math.random() - 0.5) * 0.5;
    }

    particle.userData = {
      velocity: new THREE.Vector3(vx, vy, vz),
      life: 1.0,
      decay: 1.5 + Math.random() * 0.5,
    };

    scene.add(particle);
    spillParticles.push(particle);
  }
}

// Update spill particles
export function updateSpillParticles(delta) {
  const gravity = 15;

  for (let i = spillParticles.length - 1; i >= 0; i--) {
    const particle = spillParticles[i];

    // Apply gravity
    particle.userData.velocity.y -= gravity * delta;

    // Move particle
    particle.position.x += particle.userData.velocity.x * delta;
    particle.position.y += particle.userData.velocity.y * delta;
    particle.position.z += particle.userData.velocity.z * delta;

    // Decay
    particle.userData.life -= particle.userData.decay * delta;
    particle.material.opacity = particle.userData.life * 0.8;

    // Remove dead particles
    if (particle.userData.life <= 0 || particle.position.y < -2) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      spillParticles.splice(i, 1);
    }
  }
}

// Clear all spill particles
function clearSpillParticles() {
  for (const particle of spillParticles) {
    if (scene) scene.remove(particle);
    particle.geometry.dispose();
    particle.material.dispose();
  }
  spillParticles = [];
}

export function updatePlayer(delta) {
  if (!playerMesh) return;

  const { switchSpeed } = CONFIG.lanes;
  const { jumpHeight, jumpDuration } = CONFIG.player;

  // Passive beer spillage (dripping while running)
  if (gameState.isRunning && gameState.beer > 0) {
    spillBeer(CONFIG.beer.spillRates.passive * delta, 'passive');
  }

  // Update spill particles
  updateSpillParticles(delta);

  // Get track height at player position (for ramps)
  trackHeight = getTrackHeightAt(playerMesh.position.z);

  // Get lane info at player position (dynamic lane system)
  const laneInfo = getLaneInfoAt(playerMesh.position.z);
  const { laneCount, lanePositions } = laneInfo;

  // Handle lane count transitions
  if (laneCount !== currentLaneCount) {
    // Lane count changed - remap to closest valid lane
    const closestLane = findClosestLaneIndex(playerMesh.position.x, lanePositions);
    console.log(`Lane transition: ${currentLaneCount} → ${laneCount} lanes | ` +
      `x=${playerMesh.position.x.toFixed(2)} | ` +
      `targetLane: ${targetLane} → ${closestLane} | ` +
      `positions: [${lanePositions.map(p => p.toFixed(1)).join(', ')}]`);
    targetLane = closestLane;
    currentLane = closestLane;
    currentLaneCount = laneCount;
    currentLanePositions = lanePositions;
  }

  // Clamp targetLane to valid range (safety check)
  targetLane = Math.max(0, Math.min(laneCount - 1, targetLane));

  // Detect lane switch for beer spilling
  if (targetLane !== lastLane) {
    spillBeer(CONFIG.beer.spillRates.laneSwitch, 'lane');
    playSound('laneSwitch');
    lastLane = targetLane;
  }

  // Smooth lane switching using lerp
  const targetX = lanePositions[targetLane];
  playerMesh.position.x = THREE.MathUtils.lerp(
    playerMesh.position.x,
    targetX,
    switchSpeed * delta
  );

  // Update current lane based on actual position
  const distances = lanePositions.map((pos) =>
    Math.abs(playerMesh.position.x - pos)
  );
  currentLane = distances.indexOf(Math.min(...distances));

  // Handle falling (when over a gap without jumping)
  if (isFalling) {
    fallVelocity += GRAVITY * delta;
    playerMesh.position.y -= fallVelocity * delta;

    // Spin while falling
    playerMesh.rotation.x += delta * 5;

    return; // Don't process other movement while falling
  }

  // Handle jumping
  if (isJumping) {
    jumpProgress += delta / jumpDuration;

    if (jumpProgress >= 1) {
      // Landing
      isJumping = false;
      jumpProgress = 0;
      playerMesh.position.y = baseY + trackHeight;
      // Play land sound
      playSound('land');
    } else {
      // Parabolic jump arc (relative to track height)
      const jumpArc = Math.sin(jumpProgress * Math.PI);
      playerMesh.position.y = baseY + trackHeight + jumpArc * jumpHeight;
    }
  } else if (isSliding) {
    // Handle sliding
    slideProgress += delta / SLIDE_DURATION;

    if (slideProgress >= 1) {
      // End slide
      isSliding = false;
      slideProgress = 0;
      playerMesh.scale.y = 1;  // Restore scale
      playerMesh.position.y = baseY + trackHeight;
    } else {
      // Slide arc (quick down, hold, quick up)
      const slideArc = Math.sin(slideProgress * Math.PI);

      // Lower Y position during slide
      const slideOffset = slideArc * SLIDE_HEIGHT_REDUCTION;
      playerMesh.position.y = baseY + trackHeight - slideOffset;

      // Squash effect: scale Y from 1.0 down to ~0.5
      const squashAmount = 1 - (slideArc * 0.5);
      playerMesh.scale.y = squashAmount;
    }
  } else {
    // Follow track height when not jumping or sliding
    const targetY = baseY + trackHeight;
    playerMesh.position.y = THREE.MathUtils.lerp(
      playerMesh.position.y,
      targetY,
      10 * delta
    );
  }

  // Add subtle running animation (bobbing and tilting)
  if (isJumping) {
    // Tuck during jump
    playerMesh.rotation.x = Math.sin(jumpProgress * Math.PI) * 0.3;
  } else if (isSliding) {
    // Forward tilt during slide
    const slideArc = Math.sin(slideProgress * Math.PI);
    playerMesh.rotation.x = slideArc * 0.5;  // Lean forward
    playerMesh.rotation.z = (targetX - playerMesh.position.x) * 0.1;  // Keep lane tilt
  } else {
    // Normal running animation
    const time = performance.now() * 0.01;
    playerMesh.position.y += Math.sin(time) * 0.05;
    playerMesh.rotation.z = (targetX - playerMesh.position.x) * 0.1;
    // Slight forward tilt on ramps
    playerMesh.rotation.x = THREE.MathUtils.degToRad(-trackHeight * 2);
  }
}

export function getPlayer() {
  return playerMesh;
}

export function getPlayerBoundingBox() {
  if (!playerMesh) return null;

  const box = new THREE.Box3().setFromObject(playerMesh);

  // If sliding, significantly reduce the box height from the top
  // This allows the player to fit under low obstacles
  if (isSliding) {
    const slideArc = Math.sin(slideProgress * Math.PI);
    const heightReduction = slideArc * 0.75;  // Reduce top of box during slide
    box.max.y -= heightReduction;
  }

  // Shrink the box slightly for more forgiving collisions
  box.min.addScalar(0.1);
  box.max.subScalar(0.1);
  return box;
}

export function getCurrentLane() {
  return currentLane;
}

export function isPlayerJumping() {
  return isJumping;
}

export function isPlayerFalling() {
  return isFalling;
}

export function isPlayerSliding() {
  return isSliding;
}

export function startFalling() {
  if (!isFalling && !isJumping && !isSliding) {
    isFalling = true;
    fallVelocity = 0;
  }
}

export function hasFallenToDeath() {
  return playerMesh && playerMesh.position.y < FALL_DEATH_THRESHOLD;
}

export function getPlayerZ() {
  return playerMesh ? playerMesh.position.z : 0;
}

export function getPlayerY() {
  return playerMesh ? playerMesh.position.y : 0;
}

export function getPlayerX() {
  return playerMesh ? playerMesh.position.x : 0;
}

export function getTrackHeightAtPlayer() {
  return trackHeight;
}
