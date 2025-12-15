// Game configuration
export const CONFIG = {
  // Track settings
  track: {
    segmentLength: 20,      // Length of each track segment
    segmentWidth: 12,       // Width of the track
    poolSize: 12,           // Number of segments in the pool (increased for variety)
    visibleSegments: 6,     // Segments visible ahead
  },

  // Segment type definitions
  segments: {
    types: {
      straight: {
        name: 'straight',
        difficulty: 0,
        rampAngle: 0,
        hasGap: false,
        hasCeiling: false,
        narrowFactor: 1,
        laneCount: 3,  // Standard 3 lanes
        allowedNext: ['straight', 'rampUp', 'rampDown', 'gap', 'tunnel', 'narrow', 'wide'],
        weight: 40,  // Spawn probability weight
      },
      rampUp: {
        name: 'rampUp',
        difficulty: 2,
        rampAngle: 12,  // Degrees
        hasGap: false,
        hasCeiling: false,
        narrowFactor: 1,
        laneCount: 3,
        allowedNext: ['straight', 'rampDown', 'tunnel'],
        weight: 15,
      },
      rampDown: {
        name: 'rampDown',
        difficulty: 2,
        rampAngle: -12,
        hasGap: false,
        hasCeiling: false,
        narrowFactor: 1,
        laneCount: 3,
        allowedNext: ['straight', 'rampUp', 'gap'],
        weight: 15,
      },
      gap: {
        name: 'gap',
        difficulty: 5,
        rampAngle: 0,
        hasGap: true,
        gapStart: 0.3,    // Start gap at 30% of segment
        gapLength: 0.4,   // Gap is 40% of segment length
        hasCeiling: false,
        narrowFactor: 1,
        laneCount: 3,
        allowedNext: ['straight', 'rampUp'],  // Need stable landing
        weight: 10,
      },
      tunnel: {
        name: 'tunnel',
        difficulty: 1,
        rampAngle: 0,
        hasGap: false,
        hasCeiling: true,
        ceilingHeight: 4,
        narrowFactor: 1,
        laneCount: 3,
        allowedNext: ['straight', 'tunnel', 'narrow'],
        weight: 12,
      },
      narrow: {
        name: 'narrow',
        difficulty: 3,
        rampAngle: 0,
        hasGap: false,
        hasCeiling: false,
        narrowFactor: 0.33,  // 33% of normal width - truly narrow
        laneCount: 1,        // Single center lane only
        allowedNext: ['straight', 'narrow', 'tunnel'],
        weight: 8,
        selfWeight: 150,     // Very high weight - stay narrow for long stretches
      },
      wide: {
        name: 'wide',
        difficulty: 2,
        rampAngle: 0,
        hasGap: false,
        hasCeiling: false,
        narrowFactor: 1.67,  // 167% of normal width
        laneCount: 5,        // Five lanes
        allowedNext: ['straight', 'wide', 'tunnel'],
        weight: 8,
        selfWeight: 150,     // Very high weight - stay wide for long stretches
      },
    },
    // Difficulty budget system
    difficultyBudget: {
      initial: 5,
      max: 25,
      regenRate: 0.5,      // Budget regenerates per second
      distanceScale: 0.01, // Budget increases with distance
    },
    // Minimum straight segments at game start
    initialStraightCount: 3,
  },

  // Lane settings
  lanes: {
    count: 3,               // Default lane count (for standard segments)
    spacing: 3,             // Space between lanes
    positions: [-3, 0, 3],  // X positions for left, center, right lanes (default 3 lanes)
    switchSpeed: 10,        // How fast player switches lanes
  },

  // Player settings
  player: {
    startLane: 1,           // Start in center lane (index)
    size: 1,                // Player cube size
    jumpHeight: 3,          // Maximum jump height
    jumpDuration: 0.6,      // Jump duration in seconds
    color: 0x4ecdc4,        // Player color (teal)
  },

  // Game speed settings
  speed: {
    initial: 15,            // Starting speed
    max: 50,                // Maximum speed
    acceleration: 0.5,      // Speed increase per second
  },

  // Obstacle settings
  obstacles: {
    poolSize: 30,           // Number of obstacles in pool
    spawnDistance: 100,     // Distance ahead to spawn obstacles
    minGap: 8,              // Minimum gap between obstacles
    maxGap: 20,             // Maximum gap between obstacles
    types: {
      barrier: {
        width: 2.5,
        height: 2,
        depth: 0.5,
        color: 0xff6b6b,    // Red
      },
      tallBarrier: {
        width: 2.5,
        height: 4,
        depth: 0.5,
        color: 0xc0392b,    // Dark red
      },
      lowBarrier: {
        width: 2.5,
        height: 1,
        depth: 1,
        color: 0xe74c3c,    // Light red
      },
      slideBarrier: {
        width: 2.0,         // Reduced from 2.8 to stay within single lane
        height: 4,          // Tall wall - can't jump over
        depth: 0.3,
        color: 0x9b59b6,    // Purple - visually distinct
        elevated: true,     // Flag for special positioning
        bottomY: 1.2,       // Gap at bottom - must slide under (increased from 0.8)
      },
    },
  },

  // Beer collectible settings (replaces coins)
  collectibles: {
    poolSize: 20,
    size: 0.5,
    color: 0xf5a623,        // Beer amber/gold
    rotationSpeed: 1,
    refillAmount: 15,       // Percentage of beer restored
  },

  // Powerup settings
  powerups: {
    poolSize: 15,           // Number of powerups in pool
    spawnChance: 0.12,      // Chance to spawn instead of regular collectible
    rotationSpeed: 2,       // Faster rotation to stand out
    types: {
      goldenBeer: {
        name: 'Golden Beer',
        color: 0xffd700,      // Gold
        glowColor: 0xffed4a,
        duration: 5,          // Seconds of no beer drain
        spawnWeight: 8,       // Lower = rarer
      },
      magnet: {
        name: 'Magnet',
        color: 0x3498db,      // Blue
        glowColor: 0x5dade2,
        duration: 8,
        attractRadius: 6,     // Units to attract from
        spawnWeight: 15,
      },
      shield: {
        name: 'Shield',
        color: 0x2ecc71,      // Green
        glowColor: 0x58d68d,
        duration: 10,         // Max duration (or until hit)
        spawnWeight: 12,
      },
      speedSurge: {
        name: 'Speed Surge',
        color: 0xe74c3c,      // Red
        glowColor: 0xf1948a,
        duration: 5,
        speedMultiplier: 1.5,
        scoreMultiplier: 2,
        spawnWeight: 12,
      },
      slowMo: {
        name: 'Slow-Mo Brew',
        color: 0x9b59b6,      // Purple
        glowColor: 0xbb8fce,
        duration: 6,
        speedMultiplier: 0.5,
        spawnWeight: 10,
      },
      ghost: {
        name: 'Ghost Pint',
        color: 0xecf0f1,      // White/ghost
        glowColor: 0xffffff,
        duration: 4,
        spawnWeight: 8,       // Rare - very powerful
      },
      doubleScore: {
        name: 'Double Score',
        color: 0xf39c12,      // Orange
        glowColor: 0xf7dc6f,
        duration: 10,
        scoreMultiplier: 2,
        spawnWeight: 15,
      },
    },
  },

  // Beer system settings
  beer: {
    maxAmount: 100,         // Full mug = 100%
    startAmount: 100,       // Start with full beer
    // Spill rates (percentage per second or per action)
    spillRates: {
      passive: 0.5,         // Slow drip while running straight
      laneSwitch: 2,        // Spill per lane switch
      jump: 5,              // Spill per jump
      slide: 4,             // Spill per slide
      obstacleHit: 25,      // Big spill when hitting obstacle
    },
    // Invincibility after obstacle hit
    hitInvincibilityDuration: 1.5,  // seconds
    // Speed penalty when hitting obstacle
    hitSpeedPenalty: 0.6,   // Multiply speed by this (40% reduction, was 60%)
  },

  // Visual settings
  visuals: {
    backgroundColor: 0x1a1a2e,
    fogColor: 0x1a1a2e,
    fogNear: 30,
    fogFar: 120,
    groundColor: 0x2d3436,
    sideColor: 0x636e72,
  },

  // Camera settings
  camera: {
    fov: 75,
    near: 0.1,
    far: 200,
    position: { x: 0, y: 5, z: -8 },
    lookAt: { x: 0, y: 1, z: 20 },
  },
};

/**
 * Compute lane positions for a given lane count
 * @param {number} laneCount - Number of lanes (1, 3, 5, etc.)
 * @returns {number[]} Array of X positions for each lane
 */
export function getLanePositions(laneCount) {
  const { spacing } = CONFIG.lanes;
  const positions = [];
  const halfCount = (laneCount - 1) / 2;

  for (let i = 0; i < laneCount; i++) {
    // Center lane is at 0, others are offset by spacing
    positions.push((i - halfCount) * spacing);
  }

  return positions;
}

/**
 * Find the closest valid lane index when transitioning between lane counts
 * @param {number} currentX - Current X position
 * @param {number[]} targetPositions - Lane positions to map to
 * @returns {number} Index of closest lane
 */
export function findClosestLaneIndex(currentX, targetPositions) {
  let closestIndex = 0;
  let closestDist = Math.abs(currentX - targetPositions[0]);

  for (let i = 1; i < targetPositions.length; i++) {
    const dist = Math.abs(currentX - targetPositions[i]);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

// Game state
export const gameState = {
  isRunning: false,
  isPaused: false,
  isGameOver: false,
  isInIntro: false,
  score: 0,
  speed: CONFIG.speed.initial,
  distance: 0,
  // Time tracking
  elapsedTime: 0,
  // Beer system state
  beer: CONFIG.beer.startAmount,
  isInvincible: false,
  invincibilityTimer: 0,
  // Powerup state
  activePowerups: {
    goldenBeer: { active: false, timer: 0 },
    magnet: { active: false, timer: 0 },
    shield: { active: false, timer: 0 },
    speedSurge: { active: false, timer: 0 },
    slowMo: { active: false, timer: 0 },
    ghost: { active: false, timer: 0 },
    doubleScore: { active: false, timer: 0 },
  },
  // Cached speed modifier (recalculated when powerups change)
  powerupSpeedModifier: 1,
  powerupScoreModifier: 1,
};

// Reset game state
export function resetGameState() {
  gameState.isRunning = false;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.score = 0;
  gameState.speed = CONFIG.speed.initial;
  gameState.distance = 0;
  gameState.elapsedTime = 0;
  // Reset beer state
  gameState.beer = CONFIG.beer.startAmount;
  gameState.isInvincible = false;
  gameState.invincibilityTimer = 0;
  // Reset powerups
  for (const key in gameState.activePowerups) {
    gameState.activePowerups[key].active = false;
    gameState.activePowerups[key].timer = 0;
  }
  gameState.powerupSpeedModifier = 1;
  gameState.powerupScoreModifier = 1;
}

/**
 * Calculate efficiency rating based on distance and time
 * @returns {object} { efficiency: number, rating: string }
 */
export function calculateEfficiency() {
  if (gameState.elapsedTime <= 0) {
    return { efficiency: 0, avgSpeed: 0, rating: 'F' };
  }

  const avgSpeed = gameState.score / gameState.elapsedTime;

  // Rating thresholds based on average speed
  // Initial speed is 15, max is 50, so good players average around 20-30
  let rating;
  if (avgSpeed >= 35) rating = 'S';
  else if (avgSpeed >= 30) rating = 'A';
  else if (avgSpeed >= 25) rating = 'B';
  else if (avgSpeed >= 20) rating = 'C';
  else if (avgSpeed >= 15) rating = 'D';
  else rating = 'F';

  return { avgSpeed, rating };
}
