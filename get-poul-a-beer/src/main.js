import * as THREE from 'three';
import { initScene, render, getScene, updateCamera, resetCamera } from './scene.js';
import { CONFIG, gameState, resetGameState, calculateEfficiency } from './config.js';
import { initTrack, updateTrack, resetTrack, isOverGap, getTrackHeightAt, getCeilingHeightAt } from './track.js';
import {
  initObstacles,
  updateObstacles,
  resetObstacles,
  getActiveObstacles,
  getActiveCollectibles,
  getActivePowerups,
  collectItem,
  collectPowerup,
  applyMagnetEffect,
} from './obstacles.js';
import {
  initPlayer,
  updatePlayer,
  resetPlayer,
  getPlayer,
  getPlayerBoundingBox,
  isPlayerJumping,
  isPlayerFalling,
  startFalling,
  hasFallenToDeath,
  getPlayerZ,
  getPlayerX,
  getTrackHeightAtPlayer,
  spillBeer,
  refillBeer,
  updatePowerupVisuals,
} from './player.js';
import { initInput, resetKeys } from './input.js';
import {
  initAudio,
  resumeAudio,
  playSound,
  startMusic,
  stopMusic,
  startPowerupLoop,
  stopPowerupLoop,
  stopAllPowerupLoops,
  startLowBeerWarning,
  stopLowBeerWarning,
  setSoundEnabled,
  setMusicEnabled,
  isSoundEnabled,
  isMusicEnabled,
  stopAllAudio,
  resetAudio,
} from './audio.js';

// DOM Elements
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const speedElement = document.getElementById('speed');
const beerMeterElement = document.getElementById('beer-meter');
const beerFillElement = document.getElementById('beer-fill');
const beerPercentElement = document.getElementById('beer-percent');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalTimeElement = document.getElementById('final-time');
const finalAvgSpeedElement = document.getElementById('final-avg-speed');
const finalRatingElement = document.getElementById('final-rating');
const finalBeerElement = document.getElementById('final-beer');
const introOverlay = document.getElementById('intro-overlay');
const powerupNotification = document.getElementById('powerup-notification');

// Powerup indicator elements
const powerupIndicators = {
  goldenBeer: document.getElementById('powerup-goldenBeer'),
  magnet: document.getElementById('powerup-magnet'),
  shield: document.getElementById('powerup-shield'),
  speedSurge: document.getElementById('powerup-speedSurge'),
  slowMo: document.getElementById('powerup-slowMo'),
  ghost: document.getElementById('powerup-ghost'),
  doubleScore: document.getElementById('powerup-doubleScore'),
};

// Menu elements
const menuOverlay = document.getElementById('menu-overlay');
const mainMenu = document.getElementById('main-menu');
const howtoScreen = document.getElementById('howto-screen');
const aboutScreen = document.getElementById('about-screen');
const settingsScreen = document.getElementById('settings-screen');
const pauseOverlay = document.getElementById('pause-overlay');

// Game variables
let clock = new THREE.Clock();
let scene = null;
let godMode = false;
let introActive = false;

// God mode toggle (press G)
window.addEventListener('keydown', (e) => {
  if (e.key === 'g' || e.key === 'G') {
    godMode = !godMode;
    console.log(`God mode: ${godMode ? 'ON' : 'OFF'}`);
  }
  // Advance intro with Space or Enter
  if (introActive && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    advanceIntro();
  }
});

// Also advance intro on click (but not on the initial button click)
let introClickEnabled = false;
window.addEventListener('click', (e) => {
  if (introActive && introClickEnabled) {
    advanceIntro();
  }
});

// Intro sequence configuration
const introSlideIds = [
  'slide-1',
  'slide-2',
  'slide-3',
  'slide-4',
  'slide-5',
  'slide-6',
  'slide-7',
  'slide-8',
  'slide-9',
  'slide-10',
];

let currentSlideIndex = 0;

// Start the intro sequence
function startIntro() {
  // Don't restart if already in intro
  if (introActive) return;

  introActive = true;
  gameState.isInIntro = true;
  currentSlideIndex = 0;
  introClickEnabled = false;

  // Hide all menus, show intro overlay
  hideAllMenus();
  introOverlay.classList.add('visible');
  introOverlay.classList.remove('fade-out');

  // Blur any focused button to prevent space from re-clicking it
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // Enable click advancement after a short delay (to avoid button click triggering it)
  setTimeout(() => {
    introClickEnabled = true;
  }, 100);

  // Start first slide
  showSlide(0);
}

// Show a specific slide
function showSlide(index) {
  // Hide all slides
  const slides = introOverlay.querySelectorAll('.intro-slide');
  slides.forEach(slide => slide.classList.remove('active'));

  if (index >= introSlideIds.length) {
    // End of intro, start game
    endIntro();
    return;
  }

  // Show current slide
  const currentSlide = document.getElementById(introSlideIds[index]);
  if (currentSlide) {
    currentSlide.classList.add('active');
  }

  currentSlideIndex = index;
}

// Advance to next slide (user triggered)
function advanceIntro() {
  showSlide(currentSlideIndex + 1);
}

// End intro and start the game
function endIntro() {
  introClickEnabled = false;

  // Fade out intro overlay
  introOverlay.classList.add('fade-out');

  // After fade, hide overlay and start game
  setTimeout(() => {
    introActive = false;
    gameState.isInIntro = false;

    introOverlay.classList.remove('visible');
    introOverlay.classList.remove('fade-out');

    // Hide all slides for next time
    const slides = introOverlay.querySelectorAll('.intro-slide');
    slides.forEach(slide => slide.classList.remove('active'));

    // Actually start the game
    startGameActual();
  }, 1000);
}

// Initialize game
function init() {
  const container = document.getElementById('game-container');

  // Setup Three.js scene
  const sceneData = initScene(container);
  scene = sceneData.scene;

  // Initialize game systems
  initTrack(scene);
  initObstacles(scene);
  initPlayer(scene);
  initInput(startGame, restartGame, togglePause);

  // Initialize audio system
  initAudio();

  // Setup menu button listeners
  setupMenuListeners();

  // Start render loop
  animate();
}

// Setup menu navigation listeners
function setupMenuListeners() {
  // Main menu buttons
  const playBtn = document.getElementById('play-btn');
  const howtoBtn = document.getElementById('howto-btn');
  const aboutBtn = document.getElementById('about-btn');
  const settingsBtn = document.getElementById('settings-btn');

  // Back buttons
  const howtoBackBtn = document.getElementById('howto-back-btn');
  const aboutBackBtn = document.getElementById('about-back-btn');
  const settingsBackBtn = document.getElementById('settings-back-btn');

  // Game over menu button
  const menuBtn = document.getElementById('menu-btn');

  // Settings toggles
  const soundToggle = document.getElementById('sound-toggle');
  const musicToggle = document.getElementById('music-toggle');

  // Main menu navigation
  if (playBtn) playBtn.addEventListener('click', startGame);
  if (howtoBtn) howtoBtn.addEventListener('click', showHowtoScreen);
  if (aboutBtn) aboutBtn.addEventListener('click', showAboutScreen);
  if (settingsBtn) settingsBtn.addEventListener('click', showSettingsScreen);

  // Back buttons
  if (howtoBackBtn) howtoBackBtn.addEventListener('click', showMainMenu);
  if (aboutBackBtn) aboutBackBtn.addEventListener('click', showMainMenu);
  if (settingsBackBtn) settingsBackBtn.addEventListener('click', showMainMenu);

  // Game over -> main menu
  if (menuBtn) menuBtn.addEventListener('click', returnToMainMenu);

  // Pause menu buttons
  const resumeBtn = document.getElementById('resume-btn');
  const pauseMainMenuBtn = document.getElementById('pause-main-menu-btn');
  if (resumeBtn) resumeBtn.addEventListener('click', unpauseGame);
  if (pauseMainMenuBtn) pauseMainMenuBtn.addEventListener('click', pauseReturnToMainMenu);

  // Settings toggles
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      const isOn = soundToggle.textContent === 'ON';
      soundToggle.textContent = isOn ? 'OFF' : 'ON';
      soundToggle.classList.toggle('off', isOn);
      setSoundEnabled(!isOn);
    });
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      const isOn = musicToggle.textContent === 'ON';
      musicToggle.textContent = isOn ? 'OFF' : 'ON';
      musicToggle.classList.toggle('off', isOn);
      setMusicEnabled(!isOn);
    });
  }
}

// Called when user clicks start - shows intro first
function startGame() {
  startIntro();
}

// Actually starts the gameplay (called after intro)
function startGameActual() {
  resetGameState();
  resetTrack();
  resetObstacles();
  resetPlayer();
  resetCamera();
  resetKeys();

  gameState.isRunning = true;
  clock.start();

  // Hide all menu screens
  hideAllMenus();
  gameOverScreen.style.display = 'none';

  // Start audio
  resumeAudio();
  resetAudio();
  startMusic();

  updateUI();
}

// Menu navigation functions
function hideAllMenus() {
  if (menuOverlay) menuOverlay.classList.add('hidden');
  if (mainMenu) mainMenu.style.display = 'none';
  if (howtoScreen) howtoScreen.style.display = 'none';
  if (aboutScreen) aboutScreen.style.display = 'none';
  if (settingsScreen) settingsScreen.style.display = 'none';
}

function showMainMenu() {
  // First hide all sub-screens
  if (mainMenu) mainMenu.style.display = 'none';
  if (howtoScreen) howtoScreen.style.display = 'none';
  if (aboutScreen) aboutScreen.style.display = 'none';
  if (settingsScreen) settingsScreen.style.display = 'none';

  // Show overlay and main menu
  if (menuOverlay) menuOverlay.classList.remove('hidden');
  if (mainMenu) mainMenu.style.display = 'block';
}

function showHowtoScreen() {
  if (mainMenu) mainMenu.style.display = 'none';
  if (howtoScreen) howtoScreen.style.display = 'block';
  if (aboutScreen) aboutScreen.style.display = 'none';
  if (settingsScreen) settingsScreen.style.display = 'none';
}

function showAboutScreen() {
  if (mainMenu) mainMenu.style.display = 'none';
  if (howtoScreen) howtoScreen.style.display = 'none';
  if (aboutScreen) aboutScreen.style.display = 'block';
  if (settingsScreen) settingsScreen.style.display = 'none';
}

function showSettingsScreen() {
  if (mainMenu) mainMenu.style.display = 'none';
  if (howtoScreen) howtoScreen.style.display = 'none';
  if (aboutScreen) aboutScreen.style.display = 'none';
  if (settingsScreen) settingsScreen.style.display = 'block';
}

function returnToMainMenu() {
  // Reset game state
  gameState.isRunning = false;
  gameState.isGameOver = false;

  // Stop all audio when returning to menu
  stopAllAudio();

  // Hide game over, show main menu
  gameOverScreen.style.display = 'none';
  showMainMenu();
}



// Pause game functions
function togglePause() {
  if (!gameState.isRunning || gameState.isGameOver) return;
  
  if (gameState.isPaused) {
    unpauseGame();
  } else {
    pauseGame();
  }
}

function pauseGame() {
  gameState.isPaused = true;
  if (pauseOverlay) pauseOverlay.classList.add('visible');
  stopMusic();
}

function unpauseGame() {
  gameState.isPaused = false;
  if (pauseOverlay) pauseOverlay.classList.remove('visible');
  startMusic();
}

function pauseReturnToMainMenu() {
  unpauseGame();
  returnToMainMenu();
}
// Restart skips intro
function restartGame() {
  startGameActual();
}

function gameOver() {
  gameState.isRunning = false;
  gameState.isGameOver = true;

  // Stop all audio and play game over sound
  stopAllAudio();
  playSound('gameOver');

  // Ensure player is visible
  const player = getPlayer();
  if (player) player.visible = true;

  // Calculate efficiency and rating
  const { avgSpeed, rating } = calculateEfficiency();

  // Format time as M:SS
  const minutes = Math.floor(gameState.elapsedTime / 60);
  const seconds = Math.floor(gameState.elapsedTime % 60);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Show game over screen with all metrics
  gameOverScreen.style.display = 'block';
  finalScoreElement.textContent = Math.floor(gameState.score);
  if (finalTimeElement) {
    finalTimeElement.textContent = timeString;
  }
  if (finalAvgSpeedElement) {
    finalAvgSpeedElement.textContent = avgSpeed.toFixed(1);
  }
  if (finalRatingElement) {
    finalRatingElement.textContent = rating;
    finalRatingElement.className = `rating-${rating}`;
  }
  if (finalBeerElement) {
    finalBeerElement.textContent = `${Math.floor(Math.max(0, gameState.beer))}%`;
  }
}

function checkCollisions() {
  // God mode skips all death/damage checks
  if (godMode) {
    // Still collect items in god mode
    const playerBox = getPlayerBoundingBox();
    if (playerBox) {
      const collectibles = getActiveCollectibles();
      for (const collectible of collectibles) {
        if (!collectible.visible) continue;
        const collectibleBox = new THREE.Box3().setFromObject(collectible);
        if (playerBox.intersectsBox(collectibleBox)) {
          const refillAmount = collectItem(collectible);
          refillBeer(refillAmount);
          playSound('beerCollect');
        }
      }
      // Also collect powerups in god mode
      const powerups = getActivePowerups();
      for (const powerup of powerups) {
        if (!powerup.visible) continue;
        const powerupBox = new THREE.Box3().setFromObject(powerup);
        if (playerBox.intersectsBox(powerupBox)) {
          const { type, config } = collectPowerup(powerup);
          activatePowerup(type, config);
        }
      }
    }
    return;
  }

  // Check if beer is empty (game over)
  if (gameState.beer <= 0) {
    gameOver();
    return;
  }

  // Check if player fell to death (spill all beer)
  if (hasFallenToDeath()) {
    gameState.beer = 0;
    gameOver();
    return;
  }

  // Skip other collision checks if falling
  if (isPlayerFalling()) {
    return;
  }

  const playerBox = getPlayerBoundingBox();
  if (!playerBox) return;

  // Check if player is over a gap (and not jumping)
  const playerZ = getPlayerZ();
  if (isOverGap(playerZ) && !isPlayerJumping()) {
    // Ghost powerup lets you float over gaps
    if (!gameState.activePowerups.ghost.active) {
      startFalling();
      return;
    }
  }

  // Check obstacle collisions (only if not invincible and not ghost)
  const isGhost = gameState.activePowerups.ghost.active;

  if (!gameState.isInvincible && !isGhost) {
    const obstacles = getActiveObstacles();
    for (const obstacle of obstacles) {
      if (!obstacle.visible) continue;

      const obstacleBox = new THREE.Box3().setFromObject(obstacle);

      if (playerBox.intersectsBox(obstacleBox)) {
        // Check if shield is active
        if (gameState.activePowerups.shield.active) {
          // Shield absorbs the hit
          gameState.activePowerups.shield.active = false;
          gameState.activePowerups.shield.timer = 0;

          // Stop shield loop and play break sound
          stopPowerupLoop('shield');
          playSound('shieldBreak');

          // Start invincibility period (shorter)
          gameState.isInvincible = true;
          gameState.invincibilityTimer = 0.5;

          // Visual feedback
          flashPlayer();
          showPowerupNotification('Shield Broken!', '#2ecc71');

          break;
        }

        // Collision! Spill beer and slow down (don't die)
        spillBeer(CONFIG.beer.spillRates.obstacleHit, 'hit');

        // Play obstacle hit sound
        playSound('obstacleHit');

        // Slow down
        gameState.speed *= CONFIG.beer.hitSpeedPenalty;
        gameState.speed = Math.max(gameState.speed, CONFIG.speed.initial * 0.5);

        // Start invincibility period
        gameState.isInvincible = true;
        gameState.invincibilityTimer = CONFIG.beer.hitInvincibilityDuration;

        // Flash the player to indicate hit
        flashPlayer();

        break;  // Only process one hit per frame
      }
    }
  }

  // Check collectible collisions (beer pickups)
  const collectibles = getActiveCollectibles();
  for (const collectible of collectibles) {
    if (!collectible.visible) continue;

    const collectibleBox = new THREE.Box3().setFromObject(collectible);

    if (playerBox.intersectsBox(collectibleBox)) {
      // Collect beer to refill
      const refillAmount = collectItem(collectible);
      refillBeer(refillAmount);
      playSound('beerCollect');
      // Small score bonus for collecting
      gameState.score += 5;
    }
  }

  // Check powerup collisions
  const powerups = getActivePowerups();
  for (const powerup of powerups) {
    if (!powerup.visible) continue;

    const powerupBox = new THREE.Box3().setFromObject(powerup);

    if (playerBox.intersectsBox(powerupBox)) {
      // Collect powerup
      const { type, config } = collectPowerup(powerup);
      activatePowerup(type, config);
      // Bonus score for powerup
      gameState.score += 10;
    }
  }
}

// Flash the player mesh to indicate a hit
function flashPlayer() {
  const player = getPlayer();
  if (!player) return;

  // Store original color
  const originalColor = player.material.color.getHex();

  // Flash red
  player.material.color.setHex(0xff0000);

  // Return to original color after short delay
  setTimeout(() => {
    if (player && player.material) {
      player.material.color.setHex(originalColor);
    }
  }, 100);
}

function updateSpeed(delta) {
  // Gradually increase speed over time
  if (gameState.speed < CONFIG.speed.max) {
    gameState.speed += CONFIG.speed.acceleration * delta;
    gameState.speed = Math.min(gameState.speed, CONFIG.speed.max);
  }
}

function updateScore(delta) {
  // Score based on distance traveled, with powerup modifier
  const baseScore = gameState.speed * delta * 0.5;
  gameState.score += baseScore * gameState.powerupScoreModifier;
}

function updateUI() {
  scoreElement.textContent = `Distance: ${Math.floor(gameState.score)}`;

  // Format time as M:SS
  const minutes = Math.floor(gameState.elapsedTime / 60);
  const seconds = Math.floor(gameState.elapsedTime % 60);
  if (timeElement) {
    timeElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const speedMultiplier = (gameState.speed / CONFIG.speed.initial).toFixed(1);
  speedElement.textContent = `Speed: ${speedMultiplier}x${godMode ? ' [GOD MODE]' : ''}`;

  // Update beer meter
  const beerPercent = Math.max(0, Math.min(100, gameState.beer));
  if (beerFillElement) {
    beerFillElement.style.height = `${beerPercent}%`;

    // Change color based on beer level
    if (beerPercent > 50) {
      beerFillElement.style.background = 'linear-gradient(to top, #f5a623, #ffd93d)';
    } else if (beerPercent > 25) {
      beerFillElement.style.background = 'linear-gradient(to top, #e67e22, #f5a623)';
    } else {
      beerFillElement.style.background = 'linear-gradient(to top, #c0392b, #e74c3c)';
    }
  }
  if (beerPercentElement) {
    beerPercentElement.textContent = `${Math.floor(beerPercent)}%`;
  }
}

function updateInvincibility(delta) {
  if (gameState.isInvincible) {
    gameState.invincibilityTimer -= delta;
    if (gameState.invincibilityTimer <= 0) {
      gameState.isInvincible = false;
      gameState.invincibilityTimer = 0;
    }

    // Flash player during invincibility
    const player = getPlayer();
    if (player) {
      player.visible = Math.floor(gameState.invincibilityTimer * 10) % 2 === 0;
    }
  } else {
    // Ensure player is visible when not invincible
    const player = getPlayer();
    if (player) player.visible = true;
  }
}

// Powerup notification timeout
let notificationTimeout = null;

// Show powerup pickup notification
function showPowerupNotification(name, color) {
  if (!powerupNotification) return;

  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  powerupNotification.textContent = name + '!';
  powerupNotification.style.color = color;
  powerupNotification.classList.add('show');

  notificationTimeout = setTimeout(() => {
    powerupNotification.classList.remove('show');
  }, 1500);
}

// Activate a powerup
function activatePowerup(type, config) {
  const powerup = gameState.activePowerups[type];
  if (!powerup) return;

  // Play powerup collect sound
  playSound('powerupCollect');

  // Activate and set timer
  powerup.active = true;
  powerup.timer = config.duration;

  // Start powerup loop sound
  startPowerupLoop(type);

  // Apply immediate effects
  switch (type) {
    case 'goldenBeer':
      // Full beer refill
      refillBeer(100);
      break;
    case 'shield':
      // Shield is passive - just display
      break;
    case 'speedSurge':
      // Speed boost handled in updatePowerups
      break;
    case 'slowMo':
      // Speed reduction handled in updatePowerups
      break;
    case 'ghost':
      // Ghost is passive - handled in collisions
      break;
    case 'magnet':
      // Magnet is passive - handled in update
      break;
    case 'doubleScore':
      // Score multiplier is passive
      break;
  }

  // Show notification
  const colorHex = '#' + config.color.toString(16).padStart(6, '0');
  showPowerupNotification(config.name, colorHex);

  // Recalculate modifiers
  updatePowerupModifiers();
}

// Update powerup modifiers (speed and score)
function updatePowerupModifiers() {
  let speedMod = 1;
  let scoreMod = 1;

  // Speed Surge
  if (gameState.activePowerups.speedSurge.active) {
    speedMod *= CONFIG.powerups.types.speedSurge.speedMultiplier;
    scoreMod *= CONFIG.powerups.types.speedSurge.scoreMultiplier;
  }

  // Slow-Mo
  if (gameState.activePowerups.slowMo.active) {
    speedMod *= CONFIG.powerups.types.slowMo.speedMultiplier;
    // Score still accumulates normally during slow-mo
  }

  // Double Score
  if (gameState.activePowerups.doubleScore.active) {
    scoreMod *= CONFIG.powerups.types.doubleScore.scoreMultiplier;
  }

  gameState.powerupSpeedModifier = speedMod;
  gameState.powerupScoreModifier = scoreMod;
}

// Update all active powerups
function updatePowerups(delta) {
  let needsModifierUpdate = false;

  for (const type in gameState.activePowerups) {
    const powerup = gameState.activePowerups[type];
    if (!powerup.active) continue;

    // Decrease timer
    powerup.timer -= delta;

    // Check if expired
    if (powerup.timer <= 0) {
      powerup.active = false;
      powerup.timer = 0;
      needsModifierUpdate = true;
      // Stop the powerup loop sound (plays expire sound automatically)
      stopPowerupLoop(type);
    }
  }

  // Golden Beer effect: no beer drain
  if (gameState.activePowerups.goldenBeer.active) {
    // Restore any beer that was drained this frame
    // (This is a bit hacky but works with the current system)
    // We'll handle this by making spillBeer check for golden beer
  }

  // Magnet effect: attract items
  if (gameState.activePowerups.magnet.active) {
    const playerX = getPlayerX();
    const playerZ = getPlayerZ();
    const attractRadius = CONFIG.powerups.types.magnet.attractRadius;
    applyMagnetEffect(playerX, playerZ, attractRadius, delta);
  }

  // Update modifiers if any powerup expired
  if (needsModifierUpdate) {
    updatePowerupModifiers();
  }

  // Update UI
  updatePowerupUI();
}

// Update powerup indicator UI
function updatePowerupUI() {
  for (const type in powerupIndicators) {
    const indicator = powerupIndicators[type];
    if (!indicator) continue;

    const powerup = gameState.activePowerups[type];
    if (powerup && powerup.active) {
      indicator.classList.add('active');
      const timerEl = indicator.querySelector('.powerup-timer');
      if (timerEl) {
        timerEl.textContent = powerup.timer.toFixed(1);
      }
    } else {
      indicator.classList.remove('active');
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (gameState.isRunning && !gameState.isPaused) {
    // Track elapsed time
    gameState.elapsedTime += delta;

    // Update powerups first (affects speed modifiers)
    updatePowerups(delta);

    // Update game systems
    updateTrack(delta);
    updateObstacles(delta);
    updatePlayer(delta);

    // Update powerup visual effects
    updatePowerupVisuals(delta);

    // Update camera to follow player height and respect tunnel ceilings
    const trackHeight = getTrackHeightAtPlayer();
    const playerZ = getPlayerZ();
    // Check ceiling at player position and slightly ahead, use lowest ceiling
    // This ensures camera stays low until fully exiting the tunnel
    const ceilingAtPlayer = getCeilingHeightAt(playerZ);
    const ceilingAhead = getCeilingHeightAt(playerZ + 8);
    const ceilingHeight = Math.min(ceilingAtPlayer, ceilingAhead);
    updateCamera(trackHeight, ceilingHeight);

    // Game logic
    updateInvincibility(delta);
    checkCollisions();
    updateSpeed(delta);
    updateScore(delta);
    updateUI();
  }

  // Always render
  render();
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
